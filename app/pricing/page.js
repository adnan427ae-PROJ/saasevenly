// Pricing page (server component). If a founder is logged in this is THEIR
// live pricing page — their plans, their settings, their site key. Logged-out
// visitors see the demo tenant's page instead.
import { getCurrentTenant } from "@/lib/auth";
import { getDefaultTenant, rowToSettings } from "@/lib/tenants";
import { listProducts } from "@/lib/products";
import { listCountries } from "@/lib/countries";
import { getRates } from "@/lib/rates";
import PricingClient from "./PricingClient";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const own = await getCurrentTenant();
  const tenant = own || (await getDefaultTenant());
  const settings = rowToSettings(tenant);
  const { rates } = await getRates();

  // Group products by plan name so "Pro $19/mo" and "Pro $190/yr" become one
  // card with a Monthly/Yearly toggle.
  const plans = [];
  for (const p of await listProducts(tenant.id)) {
    let plan = plans.find((x) => x.name === p.name);
    if (!plan) {
      plan = { name: p.name, month: null, quarter: null, year: null };
      plans.push(plan);
    }
    plan[p.interval] = { id: p.id, base: p.baseUSD };
  }

  // US first, the rest alphabetical — feeds the "preview as" selector.
  const countries = listCountries()
    .map(({ code, name, flag, currency, symbol, decimals, pppFactor }) => ({
      code,
      name,
      flag,
      currency,
      symbol,
      decimals,
      pppFactor,
      fxRate: rates[currency] ?? 1,
    }))
    .sort((a, b) => (a.code === "US" ? -1 : b.code === "US" ? 1 : a.name.localeCompare(b.name)));

  return (
    <PricingClient
      plans={plans}
      siteKey={tenant.site_key}
      countries={countries}
      settings={settings}
      isOwn={Boolean(own)}
    />
  );
}
