// ---------------------------------------------------------------------------
// billing.js  —  saasevenly's OWN billing (founders paying for saasevenly).
//
// This is separate from lib/payments/* — those charge the founder's CUSTOMERS
// through the founder's gateway keys. This file charges the FOUNDER for their
// saasevenly subscription, through saasevenly's platform Stripe account
// (SAASEVENLY_STRIPE_SECRET_KEY).
// ---------------------------------------------------------------------------
import Stripe from "stripe";
import { requireDb } from "./db";
import { getTenantById } from "./tenants";

// What saasevenly costs. Edit here to change pricing everywhere.
export const BILLING_PLANS = {
  monthly: { id: "monthly", label: "Monthly", usd: 9, interval: "month", blurb: "Cancel anytime." },
  yearly:  { id: "yearly",  label: "Yearly",  usd: 90, interval: "year",  blurb: "2 months free — pay for 10, get 12." },
};

export function isBillingConfigured() {
  const k = process.env.SAASEVENLY_STRIPE_SECRET_KEY || "";
  return k.startsWith("sk_");
}

export function getBillingStripe() {
  return new Stripe(process.env.SAASEVENLY_STRIPE_SECRET_KEY);
}

// ---- tenant billing state ----

export async function setTenantBilling(tenantId, { customerId, subscriptionId, plan, active }) {
  const cur = await getTenantById(tenantId);
  if (!cur) return null;
  const sql = requireDb();
  // COALESCE(NULL, existing) leaves a field untouched when we don't pass it.
  const rows = await sql`
    UPDATE tenants SET
      stripe_customer_id = COALESCE(${customerId ?? null}, stripe_customer_id),
      stripe_subscription_id = COALESCE(${subscriptionId ?? null}, stripe_subscription_id),
      billing_plan = COALESCE(${plan ?? null}, billing_plan),
      subscription_active = COALESCE(${active === undefined ? null : Boolean(active)}, subscription_active)
    WHERE id = ${tenantId}
    RETURNING *`;
  return rows[0] || null;
}

export async function findTenantByStripeCustomer(customerId) {
  if (!customerId) return null;
  const sql = requireDb();
  const rows = await sql`SELECT * FROM tenants WHERE stripe_customer_id = ${customerId}`;
  return rows[0] || null;
}

export async function findTenantByStripeSubscription(subscriptionId) {
  if (!subscriptionId) return null;
  const sql = requireDb();
  const rows = await sql`SELECT * FROM tenants WHERE stripe_subscription_id = ${subscriptionId}`;
  return rows[0] || null;
}
