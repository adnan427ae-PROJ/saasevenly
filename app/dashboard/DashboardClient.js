"use client";

// Interactive dashboard controls + live pricing table.
// All math comes from lib/pricing.js (the SAME functions the server uses), so
// what you preview here is exactly what visitors and Stripe will get.
import { useMemo, useState } from "react";
import {
  effectiveRatio,
  effectiveDiscountFromPrice,
  localPrice,
  formatMoney,
} from "@/lib/pricing";
import InstallPanel from "./InstallPanel";
import PaymentsPanel from "./PaymentsPanel";
import PlansPanel from "./PlansPanel";
import DomainsPanel from "./DomainsPanel";

const ENDING_OPTIONS = [
  { value: "9", label: "Ends in 9" },
  { value: ".99", label: ".99" },
  { value: "round", label: "Round" },
];

export default function DashboardClient({ initialSettings, countries, ratesFetchedAt, providers, siteKey, initialProducts, initialDomains }) {
  const [baseUSD, setBaseUSD] = useState(initialSettings.baseUSD);
  const [endingStyle, setEndingStyle] = useState(initialSettings.endingStyle);
  const [maxDiscount, setMaxDiscount] = useState(initialSettings.maxDiscount);
  const [chargePremium, setChargePremium] = useState(initialSettings.chargePremium);
  // Every market gets its FULL fair PPP discount, capped at maxDiscount. So we
  // always compute at full passthrough (100) and let the cap do the limiting.
  const passthrough = 100;
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [tab, setTab] = useState("pricing"); // "pricing" | "install"

  // Recompute the whole table whenever any control changes.
  const rows = useMemo(() => {
    return countries.map((c) => {
      const ratio = effectiveRatio(c.pppFactor, passthrough, chargePremium, maxDiscount);
      const base = Number(baseUSD) || 0;
      const value = localPrice(base, ratio, c.fxRate, endingStyle, c.decimals, maxDiscount);
      return {
        ...c,
        // Accurate discount/premium derived from the ACTUAL rounded price.
        discount: effectiveDiscountFromPrice(value, c.fxRate, base),
        display: formatMoney(value, c.symbol, c.decimals),
      };
    });
  }, [countries, baseUSD, endingStyle, maxDiscount, chargePremium]);

  async function save() {
    setSaving(true);
    setSavedMsg("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUSD, endingStyle, passthrough, maxDiscount, chargePremium }),
        // (passthrough is fixed at 100 — the maxDiscount slider is the lever)
      });
      const data = await res.json();
      if (data.ok) setSavedMsg("Settings saved ✓");
      else setSavedMsg("Could not save.");
    } catch {
      setSavedMsg("Could not save.");
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(""), 3000);
    }
  }

  return (
    <div>
      {/* ---- Tab switcher ---- */}
      <div className="mb-6 inline-flex rounded-lg border border-neutral-200 bg-white p-1 shadow-sm">
        {[
          { id: "pricing", label: "Pricing" },
          { id: "plans", label: "Plans" },
          { id: "payments", label: "Payments" },
          { id: "domains", label: "Domains" },
          { id: "install", label: "Install" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              "rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-300 " +
              (tab === t.id
                ? "bg-accent text-white shadow-md shadow-accent/25"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "install" ? (
        <div key="install" className="animate-fade-up">
          <InstallPanel baseUSD={Number(baseUSD) || 0} siteKey={siteKey} />
        </div>
      ) : tab === "plans" ? (
        <div key="plans" className="animate-fade-up">
          <PlansPanel
            initialProducts={initialProducts}
            countries={countries}
            settings={{ endingStyle, maxDiscount, chargePremium, passthrough }}
          />
        </div>
      ) : tab === "payments" ? (
        <div key="payments" className="animate-fade-up">
          <PaymentsPanel
            providers={providers}
            activeProvider={initialSettings.paymentProvider}
          />
        </div>
      ) : tab === "domains" ? (
        <div key="domains" className="animate-fade-up">
          <DomainsPanel initialDomains={initialDomains} />
        </div>
      ) : (
        <div key="pricing" className="animate-fade-up grid gap-8 md:grid-cols-[320px_1fr]">
      {/* ---- Controls ---- */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Settings
        </h2>

        {/* Base price */}
        <label className="block text-sm font-medium text-neutral-700">
          Base price (USD)
        </label>
        <div className="mt-1 flex items-center rounded-lg border border-neutral-300 focus-within:border-accent">
          <span className="px-3 text-neutral-500">$</span>
          <input
            type="number"
            min="0"
            step="1"
            value={baseUSD}
            onChange={(e) => setBaseUSD(e.target.value)}
            className="w-full rounded-r-lg py-2 pr-3 outline-none"
          />
        </div>

        {/* Ending style */}
        <label className="mt-5 block text-sm font-medium text-neutral-700">
          Ending style
        </label>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {ENDING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setEndingStyle(opt.value)}
              className={
                "rounded-lg border px-2 py-2 text-sm font-medium transition " +
                (endingStyle === opt.value
                  ? "border-accent bg-accent-soft text-accent-dark"
                  : "border-neutral-300 text-neutral-600 hover:border-neutral-400")
              }
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Maximum discount — the single discount lever */}
        <label className="mt-5 block text-sm font-medium text-neutral-700">
          Maximum discount:{" "}
          <span className="font-semibold text-accent-dark">{maxDiscount}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={maxDiscount}
          onChange={(e) => setMaxDiscount(Number(e.target.value))}
          className="mt-2 w-full accent-accent"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Every market gets its fair PPP price, but no one ever gets more than{" "}
          {maxDiscount}% off. (Cheaper countries hit this cap; richer ones pay
          their full fair price.)
        </p>
        <p className={"mt-1.5 text-xs " + (maxDiscount > 20 ? "text-amber-700" : "text-neutral-400")}>
          {maxDiscount > 20
            ? "⚠ saasevenly suggests 15–20%. Deeper discounts read as a fire sale and train customers to expect cheap — a modest cap converts nearly as well at far better margins."
            : "✓ In the suggested 15–20% range — a credible discount that protects your margins."}
        </p>

        {/* Premium toggle — charge MORE in higher-income markets (profit) */}
        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={chargePremium}
              onChange={(e) => setChargePremium(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-emerald-600"
            />
            <span>
              <span className="block text-sm font-medium text-neutral-800">
                Charge a premium in higher-income markets 📈
              </span>
              <span className="mt-0.5 block text-xs text-neutral-600">
                Markets pricier than the US (Switzerland, Norway…) pay above your
                base price. Pure extra profit. Off = they pay the US price.
              </span>
              {endingStyle !== ".99" && chargePremium && (
                <span className="mt-1.5 block text-xs text-emerald-700">
                  Tip: the “Ends in 9” / “Round” styles snap to whole numbers, so
                  small premiums can round to the same price. Use the “.99”
                  ending to see every premium precisely.
                </span>
              )}
            </span>
          </label>
        </div>

        {/* Save */}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-6 w-full rounded-lg bg-accent px-4 py-2.5 font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
        {savedMsg && (
          <p className="mt-2 text-center text-sm text-green-600">{savedMsg}</p>
        )}
      </section>

      {/* ---- Live table ---- */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Live prices by country
          </h2>
          <span className="text-xs text-neutral-400">
            FX cached {new Date(ratesFetchedAt).toLocaleString()}
          </span>
        </div>
        <div className="overflow-hidden rounded-lg border border-neutral-100">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2.5">Country</th>
                <th className="px-4 py-2.5">Currency</th>
                <th className="px-4 py-2.5 text-right">Local price</th>
                <th className="px-4 py-2.5 text-right">Discount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((r) => (
                <tr key={r.code} className="transition-colors hover:bg-amber-50/50">
                  <td className="px-4 py-2.5">
                    <span className="mr-2">{r.flag}</span>
                    {r.name}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-500">{r.currency}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">
                    {r.display}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {r.discount > 0 ? (
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-dark">
                        {r.discount}% off
                      </span>
                    ) : r.discount < 0 ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        +{Math.abs(r.discount)}% premium
                      </span>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
        </div>
      )}
    </div>
  );
}
