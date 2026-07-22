"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function BillingClient({ email, active, plan, hasCustomer, configured, plans, freeUntil, inviteCode, isAdmin }) {
  const [busy, setBusy] = useState(null); // plan id | "portal" | "toggle"
  const [msg, setMsg] = useState(null);
  const [isActive, setIsActive] = useState(active);

  // During early access payments aren't live yet — everyone is on free access.
  const earlyAccess = !configured;
  const freeDaysLeft = freeUntil
    ? Math.ceil((new Date(freeUntil).getTime() - Date.now()) / 86400000)
    : null;

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("status");
    if (status === "success") {
      setMsg({ kind: "success", text: "Subscription started — welcome aboard! 🎉 (It can take a few seconds for the webhook to confirm.)" });
    } else if (status === "cancelled") {
      setMsg({ kind: "info", text: "Checkout cancelled — no charge was made." });
    }
  }, []);

  async function subscribe(planId) {
    setBusy(planId);
    setMsg(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else {
        setMsg({ kind: "error", text: data.error || "Could not start checkout." });
        setBusy(null);
      }
    } catch {
      setMsg({ kind: "error", text: "Could not reach the server." });
      setBusy(null);
    }
  }

  async function openPortal() {
    setBusy("portal");
    setMsg(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else {
        setMsg({ kind: "error", text: data.error || "Could not open the billing portal." });
        setBusy(null);
      }
    } catch {
      setMsg({ kind: "error", text: "Could not reach the server." });
      setBusy(null);
    }
  }

  // Dev-only fallback while Stripe isn't connected: the old simulate toggle.
  async function simulateToggle() {
    setBusy("toggle");
    try {
      const res = await fetch("/api/billing/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !isActive }),
      });
      const data = await res.json();
      if (data.ok) setIsActive(data.subscriptionActive);
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="relative mx-auto max-w-3xl px-6 py-12">
      {/* Backdrop */}
      <div className="pointer-events-none absolute inset-x-[-40vw] -top-14 h-[420px] -z-10">
        <div className="bg-grid absolute inset-0" />
        <div className="absolute left-[24%] top-6 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl animate-blob" />
      </div>

      <div className="animate-fade-up flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Your saas<span className="text-accent">evenly</span> plan
          </h1>
          <p className="mt-1 text-sm text-neutral-500">{email}</p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Early-access banner */}
      {earlyAccess && (
        <div className="animate-fade-up mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5" style={{ animationDelay: "40ms" }}>
          <p className="font-semibold text-emerald-900">
            🎉 You're on free early access{inviteCode ? <> (invite <code className="rounded bg-white/70 px-1">{inviteCode}</code>)</> : null}
          </p>
          <p className="mt-1.5 text-sm text-emerald-800">
            Everything is unlocked and free while saasevenly is in beta
            {freeDaysLeft != null && freeDaysLeft > 0 ? <> — you have <strong>{freeDaysLeft} days</strong> in your free window</> : null}.
            No card needed, nothing to pay. We'll email you well before early
            access ends, and you'll only pay if you choose to keep it after launch.
          </p>
          <p className="mt-2 text-xs text-emerald-700">
            The plans below are our planned launch pricing, shown so you know what to expect.
          </p>
        </div>
      )}

      {msg && (
        <div
          className={
            "animate-fade-up mt-5 rounded-lg px-4 py-3 text-sm font-medium " +
            (msg.kind === "success"
              ? "bg-green-50 text-green-700"
              : msg.kind === "error"
              ? "bg-red-50 text-red-700"
              : "bg-neutral-100 text-neutral-700")
          }
        >
          {msg.text}
        </div>
      )}

      {/* Status (hidden during early access — the banner above covers it) */}
      {!earlyAccess && (
      <div
        className={
          "animate-fade-up mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-4 " +
          (isActive ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50")
        }
        style={{ animationDelay: "80ms" }}
      >
        <div className="text-sm">
          {isActive ? (
            <span className="text-green-800">
              ● Subscription <strong>active</strong>
              {plan ? <> · {plan} plan</> : null} — your embed localizes prices for your visitors.
            </span>
          ) : (
            <span className="text-red-800">
              ○ Subscription <strong>inactive</strong> — your embed has stopped localizing
              (visitors see plain USD) and checkout is disabled.
            </span>
          )}
        </div>
        {configured && hasCustomer && (
          <button
            onClick={openPortal}
            disabled={busy === "portal"}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 disabled:opacity-60"
          >
            {busy === "portal" ? "Opening…" : "Manage billing / invoices →"}
          </button>
        )}
      </div>
      )}

      {/* Plans */}
      <h2 className="animate-fade-up mt-8 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {earlyAccess ? "Planned launch pricing" : "Plans"}
      </h2>
      <div className="mt-3 grid gap-5 sm:grid-cols-2">
        {plans.map((p, i) => {
          const highlight = p.id === "yearly";
          const current = isActive && plan === p.id;
          return (
            <div
              key={p.id}
              className={
                "card-lift animate-fade-up flex flex-col rounded-2xl border bg-white p-6 shadow-sm " +
                (highlight ? "border-accent ring-1 ring-accent" : "border-neutral-200")
              }
              style={{ animationDelay: `${140 + i * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{p.label}</h2>
                {highlight && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                    2 months free
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">${p.usd}</span>
                <span className="text-sm text-neutral-500">/{p.interval === "year" ? "yr" : "mo"}</span>
              </div>
              <ul className="mt-4 space-y-1.5 text-sm text-neutral-600">
                <li>✓ Unlimited localized prices on your site</li>
                <li>✓ All 36 markets, live FX, PPP tiers</li>
                <li>✓ Checkout in your visitor's currency</li>
                <li>✓ {p.blurb}</li>
              </ul>
              {earlyAccess ? (
                <div className="mt-6 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center text-sm font-semibold text-emerald-700">
                  Free during early access
                </div>
              ) : (
                <button
                  onClick={() => subscribe(p.id)}
                  disabled={busy === p.id || current}
                  className={
                    "mt-6 w-full rounded-lg px-4 py-2.5 font-semibold transition disabled:opacity-60 " +
                    (highlight
                      ? "bg-accent text-white shadow-md shadow-accent/25 hover:-translate-y-0.5 hover:bg-accent-dark"
                      : "border border-neutral-300 text-neutral-800 hover:-translate-y-0.5 hover:border-accent hover:text-accent-dark")
                  }
                >
                  {current ? "Current plan ✓" : busy === p.id ? "Starting…" : `Subscribe ${p.label.toLowerCase()}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Not-configured / dev notice — admin-only so regular users don't see it */}
      {!configured && isAdmin && (
        <div className="animate-fade-up mt-8 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm text-neutral-700" style={{ animationDelay: "300ms" }}>
          <p className="font-semibold text-neutral-800">⚠ Billing isn't connected yet (admin view)</p>
          <p className="mt-1.5">
            To take real subscriptions, add your platform Stripe key to{" "}
            <code className="rounded bg-white px-1">.env.local</code> as{" "}
            <code className="rounded bg-white px-1">SAASEVENLY_STRIPE_SECRET_KEY</code>, create a
            webhook endpoint for <code className="rounded bg-white px-1">/api/billing/webhook</code>,
            and set <code className="rounded bg-white px-1">SAASEVENLY_STRIPE_WEBHOOK_SECRET</code>.
          </p>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white/70 px-4 py-2.5">
            <span className="text-xs text-neutral-600">
              Until then, use the test toggle to see how gating behaves for {isActive ? "churned" : "active"} accounts.
            </span>
            <button
              onClick={simulateToggle}
              disabled={busy === "toggle"}
              className="shrink-0 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400 disabled:opacity-60"
            >
              {busy === "toggle" ? "…" : isActive ? "Simulate cancel" : "Simulate resubscribe"}
            </button>
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-neutral-400">
        {earlyAccess
          ? "No payment required during early access. When we launch, payments will be processed by Stripe and you can cancel anytime."
          : "Payments are processed by Stripe. Cancel anytime — your embed keeps localizing until the end of the paid period."}
      </p>
    </main>
  );
}
