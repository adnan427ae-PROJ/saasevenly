// Sticky frosted-glass nav shared by the public pages.
import Link from "next/link";

export default function SiteNav() {
  return (
    <header className="glass sticky top-0 z-50 border-b border-neutral-200/70">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          saas<span className="text-accent">evenly</span>
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
            className="rounded-lg px-3 py-1.5 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            Install guide
          </Link>
          <Link
            href="/login"
            className="rounded-lg px-3 py-1.5 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="ml-2 rounded-lg bg-accent px-4 py-1.5 font-semibold text-white shadow-sm transition hover:bg-accent-dark hover:shadow"
          >
            Redeem invite
          </Link>
        </div>
      </nav>
    </header>
  );
}
