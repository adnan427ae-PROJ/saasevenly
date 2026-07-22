// ---------------------------------------------------------------------------
// Dodo Payments provider  (REAL code — needs your Dodo keys to switch on).
//
// Dodo is a MERCHANT OF RECORD: it becomes the legal seller and handles global
// sales tax / VAT / GST for you. That's a big deal for a PPP tool selling into
// many countries — Stripe/Razorpay leave that compliance to you; Dodo doesn't.
//
// IMPORTANT — how we keep YOUR PPP price in control:
//   Dodo's API is product-based (every checkout references a pre-created
//   product_id). To charge our own per-visitor localized amount, you create ONE
//   product in Dodo with "Pay What You Want" (PWYW) ENABLED, then we pass our
//   computed amount into it. If PWYW is OFF, Dodo ignores our amount and charges
//   the product's fixed price instead — so PWYW must be on.
//
// Docs: https://docs.dodopayments.com/developer-resources/checkout-session
// ---------------------------------------------------------------------------
import { toMinorUnits } from "@/lib/stripeHelpers"; // smallest-unit helper (handles JPY etc.)

// Test by default; set DODO_ENV=live to go live.
const BASE =
  process.env.DODO_ENV === "live"
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";

// Currencies we'll send as billing_currency. Dodo (as MoR) may still present a
// converted amount to the buyer based on their country; anything not here falls
// back to USD. Expand this to match what your Dodo account is enabled for.
const DODO_CURRENCIES = new Set([
  "USD", "EUR", "GBP", "AUD", "CAD", "INR", "BRL", "MXN", "PHP", "IDR",
  "AED", "TRY", "NGN", "SGD", "JPY", "CHF", "NOK", "DKK",
]);

export const dodoProvider = {
  id: "dodo",
  label: "Dodo Payments",
  mode: "payment", // follows your Dodo product (one-time or subscription)
  blurb:
    "Merchant of Record — handles global sales tax / VAT / GST for you. Great when selling worldwide.",
  // You need BOTH: an API key, and the id of a Pay-What-You-Want product.
  requiredEnv: ["DODO_PAYMENTS_API_KEY", "DODO_PRODUCT_ID"],
  docsUrl: "https://app.dodopayments.com/developer/api-keys",

  isConfigured() {
    return Boolean(process.env.DODO_PAYMENTS_API_KEY && process.env.DODO_PRODUCT_ID);
  },

  supportsCurrency(currency) {
    return DODO_CURRENCIES.has(String(currency).toUpperCase());
  },

  async createCheckout({ plan, country, amount, currency, origin }) {
    const res = await fetch(`${BASE}/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY}`,
      },
      body: JSON.stringify({
        product_cart: [
          {
            product_id: process.env.DODO_PRODUCT_ID,
            quantity: 1,
            // Our PPP amount, in the currency's smallest unit (e.g. cents).
            // Only honored if the product has Pay-What-You-Want enabled.
            amount: toMinorUnits(amount, currency),
          },
        ],
        billing_currency: currency.toUpperCase(),
        // We let Dodo's hosted page collect the buyer's details — it needs the
        // real billing country to calculate the correct tax (that's the MoR job).
        return_url: `${origin}/pricing?checkout=success`,
        metadata: { plan, country: country.code },
      }),
    });

    const data = await res.json();
    if (!data.checkout_url) {
      throw new Error(
        (data.message || data.error || "Dodo could not create the checkout.") +
          " (Tip: make sure DODO_PRODUCT_ID points to a Pay-What-You-Want product.)"
      );
    }
    return { url: data.checkout_url };
  },
};
