// ---------------------------------------------------------------------------
// Stripe payment provider.
//
// This is the fully working, tested gateway. It creates a real monthly
// SUBSCRIPTION priced in the visitor's local currency.
// ---------------------------------------------------------------------------
import Stripe from "stripe";
import { isStripeSupported, toMinorUnits } from "@/lib/stripeHelpers";

// Map our interval names to Stripe's recurring config.
function stripeRecurring(interval) {
  if (interval === "year") return { interval: "year" };
  if (interval === "quarter") return { interval: "month", interval_count: 3 };
  return { interval: "month" };
}

export const stripeProvider = {
  id: "stripe",
  label: "Stripe",
  mode: "subscription", // charges a recurring monthly subscription
  blurb: "Cards, Apple/Google Pay, true monthly subscriptions. Best global coverage.",
  requiredEnv: ["STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
  docsUrl: "https://dashboard.stripe.com/test/apikeys",

  // Are the keys present (and not the placeholder from .env.local.example)?
  isConfigured() {
    const k = process.env.STRIPE_SECRET_KEY || "";
    return k.startsWith("sk_") && !k.startsWith("sk_test_xxx");
  },

  // Which of the visitor's local currencies can Stripe settle?
  supportsCurrency(currency) {
    return isStripeSupported(currency);
  },

  async createCheckout({ plan, country, amount, currency, origin, interval, metadata }) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: toMinorUnits(amount, currency),
            // Stripe has no native "quarter" — it's every 3 months.
            recurring: stripeRecurring(interval),
            product_data: {
              name: `saasevenly — ${plan} plan`,
              description: `Localized for ${country.flag} ${country.name}`,
            },
          },
        },
      ],
      // Stamp the founder's plan mapping onto the subscription so their app can
      // grant the right access after payment.
      subscription_data: { metadata: metadata || {} },
      success_url: `${origin}/pricing?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
    });
    return { url: session.url };
  },
};
