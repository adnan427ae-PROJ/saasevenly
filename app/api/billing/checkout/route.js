// POST /api/billing/checkout  { plan: "monthly" | "yearly" }
//
// Starts a Stripe Checkout for the logged-in founder's saasevenly
// subscription (saasevenly's own revenue — not their customers' payments).
import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import {
  BILLING_PLANS,
  isBillingConfigured,
  getBillingStripe,
  setTenantBilling,
} from "@/lib/billing";

export async function POST(request) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const plan = BILLING_PLANS[body.plan];
  if (!plan) return NextResponse.json({ error: "Unknown plan." }, { status: 400 });

  if (!isBillingConfigured()) {
    return NextResponse.json(
      {
        error:
          "saasevenly billing isn't connected yet. Add SAASEVENLY_STRIPE_SECRET_KEY " +
          "(your platform Stripe secret key) to .env.local and restart the server.",
      },
      { status: 500 }
    );
  }

  const stripe = getBillingStripe();
  const origin = request.headers.get("origin") || new URL(request.url).origin;

  try {
    // Reuse the founder's Stripe customer, or create one on first subscribe.
    let customerId = tenant.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: tenant.email,
        metadata: { tenant_id: String(tenant.id) },
      });
      customerId = customer.id;
      await setTenantBilling(tenant.id, { customerId });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: plan.usd * 100,
            recurring: { interval: plan.interval },
            product_data: {
              name: `saasevenly — ${plan.label}`,
              description: "Localized pricing for your SaaS. " + plan.blurb,
            },
          },
        },
      ],
      // The webhook uses this to know WHICH founder just paid.
      metadata: { tenant_id: String(tenant.id), plan: plan.id },
      subscription_data: { metadata: { tenant_id: String(tenant.id), plan: plan.id } },
      success_url: `${origin}/billing?status=success`,
      cancel_url: `${origin}/billing?status=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing/checkout]", err.message);
    return NextResponse.json({ error: err.message || "Could not start checkout." }, { status: 500 });
  }
}
