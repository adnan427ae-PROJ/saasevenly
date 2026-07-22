// ---------------------------------------------------------------------------
// settings.js  —  read / write the founder's settings.
//
// For a single founder we don't need a database. We just keep a settings.json
// file at the project root. (Multi-tenant, where many founders connect their
// own Stripe, would move this into a real DB later.)
// ---------------------------------------------------------------------------
import { promises as fs } from "fs";
import path from "path";
import { PROVIDER_IDS } from "@/lib/payments";

const SETTINGS_PATH = path.join(process.cwd(), "settings.json");

// Sensible defaults if the file is missing or corrupt.
const DEFAULTS = {
  baseUSD: 19,
  endingStyle: "9", // "round" | ".99" | "9"
  passthrough: 100, // 0–100, how much of the PPP discount to pass on
  maxDiscount: 50, // 0–100, the deepest discount any market may get (revenue floor)
  chargePremium: true, // charge ABOVE the US price in higher-income markets (profit)
  paymentProvider: "stripe", // "stripe" | "paypal" | "razorpay" | "dodo"
};

export async function readSettings() {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function writeSettings(next) {
  // Merge onto whatever is already saved, so a partial update (e.g. just the
  // payment provider) doesn't wipe the pricing fields.
  const current = await readSettings();
  const merged = { ...current, ...next };

  // Keep only the fields we know about, and coerce to safe types.
  const clean = {
    baseUSD: Number(merged.baseUSD) || DEFAULTS.baseUSD,
    endingStyle: ["round", ".99", "9"].includes(merged.endingStyle)
      ? merged.endingStyle
      : DEFAULTS.endingStyle,
    passthrough: clampPassthrough(merged.passthrough),
    maxDiscount: clampPassthrough(merged.maxDiscount),
    chargePremium: Boolean(merged.chargePremium),
    paymentProvider: PROVIDER_IDS.includes(merged.paymentProvider)
      ? merged.paymentProvider
      : DEFAULTS.paymentProvider,
  };
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(clean, null, 2) + "\n", "utf8");
  return clean;
}

function clampPassthrough(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return DEFAULTS.passthrough;
  return Math.min(100, Math.max(0, Math.round(n)));
}
