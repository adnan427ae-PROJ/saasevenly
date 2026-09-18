"use client";

import Link from "next/link";
import { GITHUB_URL, KOFI_URL } from "@/lib/site";

export default function DashboardHeader({ email, isAdmin }) {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="animate-fade-up mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            saas<span className="text-accent">evenly</span> dashboard
          </h1>
          <p className="text-sm text-neutral-500">
            Signed in as {email}. Prices update live for every country.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700"
            >
              ★ Admin
            </Link>
          )}
          <Link
            href="/pricing"
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-400"
          >
            View my pricing page →
          </Link>
          <button
            onClick={logout}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:border-neutral-400"
          >
            Log out
          </button>
        </div>
      </div>

      {/* No plans, no seats, no expiry — just a nudge to support the project. */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900">
        <span>
          ● <strong>Everything unlocked.</strong> saasevenly is free and open
          source — no plan, no limits, nothing to renew.
        </span>
        <span className="flex items-center gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-current px-2.5 py-1 text-xs font-semibold transition hover:bg-white/50"
          >
            ★ Star
          </a>
          <a
            href={KOFI_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-current px-2.5 py-1 text-xs font-semibold transition hover:bg-white/50"
          >
            ☕ Donate
          </a>
        </span>
      </div>
    </header>
  );
}
