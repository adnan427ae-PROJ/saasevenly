// ---------------------------------------------------------------------------
// Razorpay payment provider  (REAL code — needs your Razorpay keys to switch on).
//
// Creates a Razorpay "Payment Link" for the localized amount and returns its
// short URL. Razorpay is hugely popular in India & South Asia (UPI, cards,
// netbanking, wallets).
//
// NOTE: one-time payment. Razorpay subscriptions also exist but need pre-created
// plans, like PayPal. INR works out of the box; other currencies require you to
// enable "International Payments" in your Razorpay dashboard.
// ---------------------------------------------------------------------------

// Razorpay charges in the currency's smallest unit (paise for INR), so we
// multiply by 100. (Razorpay has no zero-decimal currencies in common use here.)
function toSubunits(amount) {
  return Math.round(amount * 100);
}

// Currencies we'll charge directly. INR is always supported; USD covers the
// fallback for visitors elsewhere. Add more once you enable International
// Payments in Razorpay.
const RAZORPAY_CURRENCIES = new Set(["INR", "USD"]);

export const razorpayProvider = {
  id: "razorpay",
  label: "Razorpay",
  mode: "payment", // one-time
  blurb: "Popular in India & South Asia. UPI, cards, netbanking, wallets.",
  requiredEnv: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"],
  docsUrl: "https://dashboard.razorpay.com/app/keys",

  isConfigured() {
    return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  },

  supportsCurrency(currency) {
    return RAZORPAY_CURRENCIES.has(String(currency).toUpperCase());
  },

  async createCheckout({ plan, country, amount, currency, origin }) {
    const creds = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
    ).toString("base64");

    const res = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        Authorization: `Basic ${creds}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: toSubunits(amount),
        currency: currency.toUpperCase(),
        description: `saasevenly ${plan} (${country.name})`,
        callback_url: `${origin}/pricing?checkout=success`,
        callback_method: "get",
      }),
    });
    const data = await res.json();
    if (!data.short_url) {
      throw new Error(
        (data.error && data.error.description) ||
          "Razorpay could not create the payment link."
      );
    }
    return { url: data.short_url };
  },
};
