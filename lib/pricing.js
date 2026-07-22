// ---------------------------------------------------------------------------
// pricing.js  —  the pricing math, in one place.
//
// Every part of the app (dashboard table, /api/price, /api/checkout) imports
// from here, so the numbers can never drift apart. The formulas match the
// reference spec exactly.
// ---------------------------------------------------------------------------

/**
 * applyEnding — give a raw number a "charm" ending.
 *
 * @param {number} value     the raw computed price
 * @param {string} style     "round" | ".99" | "9"
 * @param {number} decimals  how many decimals this currency shows (e.g. 2 or 0)
 * @returns {number} the prettified price
 */
export function applyEnding(value, style, decimals) {
  if (style === "round") {
    // Round to a clean number, getting coarser as the price grows.
    if (value < 100) return Math.round(value / 10) * 10;     // nearest 10
    if (value < 2000) return Math.round(value / 50) * 50;    // nearest 50
    return Math.round(value / 500) * 500;                    // nearest 500
  }

  if (style === ".99") {
    // Classic ".99" ending, but only when the currency actually shows decimals
    // and the price is small. Otherwise drop to a whole-number "...99" feel.
    if (decimals > 0 && value < 1000) return Math.round(value) - 0.01;
    return Math.round(value / 100) * 100 - 1;
  }

  // Default: "Ends in 9" (e.g. 9, 19, 399). Never go below 9.
  return Math.max(9, Math.round(value / 10) * 10 - 1);
}

/**
 * charmFloor — the largest "charm" price at or BELOW a ceiling.
 *
 * Mirror of charmCeil: always rounds DOWN. Used so a country that should NOT
 * have a premium (e.g. premium toggle off) can never round UP into one.
 */
export function charmFloor(ceil, style, decimals) {
  if (style === "round") {
    if (ceil < 100) return Math.max(0, Math.floor(ceil / 10) * 10);
    if (ceil < 2000) return Math.floor(ceil / 50) * 50;
    return Math.floor(ceil / 500) * 500;
  }
  if (style === ".99") {
    if (decimals > 0 && ceil < 1000) {
      return Math.max(0.99, Math.floor(ceil - 0.99) + 0.99);
    }
    return Math.max(99, Math.floor((ceil + 1) / 100) * 100 - 1);
  }
  // "Ends in 9": largest (…9) value <= ceil.
  return Math.max(9, Math.floor((ceil + 1) / 10) * 10 - 1);
}

/**
 * charmCeil — the smallest "charm" price at or ABOVE a floor.
 *
 * Same ending styles as applyEnding, but always rounds UP. Used to enforce the
 * max-discount floor so charm rounding can never push the price below it (which
 * would make the real discount exceed the cap).
 */
export function charmCeil(floor, style, decimals) {
  if (style === "round") {
    if (floor < 100) return Math.ceil(floor / 10) * 10;
    if (floor < 2000) return Math.ceil(floor / 50) * 50;
    return Math.ceil(floor / 500) * 500;
  }
  if (style === ".99") {
    if (decimals > 0 && floor < 1000) {
      const x = Math.ceil(floor);
      const cand = x - 0.01;
      return cand >= floor ? cand : x + 0.99;
    }
    return Math.ceil((floor + 1) / 100) * 100 - 1;
  }
  // "Ends in 9": smallest (…9) value >= floor.
  return Math.max(9, Math.ceil((floor + 1) / 10) * 10 - 1);
}

/**
 * effectiveRatio — how much of the US price the visitor actually pays.
 *
 * Two directions:
 *  - Cheaper markets (pppFactor < 1): pass on part of the PPP discount. The
 *    passthrough slider (0–100%) controls how much:
 *      passthrough 100 -> full PPP discount
 *      passthrough 0   -> no discount (everyone pays the US price)
 *  - Pricier markets (pppFactor > 1, e.g. Switzerland): you can charge a
 *    PREMIUM above the US price — pure extra profit. This is gated by
 *    `chargePremium`. When off, those markets simply pay the US price (we never
 *    discount a high-income market).
 *
 * @param {number} pppFactor
 * @param {number} passthrough     0–100
 * @param {boolean} chargePremium  add a premium in pricier markets?
 * @param {number} maxDiscount     cap on the discount, 0–100 (e.g. 50 = never
 *                                 charge less than 50% of the US price)
 */
export function effectiveRatio(pppFactor, passthrough, chargePremium = true, maxDiscount = 100) {
  let ratio;
  if (pppFactor >= 1) {
    // Higher-income market: full premium if enabled, otherwise the US price.
    ratio = chargePremium ? pppFactor : 1;
  } else {
    // Lower-income market: pass on part of the PPP discount.
    ratio = 1 - (1 - pppFactor) * (passthrough / 100);
  }
  // Apply the discount floor: ratio can't drop below (1 - maxDiscount%).
  // (Premiums, where ratio > 1, are never affected by this.)
  const minRatio = 1 - maxDiscount / 100;
  return Math.max(ratio, minRatio);
}

/**
 * discountPercent — discount implied by the PPP/passthrough ratio alone (the
 * "intent", before FX + charm rounding). Kept for reference/back-compat.
 */
export function discountPercent(ratio) {
  return Math.round((1 - ratio) * 100);
}

