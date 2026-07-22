// ---------------------------------------------------------------------------
// PayPal payment provider  (REAL code — needs your PayPal keys to switch on).
//
// Creates a one-time PayPal "order" (Orders v2 REST API) for the localized
// amount, and returns the approval URL the buyer is sent to.
//
// NOTE: this is a ONE-TIME payment, not a recurring subscription. PayPal
// subscriptions require pre-created billing plans, which don't fit a per-visitor
// dynamic price. For true PayPal subscriptions you'd create a plan per price
// tier up front — see the comment at the bottom.
// ---------------------------------------------------------------------------

// Sandbox by default; set PAYPAL_ENV=live to go live.
const BASE =
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// Currencies PayPal can accept. (PayPal does NOT support INR/AED/TRY/IDR/NGN/PKR
// for receiving, so visitors in those countries fall back to USD.)
const PAYPAL_CURRENCIES = new Set([
  "USD", "GBP", "EUR", "AUD", "CAD", "BRL", "MXN", "PHP", "SGD", "HKD",
  "JPY", "CHF", "SEK", "NOK", "DKK", "PLN", "NZD", "CZK", "HUF", "ILS",
  "TWD", "THB",
]);

// PayPal whole-number (no decimals) currencies.
const PAYPAL_NO_DECIMALS = new Set(["HUF", "JPY", "TWD"]);

export const paypalProvider = {
  id: "paypal",
  label: "PayPal",
  mode: "payment", // one-time
  blurb: "One-time PayPal & card payments. Trusted worldwide; great where cards are rare.",
  requiredEnv: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"],
  docsUrl: "https://developer.paypal.com/dashboard/applications/sandbox",

  isConfigured() {
    return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
  },

  supportsCurrency(currency) {
    return PAYPAL_CURRENCIES.has(String(currency).toUpperCase());
  },

  async createCheckout({ plan, country, amount, currency, origin }) {
    const token = await getAccessToken();
    const cur = currency.toUpperCase();
    // PayPal wants the amount as a string ("19.00" or "1500" for no-decimals).
    const value = PAYPAL_NO_DECIMALS.has(cur)
      ? String(Math.round(amount))
      : amount.toFixed(2);

    const res = await fetch(`${BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: cur, value },
            description: `saasevenly ${plan} (${country.name})`,
          },
        ],
        application_context: {
          brand_name: "saasevenly",
          user_action: "PAY_NOW",
          return_url: `${origin}/pricing?checkout=success`,
          cancel_url: `${origin}/pricing?checkout=cancelled`,
        },
      }),
    });
    const data = await res.json();
    const approve = (data.links || []).find((l) => l.rel === "approve");
    if (!approve) {
      throw new Error(data.message || "PayPal could not create the order.");
    }
    return { url: approve.href };
  },
};

// Exchange the client id/secret for a short-lived access token.
async function getAccessToken() {
  const creds = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("PayPal auth failed — check your keys.");
  return data.access_token;
}

// To make PayPal RECURRING later: create a Product + Billing Plan per price tier
// via /v1/billing/plans, then use /v1/billing/subscriptions instead of orders.
