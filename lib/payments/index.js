// ---------------------------------------------------------------------------
// Payment provider registry.
//
// Every gateway implements the same shape, so adding a new one (Paddle, Lemon
// Squeezy, Mollie, Paystack...) is just a new file + one line here. The rest of
// the app never needs to know which gateway is active.
//
// Provider interface:
//   {
//     id, label, mode ("subscription" | "payment"), blurb,
//     requiredEnv: string[],          // env vars the founder must set
//     docsUrl,                        // where to get the keys
//     isConfigured(): boolean,        // are those keys present?
//     supportsCurrency(cur): boolean, // can it charge this currency directly?
//     async createCheckout({ plan, country, amount, currency, decimals, origin })
//         -> { url }                  // hosted checkout URL to redirect to
//   }
// ---------------------------------------------------------------------------
import { stripeProvider } from "./stripe";
import { paypalProvider } from "./paypal";
import { razorpayProvider } from "./razorpay";
import { dodoProvider } from "./dodo";

const PROVIDERS = {
  stripe: stripeProvider,
  paypal: paypalProvider,
  razorpay: razorpayProvider,
  dodo: dodoProvider,
};

export const PROVIDER_IDS = Object.keys(PROVIDERS);

/** Get one provider by id, or null if unknown. */
export function getProvider(id) {
  return PROVIDERS[id] || null;
}

/** Lightweight, serializable info for the dashboard (no functions). */
export function listProviders() {
  return Object.values(PROVIDERS).map((p) => ({
    id: p.id,
    label: p.label,
    mode: p.mode,
    blurb: p.blurb,
    requiredEnv: p.requiredEnv,
    docsUrl: p.docsUrl,
    configured: p.isConfigured(),
  }));
}
