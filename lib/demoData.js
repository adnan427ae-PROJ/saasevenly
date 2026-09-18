// ---------------------------------------------------------------------------
// demoData.js  —  the fallback tenant + plans that power the public demo.
//
// Two situations use this:
//
//   1. The showcase deploy (NEXT_PUBLIC_DEMO_MODE=1) has no accounts and no
//      reason to run a database. Building the demo data in means the landing
//      page and /pricing can never break, cost nothing to host, and have
//      nothing to keep awake.
//
//   2. You just cloned the repo and ran `npm run dev` before setting up
//      Postgres. You get a working site to look at instead of a stack trace.
//
// The moment a real DATABASE_URL is reachable, the real demo tenant seeded by
// schema.sql takes over and none of this is used.
// ---------------------------------------------------------------------------

// Shaped exactly like a `tenants` row so rowToSettings() and friends can treat
// it identically. id 0 can never collide with a real BIGSERIAL id.
export const DEMO_TENANT = {
  id: 0,
  email: "demo@saasevenly.local",
  name: "Demo Founder",
  site_key: "se_demo_public",
  allowed_domains: "",
  base_usd: 19,
  ending_style: "9",
  max_discount: 20,
  charge_premium: true,
  payment_provider: "stripe",
  created_at: null,
};

// Matches the plans schema.sql seeds, so the demo looks the same either way.
export const DEMO_PRODUCTS = [
  { id: 1, name: "Starter", baseUSD: 9, interval: "month", externalId: null, sort: 0 },
  { id: 2, name: "Pro", baseUSD: 19, interval: "month", externalId: null, sort: 1 },
  { id: 3, name: "Scale", baseUSD: 49, interval: "month", externalId: null, sort: 2 },
  { id: 4, name: "Starter", baseUSD: 90, interval: "year", externalId: null, sort: 3 },
  { id: 5, name: "Pro", baseUSD: 190, interval: "year", externalId: null, sort: 4 },
  { id: 6, name: "Scale", baseUSD: 490, interval: "year", externalId: null, sort: 5 },
];

export function isDemoTenant(tenant) {
  return Boolean(tenant) && tenant.id === DEMO_TENANT.id;
}
