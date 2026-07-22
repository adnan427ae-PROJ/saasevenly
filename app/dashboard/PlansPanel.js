"use client";

// The "Plans" tab: manage your catalog of plans AND see exactly what customers
// around the world get charged for each one — computed live with the same
// pricing math the checkout uses, so there are no surprises.
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  effectiveRatio,
  effectiveDiscountFromPrice,
  localPrice,
  formatMoney,
} from "@/lib/pricing";

function intervalShort(i) {
  return i === "year" ? "yr" : i === "quarter" ? "qtr" : "mo";
}

// A representative spread for the preview: base, premium, standard, growth,
// emerging — enough to trust the numbers without listing all 36 countries.
const SAMPLE_CODES = ["US", "CH", "GB", "JP", "BR", "IN", "NG"];

export default function PlansPanel({ initialProducts, countries = [], settings }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [form, setForm] = useState({ name: "", baseUSD: "", interval: "month", externalId: "" });
  const [busy, setBusy] = useState(false);

  async function add(e) {
    e.preventDefault();
    if (!form.name || !form.baseUSD) return;
    setBusy(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.product) {
        setProducts((p) => [...p, data.product]);
        setForm({ name: "", baseUSD: "", interval: "month", externalId: "" });
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    setProducts((p) => p.filter((x) => x.id !== id));
    await fetch(`/api/products?id=${id}`, { method: "DELETE" });
  }

  // Live localized preview: sample countries × plans.
  const preview = useMemo(() => {
    if (!settings || products.length === 0) return [];
    const sample = SAMPLE_CODES.map((code) => countries.find((c) => c.code === code)).filter(Boolean);
    return sample.map((c) => {
      const ratio = effectiveRatio(c.pppFactor, settings.passthrough, settings.chargePremium, settings.maxDiscount);
      return {
        ...c,
        cells: products.map((p) => {
          const value = localPrice(p.baseUSD, ratio, c.fxRate, settings.endingStyle, c.decimals, settings.maxDiscount);
          return {
            id: p.id,
            display: formatMoney(value, c.symbol, c.decimals),
            discount: effectiveDiscountFromPrice(value, c.fxRate, p.baseUSD),
          };
        }),
      };
    });
  }, [products, countries, settings]);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Your plans
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          List each plan once. saasevenly localizes and charges the right amount per
          visitor — you never create per-currency prices in your gateway.
        </p>

        {/* Existing plans */}
        <div className="mt-5 overflow-hidden rounded-lg border border-neutral-100">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2.5">Plan</th>
                <th className="px-4 py-2.5 text-right">Base (USD)</th>
                <th className="px-4 py-2.5">Billing</th>
                <th className="px-4 py-2.5">Your plan ID</th>
                <th className="px-4 py-2.5">Tag to embed</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                    No plans yet — add one below.
                  </td>
                </tr>
              )}
              {products.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-amber-50/50">
                  <td className="px-4 py-2.5 font-medium">{p.name}</td>
                  <td className="px-4 py-2.5 text-right">${p.baseUSD}</td>
                  <td className="px-4 py-2.5 text-neutral-500">/{intervalShort(p.interval)}</td>
                  <td className="px-4 py-2.5 text-neutral-500">
                    {p.externalId || <span className="text-neutral-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <code className="rounded bg-neutral-100 px-1 text-xs">
                      data-saasevenly=&quot;{p.baseUSD}&quot;
                    </code>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => remove(p.id)}
                      className="text-xs font-medium text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add a plan */}
        <form onSubmit={add} className="mt-5 grid items-end gap-3 sm:grid-cols-[1.5fr_1fr_1fr_1.5fr_auto]">
          <div>
            <label className="block text-xs font-medium text-neutral-600">Plan name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Pro"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600">Base USD</label>
            <input
              type="number"
              min="0"
              value={form.baseUSD}
              onChange={(e) => setForm({ ...form, baseUSD: e.target.value })}
              placeholder="19"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600">Billing</label>
            <select
              value={form.interval}
              onChange={(e) => setForm({ ...form, interval: e.target.value })}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-2 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="month">Monthly</option>
              <option value="quarter">Quarterly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600">
              Your plan ID <span className="text-neutral-400">(optional)</span>
            </label>
            <input
              value={form.externalId}
              onChange={(e) => setForm({ ...form, externalId: e.target.value })}
              placeholder="price_xxx / pro"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
          >
            {busy ? "Adding…" : "Add plan"}
          </button>
        </form>

        <p className="mt-4 text-xs text-neutral-400">
          “Your plan ID” is passed through to the subscription’s metadata at
          checkout, so your own app/webhook can grant the matching access.
          {" "}<strong>Tip:</strong> add a <em>Yearly</em> plan with the same name
          (e.g. Pro at 10× the monthly price = 2 months free) and your{" "}
          <Link href="/pricing" className="text-accent-dark underline">pricing page</Link>{" "}
          gets a Monthly/Yearly toggle automatically.
        </p>
      </section>

      {/* ---- What customers actually pay ---- */}
      {preview.length > 0 && (
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              What customers actually pay
            </h2>
            <Link href="/pricing" className="text-xs font-medium text-accent-dark underline">
              View your live pricing page →
            </Link>
          </div>
          <p className="mt-1 text-sm text-neutral-600">
            Live localized charges for your plans in a sample of markets, using
            your <strong>Pricing</strong> tab settings (max discount{" "}
            {settings.maxDiscount}%{settings.chargePremium ? ", premium on" : ""}).
            This is exactly what checkout will charge.
          </p>
          <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-100">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-2.5">Country</th>
                  {products.map((p) => (
                    <th key={p.id} className="px-4 py-2.5 text-right">
                      {p.name} <span className="font-normal normal-case text-neutral-400">(${p.baseUSD}/{intervalShort(p.interval)})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {preview.map((c) => (
                  <tr key={c.code} className="transition-colors hover:bg-amber-50/50">
                    <td className="px-4 py-2.5">
                      <span className="mr-2">{c.flag}</span>
                      {c.name}
                      {c.cells[0] && c.cells[0].discount !== 0 && (
                        <span
                          className={
                            "ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold " +
                            (c.cells[0].discount > 0
                              ? "bg-accent-soft text-accent-dark"
                              : "bg-emerald-100 text-emerald-700")
                          }
                        >
                          {c.cells[0].discount > 0
                            ? `${c.cells[0].discount}% off`
                            : `+${Math.abs(c.cells[0].discount)}%`}
                        </span>
                      )}
                    </td>
                    {c.cells.map((cell) => (
                      <td key={cell.id} className="px-4 py-2.5 text-right font-semibold">
                        {cell.display}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-neutral-400">
            A sample of your 36 markets — the full table lives in the{" "}
            <strong>Pricing</strong> tab.
          </p>
        </section>
      )}
    </div>
  );
}
