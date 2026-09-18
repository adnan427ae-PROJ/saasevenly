// ---------------------------------------------------------------------------
// requestTenant.js  —  figure out WHICH founder an embed/API call belongs to,
// and whether that call is allowed to run.
//
// The widget loads as  /saasevenly.js?key=se_live_xxx  and forwards that key to
// the APIs as ?key=. We look the key up to find the tenant. If there's no key
// (e.g. our own /pricing demo), we fall back to the default/demo tenant.
// ---------------------------------------------------------------------------
import { getTenantBySiteKey, getDefaultTenant } from "./tenants";
import { isRequestAllowed } from "./domains";

export async function resolveTenant(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  return (await getTenantBySiteKey(key)) || (await getDefaultTenant());
}

// Same, but read the key from a JSON body (used by POST /api/checkout).
export async function resolveTenantFromBody(body) {
  return (await getTenantBySiteKey(body && body.key)) || (await getDefaultTenant());
}

// Is this tenant allowed to use saasevenly?
//
// saasevenly is free software with no paid tier, so the only question is
// whether the tenant exists. There is deliberately no licence check, no seat
// count and no kill switch — if you are running this code, it works.
export function isTenantActive(tenant) {
  return Boolean(tenant);
}

// Is this request coming from a domain the tenant registered? (Anti-piracy —
// stops a copied public site key working on someone else's site.)
export function isDomainAllowed(tenant, request) {
  return isRequestAllowed(tenant, request);
}
