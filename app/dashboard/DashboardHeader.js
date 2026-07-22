"use client";

import Link from "next/link";

export default function DashboardHeader({ email, subscriptionActive, isAdmin, freeUntil }) {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const freeDaysLeft = freeUntil
    ? Math.ceil((new Date(freeUntil).getTime() - Date.now()) / 86400000)
    : null;

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
          <Link
            href="/billing"
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:border-neutral-400"
          >
            Billing
          </Link>
          <button
            onClick={logout}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:border-neutral-400"
          >
            Log out
          </button>
        </div>
      </div>

      {/* Access status. During early access everyone is on free access. */}
      <div
        className={
          "mt-4 flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm " +
          (subscriptionActive
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-red-200 bg-red-50 text-red-800")
        }
      >
        <span>
          {subscriptionActive ? (
            freeDaysLeft != null ? (
              <>🎉 <strong>Free early access</strong> — your embed localizes prices.{" "}
                {freeDaysLeft > 0
                  ? <>{freeDaysLeft} day{freeDaysLeft === 1 ? "" : "s"} left in your free window.</>
                  : <>Your free window has ended.</>}
              </>
            ) : (
              <>● Access <strong>active</strong> — your embed localizes prices.</>
            )
          ) : (
            <>○ Access <strong>inactive</strong> — your embed stops localizing (visitors see plain USD).</>
          )}
        </span>
        <Link
          href="/billing"
          className="rounded-md border border-current px-2.5 py-1 text-xs font-semibold transition hover:bg-white/40"
        >
          Details →
        </Link>
      </div>
    </header>
  );
}
