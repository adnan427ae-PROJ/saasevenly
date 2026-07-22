// POST /api/billing/portal
//
// Opens the Stripe Billing Portal for the logged-in founder so they can
// update cards, switch plans, download invoices, or cancel — all handled by
// Stripe; the webhook keeps our subscription_active flag in sync.
import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { isBillingConfigured, getBillingStripe } from "@/lib/billing";

export async function POST(request) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  if (!isBillingConfigured()) {
    return NextResponse.json({ error: "Billing isn't connected yet." }, { status: 500 });
  }
  if (!tenant.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account yet — subscribe first." }, { status: 400 });
  }

  const origin = request.headers.get("origin") || new URL(request.url).origin;
  try {
    const session = await getBillingStripe().billingPortal.sessions.create({
      customer: tenant.stripe_customer_id,
      return_url: `${origin}/billing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing/portal]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
