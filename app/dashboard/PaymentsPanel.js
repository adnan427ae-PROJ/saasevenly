"use client";

// The "Payments" tab: pick which gateway charges your customers, and see at a
// glance whether each one's keys are connected.
import { useState } from "react";

export default function PaymentsPanel({ providers, activeProvider }) {
  const [active, setActive] = useState(activeProvider);
  const [savingId, setSavingId] = useState(null);
  const [msg, setMsg] = useState("");

  async function choose(id) {
    setSavingId(id);
    setMsg("");
    try {
      // Saves ONLY the provider; the server merges it onto your other settings.
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentProvider: id }),
      });
      const data = await res.json();
      if (data.ok) {
        setActive(id);
        setMsg(`Active gateway set to ${labelFor(providers, id)} ✓`);
      } else {
        setMsg("Could not save.");
      }
    } catch {
      setMsg("Could not save.");
    } finally {
      setSavingId(null);
      setTimeout(() => setMsg(""), 3000);
    }
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Payment gateway
      </h2>
      <p className="mt-1 text-sm text-neutral-600">
        Choose who charges your customers. You only need keys for the one you
        pick. Prices are localized the same way no matter which you choose.
      </p>

      <div className="mt-6 space-y-4">
        {providers.map((p) => {
          const isActive = active === p.id;
          return (
            <div
              key={p.id}
              className={
                "rounded-xl border p-5 transition " +
                (isActive ? "border-accent ring-1 ring-accent" : "border-neutral-200")
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold">{p.label}</span>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                      {p.mode === "subscription" ? "Monthly subscription" : "One-time payment"}
                    </span>
                    {/* Connected = its keys are present in .env.local */}
                    {p.configured ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        ● Connected
                      </span>
                    ) : (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-500">
                        ○ Not connected
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">{p.blurb}</p>
                </div>

                <button
                  type="button"
                  onClick={() => choose(p.id)}
                  disabled={savingId === p.id || isActive}
                  className={
                    "shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60 " +
                    (isActive
                      ? "bg-accent text-white"
                      : "border border-neutral-300 text-neutral-800 hover:border-accent")
                  }
                >
                  {isActive ? "Active" : savingId === p.id ? "Saving…" : "Use this"}
                </button>
              </div>

              {/* What keys this gateway needs */}
              <div className="mt-4 rounded-lg bg-neutral-50 p-3">
                <p className="text-xs font-semibold text-neutral-500">
                  Keys to put in .env.local:
                </p>
                <ul className="mt-1 space-y-0.5">
                  {p.requiredEnv.map((k) => (
                    <li key={k}>
                      <code className="text-xs text-neutral-700">{k}</code>
                    </li>
                  ))}
                </ul>
                <a
                  href={p.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-medium text-accent-dark underline"
                >
                  Where to get these keys →
                </a>
              </div>

              {isActive && !p.configured && (
                <p className="mt-3 text-sm text-amber-700">
                  ⚠ This gateway is selected but its keys aren't in{" "}
                  <code>.env.local</code> yet, so checkout will fail until you add
                  them and restart the server.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {msg && <p className="mt-4 text-sm text-green-600">{msg}</p>}

      <p className="mt-5 text-xs text-neutral-400">
        Only <strong>Stripe</strong> has been end-to-end tested; it does true
        monthly subscriptions. PayPal, Razorpay and Dodo are fully wired — add
        their keys and run one test payment to confirm. PayPal/Razorpay charge a
        one-time payment. <strong>Dodo Payments</strong> is a Merchant of Record
        (it handles your global sales tax/VAT) and needs a Pay-What-You-Want
        product so we can pass your localized price.
      </p>
    </section>
  );
}

function labelFor(providers, id) {
  const p = providers.find((x) => x.id === id);
  return p ? p.label : id;
}
