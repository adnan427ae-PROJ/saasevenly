// ---------------------------------------------------------------------------
// site.js  —  one place for the project-level facts the UI keeps repeating.
//
// saasevenly is free and open source (MIT). There is no paid tier and no
// licence check anywhere in this codebase: you clone it, point it at your own
// Postgres, and it is yours. Donations are the only funding, and they are
// entirely optional.
// ---------------------------------------------------------------------------

export const GITHUB_URL = "https://github.com/adnan427ae-PROJ/saasevenly";
export const GITHUB_SLUG = "adnan427ae-PROJ/saasevenly";
export const LICENSE = "MIT";

// Ko-fi is the donation channel. Overridable so a fork can point it at their
// own page without editing code.
export const KOFI_URL = process.env.NEXT_PUBLIC_KOFI_URL || "https://ko-fi.com/drtoken";

// One-click self-host. Vercel clones the repo into the user's own account and
// prompts for DATABASE_URL on the way through.
export const DEPLOY_URL =
  "https://vercel.com/new/clone?repository-url=" +
  encodeURIComponent(GITHUB_URL) +
  "&env=DATABASE_URL" +
  "&envDescription=" +
  encodeURIComponent("Supabase Postgres connection string (see README)") +
  "&envLink=" +
  encodeURIComponent(GITHUB_URL + "#self-host") +
  "&project-name=saasevenly&repository-name=saasevenly";

// ---------------------------------------------------------------------------
// Demo mode.
//
// The instance at saasevenly.vercel.app exists to SHOW the project — the
// landing page, the live pricing demo and the install guide. It does not host
// accounts for other people, because the whole point is that you run your own.
// So on that deploy NEXT_PUBLIC_DEMO_MODE=1 closes signup and login.
//
// Self-hosters leave it unset and get the full app: accounts, dashboard, admin.
// ---------------------------------------------------------------------------
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

// True when accounts can be created/used on this instance.
export function accountsEnabled() {
  return !DEMO_MODE;
}
