// POST /api/billing/toggle  { active: true|false }
//
// TEMPORARY: lets the logged-in founder flip their own saasevenly subscription
// on/off, so you can SEE the gating work. In the real product this flag is
// driven by saasevenly's own Stripe billing webhooks (next increment), not a
// button.
import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { setSubscriptionActive } from "@/lib/tenants";
import { rowToSettings } from "@/lib/tenants";

export async function POST(request) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const { active } = await request.json().catch(() => ({}));
  const updated = await setSubscriptionActive(tenant.id, Boolean(active));
  return NextResponse.json({ ok: true, subscriptionActive: Boolean(updated.subscription_active) });
}
