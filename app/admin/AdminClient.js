"use client";

// Admin dashboard UI: live analytics + invite-code management.
// Numbers come pre-loaded from the server and can be refreshed on demand.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function fmtDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function daysLeft(until) {
  if (!until) return null;
  const ms = new Date(until).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

export default function AdminClient({ email, initialStats, initialInvites }) {
  const [stats, setStats] = useState(initialStats);
  const [invites, setInvites] = useState(initialInvites);
  const [refreshing, setRefreshing] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  async function refresh() {
    setRefreshing(true);
    try {
      const [s, i] = await Promise.all([
        fetch("/api/admin/stats").then((r) => r.json()),
        fetch("/api/admin/invites").then((r) => r.json()),
      ]);
      if (s.ok) setStats(s.stats);
      if (i.ok) setInvites(i.invites);
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
        <Stat label="Invites redeemed" value={stats.redeemed} />
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
            No real signups yet. Share an invite code below to get your first users.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-neutral-400">
                <tr>
                  <th className="pb-2 pr-4">User</th>
                  <th className="pb-2 pr-4">Invite</th>
                  <th className="pb-2 pr-4">Free until</th>
                  <th className="pb-2">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {stats.recent.map((u) => {
                  const left = daysLeft(u.freeUntil);
                  return (
                    <tr key={u.email + u.createdAt}>
                      <td className="py-2.5 pr-4">
                        <div className="font-medium text-neutral-800">{u.name || "—"}</div>
                        <div className="text-xs text-neutral-500">{u.email}</div>
                      </td>
                      <td className="py-2.5 pr-4">
                        {u.inviteCode ? (
                          <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">{u.inviteCode}</code>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        {u.freeUntil ? (
                          <span className={left > 0 ? "text-neutral-700" : "text-red-600"}>
                            {fmtDate(u.freeUntil)}
                            {left > 0 && <span className="text-neutral-400"> ({left}d)</span>}
                          </span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 text-neutral-500">{fmtDateTime(u.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Invite manager */}
      <InviteManager invites={invites} setInvites={setInvites} origin={origin} onChange={refresh} />
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

function InviteManager({ invites, setInvites, origin, onChange }) {
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState(25);
  const [freeDays, setFreeDays] = useState(90);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState("");

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, label, maxUses, freeDays }),
      });
      const data = await res.json();
      if (data.ok) {
        setInvites((prev) => [data.invite, ...prev]);
        setCode("");
        setLabel("");
        setMsg(`Created ${data.invite.code} ✓`);
      } else {
        setMsg(data.error || "Could not create.");
      }
    } catch {
      setMsg("Could not create.");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(""), 3000);
    }
  }

  async function toggle(inv) {
    const res = await fetch("/api/admin/invites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: inv.id, active: !inv.active }),
    });
    const data = await res.json();
    if (data.ok) setInvites((prev) => prev.map((x) => (x.id === inv.id ? data.invite : x)));
  }

  function copyLink(inv) {
    const link = `${origin}/signup?invite=${encodeURIComponent(inv.code)}`;
    navigator.clipboard?.writeText(link);
    setCopied(inv.code);
    setTimeout(() => setCopied(""), 1500);
  }

  return (
    <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Invite codes
      </h2>
      <p className="mt-1 text-sm text-neutral-600">
        Give these out to let people in for free during early access. Copy the
        invite link — it pre-fills the code on the signup page.
      </p>

      {/* Create form */}
      <form onSubmit={create} className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto_auto]">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="CODE (or auto)"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm uppercase outline-none focus:border-accent"
        />
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (e.g. Twitter)"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <label className="flex items-center gap-1.5 text-sm text-neutral-600">
          <input
            type="number"
            min="0"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            className="w-16 rounded-lg border border-neutral-300 px-2 py-2 text-sm outline-none focus:border-accent"
          />
          uses
        </label>
        <label className="flex items-center gap-1.5 text-sm text-neutral-600">
          <input
            type="number"
            min="0"
            value={freeDays}
            onChange={(e) => setFreeDays(e.target.value)}
            className="w-16 rounded-lg border border-neutral-300 px-2 py-2 text-sm outline-none focus:border-accent"
          />
          days
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
        >
          {busy ? "…" : "Create"}
        </button>
      </form>
      <p className="mt-1.5 text-xs text-neutral-400">
        Uses = 0 means unlimited. Days = length of free access granted when someone
        signs up with the code.
      </p>
      {msg && <p className="mt-2 text-sm text-green-600">{msg}</p>}

      {/* List */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="pb-2 pr-4">Code</th>
              <th className="pb-2 pr-4">Label</th>
              <th className="pb-2 pr-4">Usage</th>
              <th className="pb-2 pr-4">Free</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {invites.map((inv) => (
              <tr key={inv.id}>
                <td className="py-2.5 pr-4">
                  <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm font-semibold">{inv.code}</code>
                </td>
                <td className="py-2.5 pr-4 text-neutral-500">{inv.label || "—"}</td>
                <td className="py-2.5 pr-4">
                  {inv.usedCount}
                  {inv.unlimited ? " / ∞" : ` / ${inv.maxUses}`}
                </td>
                <td className="py-2.5 pr-4 text-neutral-500">{inv.freeDays}d</td>
                <td className="py-2.5 pr-4">
                  {inv.active ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Active</span>
                  ) : (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-500">Disabled</span>
                  )}
                </td>
                <td className="py-2.5">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => copyLink(inv)}
                      className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-semibold text-neutral-700 transition hover:border-accent"
                    >
                      {copied === inv.code ? "Copied ✓" : "Copy link"}
                    </button>
                    <button
                      onClick={() => toggle(inv)}
                      className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400"
                    >
                      {inv.active ? "Disable" : "Enable"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
