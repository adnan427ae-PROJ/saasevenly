// ---------------------------------------------------------------------------
// tenants.js  —  read/write founders ("tenants") and their pricing settings.
//
// A "tenant" is one founder using saasevenly. Each has their own pricing
// settings, their own embed site key, their allowed domains, and (later) their
// own connected Stripe account. Backed by Supabase Postgres, so every function
// is async.
// ---------------------------------------------------------------------------
import { requireDb, hasDb } from "./db";
import { parseDomains } from "./domains";
import { DEMO_TENANT } from "./demoData";
import crypto from "crypto";

// Turn a DB row into the { baseUSD, endingStyle, ... } shape the pricing code
// already expects, so nothing downstream had to change its logic.
export function rowToSettings(row) {
  return {
    baseUSD: Number(row.base_usd),
    endingStyle: row.ending_style,
    // passthrough is fixed at 100 now (the maxDiscount cap is the lever).
    passthrough: 100,
    maxDiscount: Number(row.max_discount),
    chargePremium: Boolean(row.charge_premium),
    paymentProvider: row.payment_provider,
    allowedDomains: parseDomains(row.allowed_domains),
  };
}

export async function getTenantById(id) {
  const sql = requireDb();
  const rows = await sql`SELECT * FROM tenants WHERE id = ${id}`;
  return rows[0] || null;
}

export async function getTenantByEmail(email) {
  const sql = requireDb();
  const rows = await sql`SELECT * FROM tenants WHERE email = ${String(email).toLowerCase()}`;
  return rows[0] || null;
}

export async function getTenantBySiteKey(siteKey) {
  if (!siteKey || !hasDb()) return null;
  try {
    const sql = requireDb();
    const rows = await sql`SELECT * FROM tenants WHERE site_key = ${siteKey}`;
    return rows[0] || null;
  } catch {
    // Public embeds resolve through here — fall through to the default tenant
    // rather than failing the request outright.
    return null;
  }
}

// The seeded demo tenant — used by the public /pricing demo and as a fallback.
//
// This one NEVER throws: the public pages call it, and a showcase deploy (or a
// fresh clone with no DATABASE_URL yet) should still render rather than 500.
// See lib/demoData.js.
export async function getDefaultTenant() {
  if (!hasDb()) return DEMO_TENANT;
  try {
    const sql = requireDb();
    const rows = await sql`SELECT * FROM tenants ORDER BY id ASC LIMIT 1`;
    return rows[0] || DEMO_TENANT;
  } catch {
    // Database unreachable (paused, rotated password, network) — keep the
    // public pages alive on built-in demo data.
    return DEMO_TENANT;
  }
}

export async function createTenant({ email, passwordHash, name }) {
  const sql = requireDb();
  const siteKey = "se_live_" + crypto.randomBytes(12).toString("hex");
  const rows = await sql`
    INSERT INTO tenants
      (email, password_hash, name, site_key, max_discount)
    VALUES (
      ${String(email).toLowerCase()}, ${passwordHash}, ${name || null}, ${siteKey}, 20
    )
    RETURNING *`;
  return rows[0];
}

// Save the pricing settings for one tenant (partial update, merged).
export async function updateTenantSettings(tenantId, next) {
  const cur = await getTenantById(tenantId);
  if (!cur) return null;
  const sql = requireDb();

  const base_usd = Number(next.baseUSD ?? cur.base_usd) || Number(cur.base_usd);
  const ending_style = ["round", ".99", "9"].includes(next.endingStyle)
    ? next.endingStyle
    : cur.ending_style;
  const max_discount = clamp(next.maxDiscount ?? cur.max_discount, 0, 50);
  const charge_premium =
    next.chargePremium === undefined ? cur.charge_premium : Boolean(next.chargePremium);
  const payment_provider = ["stripe", "paypal", "razorpay", "dodo"].includes(next.paymentProvider)
    ? next.paymentProvider
    : cur.payment_provider;

  const rows = await sql`
    UPDATE tenants SET
      base_usd = ${base_usd},
      ending_style = ${ending_style},
      max_discount = ${max_discount},
      charge_premium = ${charge_premium},
      payment_provider = ${payment_provider}
    WHERE id = ${tenantId}
    RETURNING *`;
  return rows[0];
}

// Save the tenant's allowed-domains allowlist (the anti-piracy lock). Accepts a
// raw string or array; stored normalized and comma-joined.
export async function updateTenantDomains(tenantId, domainsInput) {
  const sql = requireDb();
  const clean = Array.isArray(domainsInput)
    ? parseDomains(domainsInput.join(","))
    : parseDomains(domainsInput);
  // De-dupe while preserving order.
  const unique = [...new Set(clean)];
  const rows = await sql`
    UPDATE tenants SET allowed_domains = ${unique.join(",")}
    WHERE id = ${tenantId}
    RETURNING *`;
  return rows[0] || null;
}

function clamp(v, lo, hi) {
  const n = Number(v);
  if (Number.isNaN(n)) return lo;
  return Math.min(hi, Math.max(lo, Math.round(n)));
}
