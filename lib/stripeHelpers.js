// ---------------------------------------------------------------------------
// stripeHelpers.js  —  currency rules for charging through Stripe.
//
// Two things Stripe cares about:
//   1. Minor units: most currencies charge in cents (amount * 100), but some
//      ("zero-decimal" currencies like JPY) charge in whole units (amount * 1).
//   2. Not every currency can be charged by every account. If we can't charge
//      the local currency, we fall back to charging the fair price in USD.
// ---------------------------------------------------------------------------

// Stripe's official zero-decimal currencies (charged as whole units, no cents).
// None of our seed countries use these, but we handle them correctly anyway so
// adding e.g. Japan (JPY) later "just works".
const ZERO_DECIMAL = new Set([
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG",
  "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
]);

// Currencies we're confident this Stripe account can present/charge. Anything
// not in this list falls back to USD. Trim or extend this to match what YOUR
// Stripe account actually supports (Dashboard > Settings > Payment methods).
const STRIPE_SUPPORTED = new Set([
  "USD", "GBP", "EUR", "AED", "MXN", "BRL", "TRY", "PHP", "IDR", "INR", "NGN",
  // Higher-income / premium-tier markets:
  "CHF", "NOK", "DKK", "AUD", "CAD",
  // Expanded coverage:
  "SEK", "JPY", "SGD", "KRW", "SAR", "PLN", "CNY", "ZAR", "MYR", "THB",
  "ARS", "KES", "VND", "EGP", "BDT",
  // Note: PKR is intentionally left out — Stripe generally can't settle PKR, so
  // Pakistani visitors are charged the fair price converted to USD instead.
  // If your account can't settle a currency above, move it out and it'll fall
  // back to charging the fair price in USD.
]);

/** Is this currency one we'll actually charge in (vs. falling back to USD)? */
export function isStripeSupported(currency) {
  return STRIPE_SUPPORTED.has(String(currency).toUpperCase());
}

/** Convert a human price into Stripe's integer minor units for its currency. */
export function toMinorUnits(value, currency) {
  if (ZERO_DECIMAL.has(String(currency).toUpperCase())) {
    return Math.round(value); // whole units, e.g. ¥1500 -> 1500
  }
  return Math.round(value * 100); // cents, e.g. $19.99 -> 1999
}
