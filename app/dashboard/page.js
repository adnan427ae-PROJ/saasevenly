// Dashboard (server component): requires login, loads THIS founder's settings,
// the country table, and today's exchange rates, then hands them to the form.
import { redirect } from "next/navigation";
import { listCountries } from "@/lib/countries";
import { getRates } from "@/lib/rates";
import { listProviders } from "@/lib/payments";
import { getCurrentTenant, isAdminEmail } from "@/lib/auth";
import { rowToSettings } from "@/lib/tenants";
import { listProducts } from "@/lib/products";
import DashboardClient from "./DashboardClient";
import DashboardHeader from "./DashboardHeader";

export const dynamic = "force-dynamic"; // always read the latest settings/rates

export default async function DashboardPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/login");

  const settings = rowToSettings(tenant);
  const products = await listProducts(tenant.id);
  const { rates, fetchedAt } = await getRates();

  // Attach each country's USD->local FX rate so the client can do live math
  // without another round-trip.
  const countries = listCountries().map((c) => ({
    ...c,
    fxRate: rates[c.currency] ?? 1,
  }));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <DashboardHeader
        email={tenant.email}
        subscriptionActive={Boolean(tenant.subscription_active)}
        isAdmin={isAdminEmail(tenant.email)}
        freeUntil={tenant.free_until}
      />

      <DashboardClient
        initialSettings={settings}
        countries={countries}
        ratesFetchedAt={fetchedAt}
        providers={listProviders()}
        siteKey={tenant.site_key}
        initialProducts={products}
        initialDomains={settings.allowedDomains}
      />
    </main>
  );
}
