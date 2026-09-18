"use client";

// Admin dashboard UI for whoever runs this instance: who has signed up, how
// fast, and which of them have actually gone live (registered a domain).
// Numbers come pre-loaded from the server and can be refreshed on demand.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function fmtDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminClient({ email, initialStats }) {
  const [stats, setStats] = useState(initialStats);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const s = await fetch("/api/admin/stats").then((r) => r.json());
      if (s.ok) setStats(s.stats);
    } finally {
      setRefreshing(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const maxDaily = useMemo(
    () => Math.max(1, ...stats.daily.map((d) => d.n)),
    [stats.daily]
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              saas<span className="text-accent">evenly</span> admin
            </h1>
            <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-semibold text-white">
              private
            </span>
          </div>
          <p className="text-sm text-neutral-500">Signed in as {email}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-400 disabled:opacity-60"
          >
            {refreshing ? "Refreshing…" : "↻ Refresh"}
          </button>
          <Link
            href="/dashboard"
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-400"
          >
            My dashboard
          </Link>
          <button
            onClick={logout}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:border-neutral-400"
          >
            Log out
          </button>
        </div>
      </header>

      {/* Stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Registered users" value={stats.total} accent />
        <Stat label="New — last 24h" value={stats.last24} />
        <Stat label="New — last 7 days" value={stats.last7} />
        <Stat label="Live (domain added)" value={stats.live} />
      </section>

      {/* Signups chart */}
      <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Signups — last 14 days
        </h2>
        <div className="mt-5 flex h-40 items-end gap-1.5">
          {stats.daily.map((d) => (
            <div key={d.day} className="group flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs font-semibold text-neutral-400 opacity-0 transition group-hover:opacity-100">
                {d.n}
              </span>
              <div
                className="w-full rounded-t bg-accent/80 transition group-hover:bg-accent"
                style={{ height: `${(d.n / maxDaily) * 100}%`, minHeight: d.n > 0 ? "6px" : "2px" }}
                title={`${d.day}: ${d.n}`}
              />
              <span className="text-[10px] text-neutral-400">{d.day.slice(5)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Recent signups */}
      <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Recent signups
        </h2>
        {stats.recent.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            No signups yet on this instance.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-neutral-400">
                <tr>
                  <th className="pb-2 pr-4">User</th>
                  <th className="pb-2 pr-4">Domains</th>
                  <th className="pb-2">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {stats.recent.map((u) => (
                  <tr key={u.email + u.createdAt}>
                    <td className="py-2.5 pr-4">
                      <div className="font-medium text-neutral-800">{u.name || "—"}</div>
                      <div className="text-xs text-neutral-500">{u.email}</div>
                    </td>
                    <td className="py-2.5 pr-4">
                      {u.domains ? (
                        <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">{u.domains}</code>
                      ) : (
                        <span className="text-neutral-400">not live yet</span>
                      )}
                    </td>
                    <td className="py-2.5 text-neutral-500">{fmtDateTime(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className={"text-3xl font-bold " + (accent ? "text-accent-dark" : "text-neutral-900")}>
        {value}
      </div>
      <div className="mt-1 text-sm text-neutral-500">{label}</div>
    </div>
  );
}