/**
 * localPrice — the final localized price for one base USD value.
 *
 * @param {number} baseUSD      the founder's base price in USD
 * @param {number} ratio        from effectiveRatio()
 * @param {number} fxRate       USD -> local currency rate
 * @param {string} endingStyle  "round" | ".99" | "9"
 * @param {number} decimals     currency display decimals
 */
export function localPrice(baseUSD, ratio, fxRate, endingStyle, decimals, maxDiscount = 100) {
  const raw = baseUSD * ratio * fxRate;
  // Round to the NEAREST charm value — the "closest number".
  let value = applyEnding(raw, endingStyle, decimals);

  const parity = baseUSD * fxRate; // the US price in local currency
  const PARITY_TOL = 0.06; // how far the charm grid may drift from parity

  if (ratio >= 1) {
    // Parity or premium intended (e.g. premium toggle OFF). Charm rounding
    // must never turn "pay the US price" into a real discount: the coarse
    // "9"/"round" grids used to give Australia 10% off with premium disabled.
    if (value < parity * 0.98) {
      // Rounded down into a discount: go up to the next charm price — or, if
      // the grid is too coarse there, charge (almost) the exact US price.
      const up = charmCeil(parity, endingStyle, decimals);
      value = up <= parity * (1 + PARITY_TOL) ? up : Math.max(1, Math.round(parity));
    } else if (ratio === 1 && value > parity * (1 + PARITY_TOL)) {
      // Premium is OFF but the nearest charm price is way ABOVE parity
      // (CHF 29 vs a 25.50 parity): that's an unwanted premium — use the US price.
      value = Math.max(1, Math.round(parity));
    }
  } else {
    // Discount intended. Hard discount floor: never let the FINAL price (after
    // charm rounding) imply a discount bigger than maxDiscount. If rounding
    // dipped below the floor, round up to the next charm price at/above it.
    if (maxDiscount < 100) {
      const floorLocal = (1 - maxDiscount / 100) * parity;
      if (value < floorLocal) value = charmCeil(floorLocal, endingStyle, decimals);
    }
    // And the mirror guard: a discount-intent price must never round UP past
    // the US price (the grid turned a €15.30 intent into €19 = +14% premium).
    if (value > parity) value = Math.max(1, Math.round(parity));
  }
  return value;
}

/**
 * effectiveDiscountFromPrice — the ACCURATE discount/premium the customer
 * actually gets, derived from the final rounded local price (not the intent).
 *
 * We convert the local price back to USD at the FX rate and compare it to the
 * base USD price. This captures everything: PPP, passthrough, AND the charm
 * rounding (which can shift the real discount up or down).
 *
 * Returns a signed percent: positive = discount ("X% off"),
 *   negative = premium (price above the US base).
 *
 * @param {number} localValue  the final rounded price in local currency
 * @param {number} fxRate      USD -> local currency
 * @param {number} baseUSD     the founder's base USD price
 */
export function effectiveDiscountFromPrice(localValue, fxRate, baseUSD) {
  if (!baseUSD || !fxRate) return 0;
  const usdEquivalent = localValue / fxRate; // what they pay, in USD
  const pct = (1 - usdEquivalent / baseUSD) * 100;
  // Within ~2.5% of parity is just charm-rounding noise (kr 299 vs kr 304.50
  // parity) — call it "the same price" instead of a misleading badge.
  if (Math.abs(pct) < 2.5) return 0;
  return Math.round(pct);
}

/**
 * computeCountryPricing — bundle everything a country needs in one call.
 *
 * @param {object} country   a row from countries.json (has pppFactor, decimals, ...)
 * @param {object} settings  { baseUSD, endingStyle, passthrough }
 * @param {number} fxRate    USD -> this country's currency
 * @param {number[]} bases   optional extra base prices to compute (for multi-tier pages)
 */
export function computeCountryPricing(country, settings, fxRate, bases = []) {
  const ratio = effectiveRatio(
    country.pppFactor,
    settings.passthrough,
    settings.chargePremium,
    settings.maxDiscount
  );

  // Always compute the founder's single base price.
  const baseUSD = Number(settings.baseUSD);
  const allBases = Array.from(new Set([baseUSD, ...bases.map(Number)]));

  const prices = {};
  for (const base of allBases) {
    const value = localPrice(base, ratio, fxRate, settings.endingStyle, country.decimals, settings.maxDiscount);
    prices[String(base)] = {
      value,
      display: formatMoney(value, country.symbol, country.decimals),
      // Accurate per-price discount/premium, derived from the actual amount.
      discount: effectiveDiscountFromPrice(value, fxRate, base),
    };
  }

  // Headline discount = the accurate one for the founder's base price.
  const discount = prices[String(baseUSD)]
    ? prices[String(baseUSD)].discount
    : discountPercent(ratio);

  return { ratio, discount, fxRate, prices };
}

/**
 * formatMoney — turn a number into a display string like "₹399" or "Rp 150,000".
 * Shows decimals only when the value actually has them, and adds thousands
 * separators so big-currency prices stay readable.
 */
export function formatMoney(value, symbol, decimals) {
  const hasFraction = Math.abs(value % 1) > 1e-9;
  const frac = hasFraction ? Math.min(2, Math.max(0, decimals)) : 0;
  const num = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: frac,
    maximumFractionDigits: frac,
  }).format(value);
  // Symbols ending in a letter (e.g. "AED") read better with a space.
  const sep = /[A-Za-z]$/.test(symbol) ? " " : "";
  return `${symbol}${sep}${num}`;
}
