// POST /api/billing/webhook
//
// Stripe webhook for saasevenly's OWN billing. This is what actually flips a
// founder's subscription_active flag — payment turns it on, cancellation
// turns it off (which makes their embed stop localizing).
//
// Setup (Stripe Dashboard → Developers → Webhooks → Add endpoint):
//   URL:    https://YOUR-DOMAIN.com/api/billing/webhook
//   Events: checkout.session.completed,
//           customer.subscription.updated, customer.subscription.deleted
// Then put the endpoint's signing secret in .env.local as
// SAASEVENLY_STRIPE_WEBHOOK_SECRET. For local testing:
//   stripe listen --forward-to localhost:3000/api/billing/webhook
import { NextResponse } from "next/server";
import {
  isBillingConfigured,
  getBillingStripe,
  setTenantBilling,
  findTenantByStripeCustomer,
  findTenantByStripeSubscription,
} from "@/lib/billing";

export async function POST(request) {
  if (!isBillingConfigured()) {
    return NextResponse.json({ error: "Billing not configured." }, { status: 500 });
  }

  const payload = await request.text(); // raw body — required for signatures
  const secret = process.env.SAASEVENLY_STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (secret) {
      // Production path: verify the event really came from Stripe.
      event = getBillingStripe().webhooks.constructEvent(
        payload,
        request.headers.get("stripe-signature"),
        secret
      );
    } else {
      // Dev convenience only — set the secret before going live.
      console.warn("[billing/webhook] SAASEVENLY_STRIPE_WEBHOOK_SECRET not set; accepting unverified event.");
      event = JSON.parse(payload);
    }
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  const obj = event.data?.object || {};

  switch (event.type) {
    case "checkout.session.completed": {
      // Founder just paid. Activate them and remember their Stripe ids.
      const tenantId = Number(obj.metadata?.tenant_id);
      if (tenantId) {
        await setTenantBilling(tenantId, {
          customerId: typeof obj.customer === "string" ? obj.customer : null,
          subscriptionId: typeof obj.subscription === "string" ? obj.subscription : null,
          plan: obj.metadata?.plan || null,
          active: true,
        });
      }
      break;
    }
    case "customer.subscription.updated": {
      // Keeps the flag honest through renewals, failed payments, plan
      // switches and cancellations-at-period-end.
      const tenant =
        (await findTenantByStripeSubscription(obj.id)) ||
        (await findTenantByStripeCustomer(typeof obj.customer === "string" ? obj.customer : null)) ||
        (obj.metadata?.tenant_id ? { id: Number(obj.metadata.tenant_id) } : null);
      if (tenant) {
        const active = ["active", "trialing", "past_due"].includes(obj.status);
        await setTenantBilling(tenant.id, {
          subscriptionId: obj.id,
          plan: obj.metadata?.plan || null,
          active,
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      // Churned — the embed stops localizing until they resubscribe.
      const tenant =
        (await findTenantByStripeSubscription(obj.id)) ||
        (await findTenantByStripeCustomer(typeof obj.customer === "string" ? obj.customer : null));
      if (tenant) await setTenantBilling(tenant.id, { active: false });
      break;
    }
    default:
      // Ignore everything else.
      break;
  }

  return NextResponse.json({ received: true });
}
