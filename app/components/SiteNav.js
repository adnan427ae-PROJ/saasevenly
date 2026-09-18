// Sticky frosted-glass nav shared by the public pages.
import Link from "next/link";
import { GITHUB_URL, accountsEnabled } from "@/lib/site";

export default function SiteNav() {
  const accounts = accountsEnabled();

  return (
    <header className="glass sticky top-0 z-50 border-b border-neutral-200/70">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          saas<span className="text-accent">evenly</span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
            open source
          </span>
        </Link>
        <div className="flex items-center gap-1 text-sm font-medium">
          <Link
            href="/pricing"
            className="rounded-lg px-3 py-1.5 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            Live demo
          </Link>
          <Link
            href="/install"
            className="hidden rounded-lg px-3 py-1.5 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 sm:block"
          >
            Install guide
          </Link>
          <Link
            href="/donate"
            className="rounded-lg px-3 py-1.5 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            Donate
          </Link>
          {accounts && (
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              Log in
            </Link>
          )}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="ml-2 rounded-lg bg-neutral-900 px-4 py-1.5 font-semibold text-white shadow-sm transition hover:bg-neutral-700 hover:shadow"
          >
            ★ GitHub
          </a>
        </div>
      </nav>
    </header>
  );
}
