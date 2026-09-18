// What /signup and /login show on the PUBLIC DEMO deploy.
//
// saasevenly.vercel.app exists to demonstrate the project, not to host other
// people's pricing. Since the whole thing is MIT-licensed and deploys in a
// couple of minutes, the honest answer to "let me sign up" is "here's how to
// run your own" — so that's what this page says.
import Link from "next/link";
import SiteNav from "./SiteNav";
import { GITHUB_URL, DEPLOY_URL, KOFI_URL } from "@/lib/site";

const STEPS = [
  {
    n: "1",
    title: "Create a free Postgres database",
    body: "Make a project on Supabase (or Neon — any Postgres works), open the SQL editor, and run schema.sql from the repo. Takes about a minute.",
  },
  {
    n: "2",
    title: "Deploy the repo",
    body: "Hit Deploy below. Vercel forks saasevenly into your own GitHub account and asks for DATABASE_URL — paste your connection string and it builds.",
  },
  {
    n: "3",
    title: "Sign up on your instance",
    body: "Open your new URL, create an account, set your base price, add your domain, and paste the two-line embed into your site. Done.",
  },
];

export default function SelfHostGate() {
  return (
    <>
      <SiteNav />
      <main className="relative mx-auto max-w-3xl px-6 py-16">
        {/* Backdrop */}
        <div className="pointer-events-none absolute inset-x-[-40vw] -top-14 h-[420px] -z-10">
          <div className="bg-grid absolute inset-0" />
          <div className="absolute left-[24%] top-6 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl animate-blob" />
        </div>

        <div className="text-center">
          <span className="animate-fade-up mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
            Free · MIT licensed · no accounts to buy
          </span>
          <h1 className="animate-fade-up text-4xl font-bold tracking-tight" style={{ animationDelay: "80ms" }}>
            There's nothing to sign up for —{" "}
            <span className="text-gradient">it's yours</span>
          </h1>
          <p
            className="animate-fade-up mx-auto mt-4 max-w-xl text-neutral-600"
            style={{ animationDelay: "160ms" }}
          >
            This site is the live demo. saasevenly itself is open source, so
            instead of renting an account here, you run the whole thing yourself:
            your database, your keys, your customers' money going straight to
            your own gateway. No middleman, nothing to cancel.
          </p>

          <div
            className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "240ms" }}
          >
            <a
              href={DEPLOY_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-accent px-6 py-3 font-semibold text-white shadow-lg shadow-accent/30 transition hover:-translate-y-0.5 hover:bg-accent-dark"
            >
              Deploy your own →
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-neutral-300 bg-white px-6 py-3 font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:border-neutral-400"
            >
              ★ Star on GitHub
            </a>
          </div>
        </div>

        {/* Three steps */}
        <ol className="animate-fade-up mt-14 space-y-4" style={{ animationDelay: "320ms" }}>
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="card-lift flex gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft font-bold text-accent-dark">
                {s.n}
              </span>
              <div>
                <h2 className="font-bold">{s.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-center">
          <p className="text-sm text-neutral-600">
            Want to see what you're deploying first? The{" "}
            <Link href="/pricing" className="font-medium text-accent-dark underline">live demo</Link>{" "}
            prices 36 markets in real time, and the{" "}
            <Link href="/install" className="font-medium text-accent-dark underline">install guide</Link>{" "}
            shows the exact two snippets you'd paste into your site.
          </p>
          <p className="mt-4 text-sm text-neutral-500">
            If it saves you money, you can{" "}
            <a href={KOFI_URL} target="_blank" rel="noreferrer" className="font-medium text-accent-dark underline">
              buy me a coffee
            </a>
            . Completely optional — the software is the same either way.
          </p>
        </div>
      </main>
    </>
  );
}
