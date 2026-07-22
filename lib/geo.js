// ---------------------------------------------------------------------------
// geo.js  —  figure out which country the visitor is in.
//
// Detection order (first hit wins):
//   1. ?country=XX override (testing)
//   2. CDN geo headers — Vercel / Cloudflare / Fastly set these for free on
//      every request, no API call needed. This is the production path.
//   3. IP lookup APIs (ipapi.co, then country.is as fallback), with an
//      in-memory cache per IP so we don't hammer the free tiers — ipapi.co
//      rate-limits hard (429) and used to make every visitor default to US.
// ---------------------------------------------------------------------------
import { hasCountry } from "./countries";

// ip -> { code, at }  (cached for 24h; survives across requests in one process)
const cache = (globalThis.__saasevenlyGeoCache ||= new Map());
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const LOOKUP_TIMEOUT_MS = 3500;

// Headers set by common CDNs/proxies when the app is deployed behind them.
const GEO_HEADERS = [
  "x-vercel-ip-country", // Vercel
  "cf-ipcountry",        // Cloudflare
  "fastly-geo-country",  // Fastly
  "x-country-code",      // generic
];

/**
 * detectCountry — returns a 2-letter ISO country code (e.g. "IN").
 *
 * @param {Request} request  the incoming request (so we can read headers)
 * @param {string}  override  optional ?country=XX value for testing
 */
export async function detectCountry(request, override) {
  // 1. Explicit override always wins (great for testing other countries).
  if (override && hasCountry(override)) {
    return override.toUpperCase();
  }

  // 2. CDN geo headers — free, instant, and accurate in production.
  for (const h of GEO_HEADERS) {
    const v = request.headers.get(h);
    if (v && hasCountry(v)) return v.toUpperCase();
  }

  // 3. Fall back to an IP lookup (mainly for localhost / bare deployments).
  const forwardedFor = request.headers.get("x-forwarded-for"); // "203.0.113.7, 10.0.0.1"
  const visitorIp = forwardedFor ? forwardedFor.split(",")[0].trim() : null;
  const cacheKey = visitorIp || "self";

  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.code;

  const code = (await lookupIpapi(visitorIp)) || (await lookupCountryIs(visitorIp)) || "US";
  cache.set(cacheKey, { code, at: Date.now() });
  return code;
}

// Fetch with a hard timeout so a slow geo API can never stall a page.
async function fetchJson(url) {
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`responded ${res.status}`);
  return res.json();
}

async function lookupIpapi(ip) {
  const url = ip ? `https://ipapi.co/${ip}/json/` : "https://ipapi.co/json/";
  try {
    const data = await fetchJson(url);
    const code = (data.country_code || data.country || "").toUpperCase();
    return hasCountry(code) ? code : null;
  } catch (err) {
    console.warn("[geo] ipapi lookup failed:", err.message);
    return null;
  }
}

async function lookupCountryIs(ip) {
  const url = ip ? `https://api.country.is/${ip}` : "https://api.country.is";
  try {
    const data = await fetchJson(url);
    const code = (data.country || "").toUpperCase();
    return hasCountry(code) ? code : null;
  } catch (err) {
    console.warn("[geo] country.is lookup failed:", err.message);
    return null;
  }
}
