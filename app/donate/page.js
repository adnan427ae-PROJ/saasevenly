// The support page. Deliberately low-pressure: saasevenly is MIT and complete,
// donations change nothing about what you get. This page exists so the people
// who WANT to chip in have somewhere obvious to do it.
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import Reveal from "../components/Reveal";
import { GITHUB_URL, KOFI_URL, DEPLOY_URL } from "@/lib/site";

export const metadata = {
  title: "Support",
  description:
    "saasevenly is free and open source. If it made you money, you can buy me a coffee — but the software is the same either way.",
};

const USES = [
  {
    icon: "🌐",
    title: "The demo stays up",
    body: "saasevenly.vercel.app runs the live 36-market demo and the exchange-rate fetches behind it. Hosting and the database cost real money every month.",
  },
  {
    icon: "🧭",
    title: "More markets, better data",
    body: "Keeping PPP factors, currencies and charm-rounding rules accurate across countries is ongoing work. Every market added is a market someone can finally sell to.",
  },
  {
    icon: "🔌",
    title: "More payment gateways",
    body: "Stripe, PayPal, Razorpay and Dodo are wired today. Each new gateway is a chunk of integration and testing that lets more founders in more countries actually collect money.",
  },
];

const FREE_WAYS = [
  {
    icon: "★",
    title: "Star the repo",
    body: "The cheapest thing you can do and genuinely the most useful — it's how other founders find it.",
    href: GITHUB_URL,
    cta: "Star on GitHub",
  },
  {
    icon: "🛠",
    title: "Send a pull request",
    body: "Missing country? Gateway you use? Bug in the rounding? The codebase is small, commented, and plain JavaScript.",
    href: GITHUB_URL + "/issues",
    cta: "Open an issue",
  },
  {
    icon: "📣",
    title: "Tell one founder",
    body: "Someone you know is charging Lagos the same price as San Francisco and losing the sale. Send them the demo.",
    href: "/pricing",
    cta: "Open the demo",
    internal: true,
  },
];

export default function DonatePage() {
  return (
    <>
      <SiteNav />
      <main className="relative mx-auto max-w-4xl px-6 pb-24">
        {/* Hero */}
        <section className="relative pt-20 text-center">
          <div className="pointer-events-none absolute inset-x-[-50vw] -top-14 bottom-0 -z-10">
            <div className="bg-grid absolute inset-0" />
            <div className="absolute left-[22%] top-10 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl animate-blob" />
          </div>

          <span className="animate-fade-up mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
            Free forever · MIT licensed · no paid tier
          </span>
          <h1 className="animate-fade-up text-4xl font-bold tracking-tight sm:text-5xl" style={{ animationDelay: "80ms" }}>
            You don't have to pay for this.
            <br />
            <span className="text-gradient">That's rather the point.</span>
          </h1>
          <p
            className="animate-fade-up mx-auto mt-5 max-w-2xl text-lg text-neutral-600"
            style={{ animationDelay: "160ms" }}
          >
            saasevenly ships with everything unlocked and always will — no plan,
            no seats, no usage cap, no feature held back for a "pro" version that
            doesn't exist. If it wins you customers you were losing, and you feel
            like saying thanks, here's the tip jar.
          </p>

          <div className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "240ms" }}>
            <a
              href={KOFI_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-accent px-7 py-3.5 text-lg font-semibold text-white shadow-lg shadow-accent/30 transition hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-xl"
            >
              ☕ Buy me a coffee
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-neutral-300 bg-white px-6 py-3.5 font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:border-neutral-400"
            >
              ★ Star instead — also great
            </a>
          </div>
          <p className="animate-fade-up mt-4 text-sm text-neutral-500" style={{ animationDelay: "300ms" }}>
            One-off, any amount, no account needed. There is no subscription and
            nothing to cancel.
          </p>
        </section>

        {/* Where it goes */}
        <section className="mt-24">
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tight">Where the money actually goes</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-neutral-600">
              No company, no team, no runway. Just the running costs of keeping
              this thing alive and improving.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {USES.map((u, i) => (
              <Reveal key={u.title} delay={i * 120}>
                <div className="card-lift h-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-2xl">
                    {u.icon}
                  </div>
                  <h3 className="mt-3 font-bold">{u.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">{u.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* What donating does NOT buy */}
        <Reveal as="section" className="mt-24">
          <div className="relative overflow-hidden rounded-3xl bg-neutral-900 px-8 py-12 text-white">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
            <h2 className="text-center text-3xl font-bold tracking-tight">
              What donating does <span className="text-accent">not</span> get you
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-neutral-300">
              Being clear about this matters more than the money.
            </p>
            <ul className="mx-auto mt-8 max-w-xl space-y-3 text-neutral-200">
              {[
                "No extra features — there is no pro tier to unlock.",
                "No higher limits — there are no limits to raise.",
                "No priority support — issues are answered in the order they arrive.",
                "No licence — MIT already gives you everything, including the right to fork it and sell it.",
              ].map((t) => (
                <li key={t} className="flex gap-3 rounded-lg bg-white/5 px-4 py-3 text-sm">
                  <span className="text-accent">✕</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <p className="mx-auto mt-8 max-w-xl text-center text-sm text-neutral-400">
              You get a thank-you and the knowledge that the demo stays online for
              the next founder who needs it. That's the whole deal.
            </p>
          </div>
        </Reveal>

        {/* Free ways to help */}
        <section className="mt-24">
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Broke? These help just as much
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-neutral-600">
              Honestly — a star and a share are worth more to this project than a
              coffee.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {FREE_WAYS.map((w, i) => (
              <Reveal key={w.title} delay={i * 120}>
                <div className="card-lift flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-xl">
                    {w.icon}
                  </div>
                  <h3 className="mt-3 font-bold">{w.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">{w.body}</p>
                  {w.internal ? (
                    <Link href={w.href} className="mt-4 text-sm font-semibold text-accent-dark underline">
                      {w.cta} →
                    </Link>
                  ) : (
                    <a
                      href={w.href}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 text-sm font-semibold text-accent-dark underline"
                    >
                      {w.cta} →
                    </a>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <Reveal as="section" className="mt-24">
          <div className="relative overflow-hidden rounded-3xl border border-accent bg-accent-soft px-8 py-12 text-center">
            <div className="pointer-events-none absolute -left-20 -bottom-24 h-64 w-64 rounded-full bg-white/50 blur-3xl" />
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
              Haven't run it yet? Do that first.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-neutral-700">
              Deploy your own copy, point it at your pricing page, and see whether
              it actually moves your numbers. Decide about the coffee afterwards.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a
                href={DEPLOY_URL}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-accent px-6 py-3 font-semibold text-white shadow-lg shadow-accent/30 transition hover:-translate-y-0.5 hover:bg-accent-dark"
              >
                Deploy your own →
              </a>
              <Link
                href="/pricing"
                className="rounded-lg border border-neutral-400 bg-white px-6 py-3 font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:border-neutral-500"
              >
                See the live demo
              </Link>
            </div>
          </div>
        </Reveal>
      </main>
    </>
  );
}
