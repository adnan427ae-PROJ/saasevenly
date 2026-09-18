// ---------------------------------------------------------------------------
// POST /api/checkout
//
// Creates a REAL hosted checkout with whichever payment gateway the founder
// picked in the dashboard (Stripe / PayPal / Razorpay), priced in the visitor's
// local currency at their fair PPP price. Returns the URL to redirect to.
//
// Body (JSON): { base: 19, plan: "Pro", country: "IN" }
//
// SECURITY: the price is ALWAYS recomputed here on the server from saved
// settings. We never trust a price sent by the browser.
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { getCountry } from "@/lib/countries";
import { getRate } from "@/lib/rates";
import { detectCountry } from "@/lib/geo";
import { localPrice, effectiveRatio } from "@/lib/pricing";
import { getProvider } from "@/lib/payments";
import { resolveTenantFromBody, isTenantActive, isDomainAllowed } from "@/lib/requestTenant";
import { rowToSettings } from "@/lib/tenants";
import { getProduct } from "@/lib/products";
import { isDemoTenant } from "@/lib/demoData";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  // Which founder owns this checkout?
  const tenant = await resolveTenantFromBody(body);
  if (!tenant) {
    return NextResponse.json({ error: "Unknown site key." }, { status: 404 });
  }
  // The built-in demo tenant has no gateway keys and never will — it exists to
  // show the pricing, not to take money. Say so plainly instead of failing with
  // a confusing gateway error.
  if (isDemoTenant(tenant)) {
    return NextResponse.json(
      {
        demo: true,
        error:
          "This is the public demo, so there's no real gateway behind it. On your own deployment this button opens a real checkout, in this currency, at this exact price — paid straight into your own Stripe, PayPal, Razorpay or Dodo account.",
      },
      { status: 200 }
    );
  }
  // Anti-piracy: reject checkouts started from a domain the founder didn't register.
  if (!isDomainAllowed(tenant, request)) {
    return NextResponse.json(
      { error: "This domain isn't authorized for this site key." },
      { status: 403 }
    );
  }
  if (!isTenantActive(tenant)) {
    return NextResponse.json(
      { error: "Unknown site key — no account matches it on this instance." },
      { status: 404 }
    );
  }
  const settings = rowToSettings(tenant);

  // 1. Which gateway is active?
  const provider = getProvider(settings.paymentProvider);
  if (!provider) {
    return NextResponse.json(
      { error: `Unknown payment provider "${settings.paymentProvider}".` },
      { status: 500 }
    );
  }

  // 2. Is it configured? If not, tell the founder exactly what to add.
  if (!provider.isConfigured()) {
    return NextResponse.json(
      {
        error:
          `${provider.label} isn't connected yet. Add ${provider.requiredEnv.join(
            " and "
          )} to .env.local, then restart the server.`,
        docsUrl: provider.docsUrl,
      },
      { status: 500 }
    );
  }

  // 3. Resolve which plan is being bought.
  //    Prefer an explicit productId (from the founder's catalog); otherwise fall
  //    back to a raw base/plan passed by the page.
  let base, plan, interval = "month", externalId = null;
  if (body.productId) {
    const product = await getProduct(tenant.id, Number(body.productId));
    if (!product) {
      return NextResponse.json({ error: "Unknown plan." }, { status: 404 });
    }
    base = product.baseUSD;
    plan = product.name;
    interval = product.interval;
    externalId = product.externalId;
  } else {
    base = Number(body.base) || Number(settings.baseUSD);
    plan = String(body.plan || "Subscription");
  }

  // Work out the fair local price (same math as the rest of the app).
  const code = await detectCountry(request, body.country);
  const country = getCountry(code);
  const fxRate = await getRate(country.currency);

  const ratio = effectiveRatio(
    country.pppFactor,
    settings.passthrough,
    settings.chargePremium,
    settings.maxDiscount
  );
  const localValue = localPrice(
    base,
    ratio,
    fxRate,
    settings.endingStyle,
    country.decimals,
    settings.maxDiscount
  );

  // 4. Decide the charge currency. If this gateway can't settle the local
  //    currency, fall back to the fair price converted to USD.
  let currency = country.currency;
  let amount = localValue;
  let fellBackToUSD = false;

  if (!provider.supportsCurrency(country.currency)) {
    currency = "USD";
    // Fair price directly in USD (fxRate 1), with the same discount floor.
    amount = localPrice(base, ratio, 1, settings.endingStyle, 2, settings.maxDiscount);
    fellBackToUSD = true;
  }

  // 5. Absolute origin for success/cancel redirects.
  const origin = request.headers.get("origin") || new URL(request.url).origin;

  // 6. Hand off to the chosen gateway.
  try {
    const { url } = await provider.createCheckout({
      plan,
      country,
      amount,
      currency,
      decimals: country.decimals,
      origin,
      interval, // 'month' | 'year' (from the plan)
      // Passed to the subscription's metadata so the founder's app can map this
      // back to their own plan and grant the right access.
      metadata: { plan, country: country.code, external_id: externalId || "" },
    });
    return NextResponse.json({
      url,
      provider: provider.id,
      mode: provider.mode,
      currency,
      amount,
      fellBackToUSD,
    });
  } catch (err) {
    console.error(`[checkout] ${provider.id} error:`, err.message);
    return NextResponse.json(
      { error: err.message || "Could not create checkout." },
      { status: 500 }
    );
  }
}
