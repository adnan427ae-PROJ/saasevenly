"use client";

// The "Domains" tab: the anti-piracy lock. A founder lists the website(s) their
// embed is allowed to run on. saasevenly checks every price/checkout request's
// Origin against this list, so a copied site key won't work on someone else's
// site. Empty list = not locked yet (works everywhere) — we nudge them to lock.
import { useState } from "react";

// Client-side mirror of lib/domains.js normalizeDomain, so the chip preview
// matches what the server will store.
function normalizeDomain(input) {
  if (!input) return "";
  let s = String(input).trim().toLowerCase();
  if (!s) return "";
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  s = s.split("/")[0].split("?")[0].split("#")[0];
  s = s.split("@").pop().split(":")[0];
  return s.replace(/^www\./, "");
}

export default function DomainsPanel({ initialDomains }) {
  const [domains, setDomains] = useState(initialDomains || []);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const locked = domains.length > 0;

  async function persist(next) {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domains: next }),
      });
      const data = await res.json();
      if (data.ok) {
        setDomains(data.domains);
        setMsg("Saved ✓");
      } else {
        setMsg(data.error || "Could not save.");
      }
    } catch {
      setMsg("Could not save.");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 3000);
    }
  }

  function addDomain(e) {
    e.preventDefault();
    const d = normalizeDomain(input);
    if (!d) return;
    if (domains.includes(d)) {
      setInput("");
      return;
    }
    const next = [...domains, d];
    setInput("");
    persist(next);
  }

  function removeDomain(d) {
    persist(domains.filter((x) => x !== d));
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Allowed domains
      </h2>
      <p className="mt-1 text-sm text-neutral-600">
        Your site key is <strong>public</strong> — anyone can read it in your
        page's source. Locking it to your domain(s) means a copied key won't work
        on anyone else's site: no one else can run their pricing through your
        instance. This is the same protection Google Maps and Stripe keys use.
      </p>

      {/* Lock status banner */}
      <div
        className={
          "mt-5 rounded-lg border p-4 " +
          (locked
            ? "border-emerald-200 bg-emerald-50/70"
            : "border-amber-200 bg-amber-50/70")
        }
      >
        {locked ? (
          <p className="text-sm text-emerald-800">
            🔒 <strong>Locked.</strong> Your embed only runs on the{" "}
            {domains.length === 1 ? "domain" : "domains"} below. Requests from any
            other site are rejected.
          </p>
        ) : (
          <p className="text-sm text-amber-800">
            🔓 <strong>Not locked yet.</strong> Right now your key works on{" "}
            <em>any</em> website. Add your domain below so no one else can point
            their site at your instance. (Your own embed keeps working — this
            only blocks other people's sites.)
          </p>
        )}
      </div>

      {/* Add form */}
      <form onSubmit={addDomain} className="mt-5 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="yourdomain.com"
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={saving || !input.trim()}
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Add domain"}
        </button>
      </form>
      <p className="mt-1.5 text-xs text-neutral-500">
        Just the bare domain — no <code>https://</code>, no <code>/pricing</code>.
        Adding <code>acme.com</code> also covers <code>www.acme.com</code> and
        subdomains like <code>app.acme.com</code>. <code>localhost</code> is always
        allowed for testing.
      </p>

      {/* Chips */}
      {domains.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {domains.map((d) => (
            <li
              key={d}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 py-1 pl-3 pr-1.5 text-sm font-medium text-neutral-700"
            >
              <span>{d}</span>
              <button
                type="button"
                onClick={() => removeDomain(d)}
                disabled={saving}
                aria-label={`Remove ${d}`}
                className="flex h-5 w-5 items-center justify-center rounded-full text-neutral-400 transition hover:bg-red-100 hover:text-red-600 disabled:opacity-60"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {msg && <p className="mt-4 text-sm text-green-600">{msg}</p>}
    </section>
  );
}
