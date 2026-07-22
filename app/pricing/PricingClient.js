"use client";

// The founder's pricing page (or the demo, when logged out). Prices show in
// USD by default; visitors can preview any country, drag the max-discount
// slider, and flip Monthly/Yearly. All math runs in the browser with the SAME
// lib/pricing.js functions the server charges with.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  effectiveRatio,
  effectiveDiscountFromPrice,
  localPrice,
  formatMoney,
} from "@/lib/pricing";
import SiteNav from "../components/SiteNav";

const INTERVAL_SUFFIX = { month: "/mo", quarter: "/qtr", year: "/yr" };

export default function PricingClient({ plans, siteKey, countries, settings, isOwn }) {
  const [country, setCountry] = useState("US"); // USD is the default view
  const [interval, setInterval] = useState("month"); // "month" | "year"
  // The discount cap comes from the founder's saved settings — visitors don't
  // get to change what they'd be charged.
  const maxDiscount = settings.maxDiscount;
  const [loadingId, setLoadingId] = useState(null);
  const [banner, setBanner] = useState(null);
  const touched = useRef(false); // has the visitor changed country yet?

  // Read the ?country=XX test override once on mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const override = (params.get("country") || "").toUpperCase();
    if (override && countries.some((c) => c.code === override)) {
      touched.current = true;
      setCountry(override);
    }
    if (params.get("checkout") === "success") {
      setBanner({ kind: "success", text: "Payment complete — welcome aboard! 🎉" });
    } else if (params.get("checkout") === "cancelled") {
      setBanner({ kind: "info", text: "Checkout cancelled. No charge was made." });
    }
  }, [countries]);

  function pickCountry(code) {
    touched.current = true;
    setCountry(code);
    // Keep the URL shareable (?country=IN) without reloading.
    const url = new URL(window.location.href);
    if (code === "US") url.searchParams.delete("country");
    else url.searchParams.set("country", code);
    window.history.replaceState(null, "", url);
  }

  const selected = countries.find((c) => c.code === country) || countries[0];

  // Does any plan have BOTH a monthly and a yearly price? Then show the toggle.
  const hasYearly = plans.some((p) => p.month && p.year);
  // The headline saving for the toggle chip ("save ~17%").
  const maxSave = Math.max(
    0,
    ...plans
      .filter((p) => p.month && p.year)
      .map((p) => Math.round((1 - p.year.base / (12 * p.month.base)) * 100))
  );

  // Localize every plan's price for the chosen country/interval/slider.
  const priced = useMemo(() => {
    const ratio = effectiveRatio(
      selected.pppFactor,
      settings.passthrough,
      settings.chargePremium,
      maxDiscount
    );
    return plans.map((p) => {
      // Fall back gracefully if a plan only exists in one interval.
      const usedInterval = p[interval] ? interval : p.month ? "month" : p.year ? "year" : "quarter";
      const variant = p[usedInterval];
      if (!variant) return null;
      const value = localPrice(
        variant.base,
        ratio,
        selected.fxRate,
        settings.endingStyle,
        selected.decimals,
        maxDiscount
      );
      const yearlySave =
        usedInterval === "year" && p.month && p.year
          ? Math.round((1 - p.year.base / (12 * p.month.base)) * 100)
          : 0;
      return {
        name: p.name,
        id: variant.id,
        base: variant.base,
        interval: usedInterval,
        display: formatMoney(value, selected.symbol, selected.decimals),
        discount: effectiveDiscountFromPrice(value, selected.fxRate, variant.base),
        yearlySave,
      };
    }).filter(Boolean);
  }, [plans, selected, maxDiscount, settings, interval]);

  // Highlight the middle plan, if there are 3+.
  const highlightIdx = priced.length >= 2 ? Math.floor((priced.length - 1) / 2) : -1;
  // Headline badge = the highlighted plan's real discount/premium.
  const headline = priced[highlightIdx]?.discount ?? priced[0]?.discount ?? 0;

  async function startCheckout(tier) {
    setLoadingId(tier.id);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // The product id encodes plan + interval; the server looks up its
          // base price and recomputes the localized amount itself.
          productId: tier.id,
          country, // charge at the previewed country's fair price
          key: siteKey,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setBanner({ kind: "error", text: data.error || "Could not start checkout." });
        setLoadingId(null);
      }
    } catch {
      setBanner({ kind: "error", text: "Could not reach checkout. Is the server running?" });
      setLoadingId(null);
    }
  }

  return (
    <>
      <SiteNav />
      <main className="relative mx-auto max-w-5xl px-6 py-14">
        {/* Decorative backdrop: grid + soft blobs */}
        <div className="pointer-events-none absolute inset-x-[-40vw] -top-14 h-[560px] -z-10">
          <div className="bg-grid absolute inset-0" />
          <div className="absolute left-[20%] top-8 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl animate-blob" />
          <div
            className="absolute right-[18%] top-24 h-72 w-72 rounded-full bg-orange-200/35 blur-3xl animate-blob"
            style={{ animationDelay: "5s" }}
          />
        </div>

        {banner && (
          <div
            className={
              "animate-fade-up mb-6 rounded-lg px-4 py-3 text-sm font-medium " +
              (banner.kind === "success"
                ? "bg-green-50 text-green-700"
                : banner.kind === "error"
                ? "bg-red-50 text-red-700"
                : "bg-neutral-100 text-neutral-700")
            }
          >
            {banner.text}
          </div>
        )}

        <div className="text-center">
          <h1 className="animate-fade-up text-4xl font-bold tracking-tight sm:text-5xl">
            Pricing that's fair <span className="text-gradient">everywhere</span>
          </h1>
          <p className="animate-fade-up mx-auto mt-3 max-w-xl text-neutral-600" style={{ animationDelay: "100ms" }}>
            One price, localized to every market. Charged in the visitor's own currency.
          </p>
          <p className="animate-fade-up mt-2 text-xs text-neutral-400" style={{ animationDelay: "140ms" }}>
            {isOwn
              ? "✓ This is YOUR live pricing page — the plans below come from your dashboard's Plans tab."
              : "Demo page using the demo account's plans — log in to see yours."}
          </p>

          {/* Country preview selector (USD default) */}
          <div
            className="animate-fade-up mx-auto mt-6 inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white/85 px-6 py-4 shadow-sm backdrop-blur"
            style={{ animationDelay: "180ms" }}
          >
            <label htmlFor="country-select" className="text-sm font-medium text-neutral-600">
              Preview as:
            </label>
            <select
              id="country-select"
              value={country}
              onChange={(e) => pickCountry(e.target.value)}
              className="cursor-pointer rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 shadow-sm outline-none transition hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Monthly / Yearly toggle */}
          {hasYearly && (
            <div className="animate-fade-up mt-5" style={{ animationDelay: "220ms" }}>
              <div className="inline-flex rounded-full border border-neutral-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setInterval("month")}
                  className={
                    "rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-300 " +
                    (interval === "month" ? "bg-accent text-white shadow" : "text-neutral-600 hover:text-neutral-900")
                  }
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setInterval("year")}
                  className={
                    "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-300 " +
                    (interval === "year" ? "bg-accent text-white shadow" : "text-neutral-600 hover:text-neutral-900")
                  }
                >
                  Yearly
                  {maxSave > 0 && (
                    <span
                      className={
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold " +
                        (interval === "year" ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-700")
                      }
                    >
                      save {maxSave}%
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 h-7">
            {country !== "US" && (
              <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-amber-200 bg-accent-soft px-3 py-1 text-sm font-medium text-accent-dark">
                <span className="text-base">{selected.flag}</span>
                Localized for {selected.name}
                {headline > 0 && (
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold">
                    {headline}% off
                  </span>
                )}
                {headline < 0 && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                    +{Math.abs(headline)}% premium
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {priced.length === 0 ? (
          <p className="mt-10 text-center text-neutral-500">
            No plans yet. Add some in the{" "}
            <Link href="/dashboard" className="text-accent-dark underline">dashboard's <strong>Plans</strong> tab</Link>.
          </p>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {priced.map((tier, i) => {
              const highlight = i === highlightIdx;
              return (
                <div
                  key={tier.name}
                  className={
                    "card-lift animate-fade-up flex flex-col rounded-2xl border bg-white p-6 shadow-sm " +
                    (highlight
                      ? "relative border-accent shadow-lg shadow-accent/10 ring-1 ring-accent md:-mt-3 md:mb-[-12px] md:py-8"
                      : "border-neutral-200")
                  }
                  style={{ animationDelay: `${150 + i * 120}ms` }}
                >
                  {highlight && (
                    <span className="mb-3 inline-block w-fit rounded-full bg-gradient-to-r from-accent to-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
                      ★ Most popular
                    </span>
                  )}
                  <h2 className="text-lg font-bold">{tier.name}</h2>

                  <div className="mt-5 flex items-baseline gap-1">
                    {/* Re-mounts on country/interval change so the flash replays. */}
                    <span
                      key={`${tier.name}-${country}-${tier.interval}`}
                      className={
                        "text-4xl font-bold tracking-tight" +
                        (touched.current ? " saasevenly-flash" : "")
                      }
                    >
                      {tier.display}
                    </span>
                    <span className="text-sm text-neutral-500">{INTERVAL_SUFFIX[tier.interval]}</span>
                  </div>
                  <div className="mt-1.5 h-5">
                    {tier.yearlySave > 0 && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        {tier.yearlySave}% cheaper than monthly
                      </span>
                    )}
                  </div>

                  <p className="mt-3 flex items-center gap-2 text-sm text-neutral-600">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-xs text-accent-dark">✓</span>
                    Localized &amp; billed in your currency
                  </p>

                  <button
                    type="button"
                    onClick={() => startCheckout(tier)}
                    disabled={loadingId === tier.id}
                    className={
                      "mt-6 w-full rounded-lg px-4 py-2.5 font-semibold transition disabled:opacity-60 " +
                      (highlight
                        ? "bg-accent text-white shadow-md shadow-accent/25 hover:-translate-y-0.5 hover:bg-accent-dark"
                        : "border border-neutral-300 text-neutral-800 hover:-translate-y-0.5 hover:border-accent hover:text-accent-dark")
                    }
                  >
                    {loadingId === tier.id ? "Starting…" : `Subscribe to ${tier.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-neutral-400">
          Prices default to USD — pick a country above to preview its fair local
          price. On your own site, the embed detects each visitor's country
          automatically, and checkout always charges the settings saved in the
          dashboard.
        </p>
      </main>
    </>
  );
}
