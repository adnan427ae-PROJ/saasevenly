// ---------------------------------------------------------------------------
// GET /api/price
//
// Detects the visitor's country and returns the localized prices computed from
// the founder's saved settings. The widget (/saasevenly.js) calls this.
//
// Query params:
//   ?country=XX   override detection (for testing other countries)
//   ?bases=19,49  extra base USD prices to compute (the pricing page passes its
//                 three tier prices so each tag gets repriced)
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { getCountry } from "@/lib/countries";
import { getRate } from "@/lib/rates";
import { detectCountry } from "@/lib/geo";
import { computeCountryPricing } from "@/lib/pricing";
import { resolveTenant, isTenantActive, isDomainAllowed } from "@/lib/requestTenant";
import { rowToSettings } from "@/lib/tenants";

const CORS = { "Access-Control-Allow-Origin": "*" };

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const override = searchParams.get("country");
  const basesParam = searchParams.get("bases");

  // Parse the optional comma-separated list of base prices.
  const bases = (basesParam || "")
    .split(",")
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !Number.isNaN(n));

  // Which founder does this embed belong to?
  const tenant = await resolveTenant(request);
  if (!tenant) {
    return NextResponse.json({ ok: false, error: "Unknown site key." }, { status: 404, headers: CORS });
  }
  // DOMAIN GATE (anti-piracy): the site key is public, so we also verify the
  // request's Origin/Referer against the founder's registered domains. A copied
  // key used on someone else's site fails here and gets nothing.
  if (!isDomainAllowed(tenant, request)) {
    return NextResponse.json(
      { ok: false, gated: true, reason: "domain not allowed for this site key" },
      { status: 403, headers: CORS }
    );
  }
  // There's no paid tier to check — saasevenly is free software. The only way
  // this fails is an unknown site key, i.e. no tenant at all.
  if (!isTenantActive(tenant)) {
    return NextResponse.json(
      { ok: false, gated: true, reason: "unknown site key" },
      { status: 404, headers: CORS }
    );
  }

  const settings = rowToSettings(tenant);
  const code = await detectCountry(request, override);
  const country = getCountry(code);
  const fxRate = await getRate(country.currency);

  const { ratio, discount, prices } = computeCountryPricing(
    country,
    settings,
    fxRate,
    bases
  );

  return NextResponse.json({
    ok: true,
    country: country.code,
    countryName: country.name,
    flag: country.flag,
    currency: country.currency,
    symbol: country.symbol,
    decimals: country.decimals,
    pppFactor: country.pppFactor,
    fxRate,
    effectiveRatio: ratio,
    discountPercent: discount,
    passthrough: settings.passthrough,
    endingStyle: settings.endingStyle,
    baseUSD: settings.baseUSD,
    prices, // { "19": { value, display }, ... }
  }, {
    // CORS: allow the widget to call this from ANY website it's embedded on.
    // (The widget itself is also served with Access-Control-Allow-Origin: *.)
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
