// ---------------------------------------------------------------------------
// domains.js  —  the anti-piracy check.
//
// A site key (se_live_xxx) is PUBLIC: it sits in the <script src> tag, visible
// in anyone's page source. So on its own it can't stop someone copying it onto
// their own site and using saasevenly for free.
//
// The fix: each founder registers the domain(s) their embed is allowed to run
// on. On every /api/price and /api/checkout call we read the request's Origin /
// Referer header — which the BROWSER sets and page JavaScript cannot forge — and
// reject the call if it doesn't match the founder's allowlist. A copied key on
// evil.com sends "Origin: evil.com", fails the check, and gets nothing.
//
// This is exactly how Google Maps, Stripe publishable keys and reCAPTCHA site
// keys are protected: public key, but only works from registered domains.
// ---------------------------------------------------------------------------

// Turn any user input ("https://www.Acme.com/pricing", "ACME.com") into a bare,
// lowercase host ("acme.com"). We also strip a leading "www." so a founder who
// registers "acme.com" is covered whether visitors hit www or not.
export function normalizeDomain(input) {
  if (!input) return "";
  let s = String(input).trim().toLowerCase();
  if (!s) return "";
  // Strip scheme, any path/query, port, and userinfo.
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, ""); // scheme://
  s = s.split("/")[0]; // drop path
  s = s.split("?")[0].split("#")[0];
  s = s.split("@").pop(); // drop userinfo
  s = s.split(":")[0]; // drop port
  s = s.replace(/^www\./, "");
  return s;
}

// Parse a comma/space/newline-separated string of domains into a clean array.
export function parseDomains(raw) {
  return String(raw || "")
    .split(/[\s,]+/)
    .map(normalizeDomain)
    .filter(Boolean);
}

// Pull the request's origin host from its headers. Origin is the reliable one;
// Referer is a fallback (some browsers omit Origin on same-site GETs).
export function requestHost(request) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  return normalizeDomain(origin || referer || "");
}

// Does `host` match one of the allowed domains? A registered "acme.com" also
// covers its subdomains ("app.acme.com", "www.acme.com").
function hostMatches(host, allowed) {
  if (!host) return false;
  return host === allowed || host.endsWith("." + allowed);
}

/**
 * isRequestAllowed — the gate used by /api/price and /api/checkout.
 *
 * Returns true when the embed is allowed to run for this tenant on this domain.
 * - An empty allowlist means "not locked yet" → allow (so a founder's embed
 *   works the moment they install, before they've added domains; the demo
 *   tenant also stays open). We surface a nudge in the dashboard to lock it.
 * - localhost / 127.0.0.1 / *.local are always allowed so local testing and the
 *   bundled example-embed.html keep working.
 */
export function isRequestAllowed(tenant, request) {
  const allowed = parseDomains(tenant && tenant.allowed_domains);
  if (allowed.length === 0) return true; // not locked down yet

  const host = requestHost(request);
  if (!host) return false; // locked, but no Origin/Referer → block

  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
    return true;
  }
  return allowed.some((d) => hostMatches(host, d));
}
