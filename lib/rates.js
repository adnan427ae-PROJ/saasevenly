// ---------------------------------------------------------------------------
// rates.js  —  live USD exchange rates, cached once a day.
//
// Source: https://open.er-api.com/v6/latest/USD  (free, no API key).
// We cache in memory (survives across requests in one server instance) so we're
// not hammering the API on every page load, and best-effort to data/rates.json
// on disk for local dev. On Vercel the disk write is a no-op (read-only FS), so
// the in-memory cache is what keeps us fast between requests on a warm instance.
// ---------------------------------------------------------------------------
import { promises as fs } from "fs";
import path from "path";

const RATES_PATH = path.join(process.cwd(), "data", "rates.json");
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const RATES_URL = "https://open.er-api.com/v6/latest/USD";

/**
 * getRates — returns { fetchedAt, rates: { USD: 1, INR: 83.2, ... } }.
 *
 * 1. If we have a fresh cache (< 24h old), use it.
 * 2. Otherwise fetch live, save to cache, and return it.
 * 3. If the live fetch fails, fall back to whatever cache we have.
 * 4. If there's no cache at all, fall back to a tiny built-in safety net.
 */
export async function getRates() {
  const cached = await readCache();

  // 1. Fresh cache wins.
  if (cached && Date.now() - cached.fetchedAt < ONE_DAY_MS) {
    return cached;
  }

  // 2. Try a live fetch.
  try {
    const res = await fetch(RATES_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`er-api responded ${res.status}`);
    const data = await res.json();
    if (data.result !== "success" || !data.rates) {
      throw new Error("er-api payload missing rates");
    }
    const fresh = { fetchedAt: Date.now(), rates: data.rates };
    await writeCache(fresh);
    return fresh;
  } catch (err) {
    // 3. Live fetch failed — use stale cache if we have it.
    if (cached) {
      console.warn("[rates] live fetch failed, using cached rates:", err.message);
      return cached;
    }
    // 4. No cache at all — last-resort safety net so the app still runs.
    console.warn("[rates] no cache available, using built-in fallback:", err.message);
    return { fetchedAt: Date.now(), rates: FALLBACK_RATES };
  }
}

/** Convenience: the USD->currency rate for one currency code. */
export async function getRate(currency) {
  const { rates } = await getRates();
  return rates[currency] ?? 1;
}

async function readCache() {
  // In-memory first (fast, and the only cache that persists on Vercel between
  // requests on a warm instance).
  if (globalThis.__saasevenlyRates) return globalThis.__saasevenlyRates;
  // Then disk (local dev / first request after a cold start).
  try {
    const raw = await fs.readFile(RATES_PATH, "utf8");
    const parsed = JSON.parse(raw);
    globalThis.__saasevenlyRates = parsed;
    return parsed;
  } catch {
    return null;
  }
}

async function writeCache(payload) {
  // Memory cache always (works everywhere, including Vercel's read-only FS).
  globalThis.__saasevenlyRates = payload;
  // Disk is best-effort — a no-op on Vercel, handy locally. Never let a write
  // error break pricing.
  try {
    await fs.writeFile(RATES_PATH, JSON.stringify(payload, null, 2) + "\n", "utf8");
  } catch (err) {
    console.warn("[rates] could not write disk cache:", err.message);
  }
}

// Rough fallback rates, only used if both the live API and the cache are gone.
// These are approximate and will be replaced the moment a live fetch succeeds.
const FALLBACK_RATES = {
  USD: 1, GBP: 0.79, EUR: 0.92, AED: 3.67, MXN: 17.1, BRL: 5.0,
  TRY: 32.0, PHP: 56.0, IDR: 15600, INR: 83.2, NGN: 1500, PKR: 278,
  // Higher-income markets (premium tier):
  CHF: 0.88, NOK: 10.7, DKK: 6.9, AUD: 1.5, CAD: 1.36,
  // Expanded coverage:
  SEK: 10.5, JPY: 157, SGD: 1.35, KRW: 1380, SAR: 3.75, PLN: 4.0,
  CNY: 7.2, ZAR: 18.2, MYR: 4.7, THB: 36, ARS: 950, KES: 129,
  VND: 25400, EGP: 48, BDT: 119,
};
