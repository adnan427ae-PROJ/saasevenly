// ===========================================================================
// EXAMPLE — runs on the FOUNDER'S backend, not on saasevenly.
//
// "How does my website know a payment succeeded and which plan to unlock?"
//
// When a visitor checks out, saasevenly creates a real Stripe subscription on
// YOUR Stripe account, priced in the visitor's local currency. It stamps the
// plan onto the subscription's metadata:
//
//     metadata: { plan: "Pro", external_id: "price_pro_123", country: "IN" }
//
// Stripe then fires webhooks to YOUR server. You verify them and grant access —
// exactly the same flow as any normal Stripe subscription. The localized price
// changes nothing about fulfillment; you just read the metadata.
//
// This file is a drop-in Next.js route handler. Adapt the framework bits to
// whatever your site uses (Express, Rails, Laravel, etc.) — the logic is the same.
//
// SETUP (in YOUR Stripe dashboard):
//   1. Developers > Webhooks > Add endpoint -> https://yoursite.com/api/stripe-webhook
//   2. Subscribe to: checkout.session.completed, customer.subscription.updated,
//      customer.subscription.deleted, invoice.paid
//   3. Copy the signing secret (whsec_...) into STRIPE_WEBHOOK_SECRET.
// ===========================================================================
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  // 1. VERIFY the event really came from Stripe (never trust the body blindly).
  const sig = request.headers.get("stripe-signature");
  const raw = await request.text(); // the RAW body is required for verification
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Bad signature: ${err.message}`, { status: 400 });
  }

  // 2. ACT on the events you care about.
  switch (event.type) {
    case "checkout.session.completed": {
      // Payment went through and the subscription is created.
      const session = event.data.object;
      // Pull the subscription to read the metadata saasevenly stamped on it.
      const sub = await stripe.subscriptions.retrieve(session.subscription);
      const plan = sub.metadata.plan;             // e.g. "Pro"
      const yourPlanId = sub.metadata.external_id; // e.g. "price_pro_123" (your own id)
      const customerEmail = session.customer_details?.email;

      // 👉 YOUR fulfillment: find the user by email/customer id and unlock `plan`.
      // await db.users.grantPlan({ email: customerEmail, plan, yourPlanId });
      console.log(`[fulfill] grant ${plan} (${yourPlanId}) to ${customerEmail}`);
      break;
    }

    case "invoice.paid":
      // Recurring renewal succeeded — keep their access active.
      break;

    case "customer.subscription.deleted":
      // They cancelled — revoke access.
      // await db.users.revokeByCustomer(event.data.object.customer);
      break;
  }

  return new Response("ok", { status: 200 });
}

// ---------------------------------------------------------------------------
// "How do I show the customer their CURRENT plan + the price they actually pay?"
//
// Two options on your account / "current plan" page:
//
//  (a) Simplest — tag the price like anywhere else and let the saasevenly widget
//      localize it. It will show the same local price for their country:
//          <span data-saasevenly="19">$19</span>
//          <script src="https://saasevenly.com/saasevenly.js?key=se_live_..."></script>
//      For pages that render after load (SPA dashboards), call saasevenlyRefresh()
//      once your price element is on screen.
//
//  (b) Most accurate — show the EXACT amount they're billed, straight from their
//      subscription, so it always matches their invoices:
//
//      const sub = await stripe.subscriptions.retrieve(theirSubscriptionId);
//      const item = sub.items.data[0];
//      const amount = item.price.unit_amount;     // minor units (e.g. paise)
//      const currency = item.price.currency;      // e.g. "inr"
//      // format amount/currency for display
//
// Use (a) for marketing/plan pages, (b) for billing/receipt pages.
// ---------------------------------------------------------------------------
