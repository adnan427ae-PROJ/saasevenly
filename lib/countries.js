// ---------------------------------------------------------------------------
// countries.js  —  load the maintained PPP table from data/countries.json.
// ---------------------------------------------------------------------------
import countriesData from "@/data/countries.json";

const COUNTRIES = countriesData.countries;

/** All countries as { code, ...row } objects, in file order. */
export function listCountries() {
  return Object.entries(COUNTRIES).map(([code, row]) => ({ code, ...row }));
}

/** One country by ISO code (e.g. "IN"). Falls back to US if unknown. */
export function getCountry(code) {
  const upper = String(code || "").toUpperCase();
  if (COUNTRIES[upper]) return { code: upper, ...COUNTRIES[upper] };
  return { code: "US", ...COUNTRIES.US };
}

export function hasCountry(code) {
  return Boolean(COUNTRIES[String(code || "").toUpperCase()]);
}
