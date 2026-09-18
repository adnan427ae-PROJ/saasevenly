// Landing / "why you should use this" page.
// Server component so it can show REAL, live-computed prices for your countries
// (pulled from your saved settings + today's FX), grouped into pricing tiers.
import Link from "next/link";
import { getDefaultTenant, rowToSettings } from "@/lib/tenants";
import { listCountries } from "@/lib/countries";
import { getRates } from "@/lib/rates";
import { effectiveRatio, effectiveDiscountFromPrice, localPrice, formatMoney } from "@/lib/pricing";
import SiteNav from "./components/SiteNav";
import HeroVisual from "./components/HeroVisual";
import Reveal from "./components/Reveal";
import CountUp from "./components/CountUp";
import { GITHUB_URL, KOFI_URL, DEPLOY_URL, LICENSE } from "@/lib/site";

export const dynamic = "force-dynamic";

// Group the countries into PPP bands. This is the "split countries by tiers"
// view — it makes the pricing structure easy to reason about.
const TIERS = [
  {
    key: "premium-plus",
    name: "Tier 0 · Premium markets (charged ABOVE US)",
    blurb: "Higher cost of living than the US. Charge a premium here — pure extra profit, and locals don't blink because everything costs more.",
    test: (ppp) => ppp > 1.0,
    accent: "from-emerald-600 to-emerald-700",
  },
  {
    key: "standard",
    name: "Tier 1 · Standard markets",
    blurb: "High purchasing power, on par with the US. Pay close to your US price.",
    test: (ppp) => ppp >= 0.6 && ppp <= 1.0,
    accent: "from-neutral-800 to-neutral-900",
  },
  {
    key: "growth",
    name: "Tier 2 · Growth markets",
    blurb: "Mid purchasing power. A meaningful discount unlocks volume.",
    test: (ppp) => ppp >= 0.35 && ppp < 0.6,
    accent: "from-amber-500 to-amber-600",
  },
  {
    key: "emerging",
    name: "Tier 3 · Emerging markets",
    blurb: "Lower purchasing power. Your US price is simply unaffordable here — a fair local price wins the customer you'd otherwise lose.",
    test: (ppp) => ppp < 0.35,
    accent: "from-orange-500 to-red-500",
  },
];

const LOGOS = ["Netflix", "Apple App Store", "Spotify", "Steam", "Microsoft 365", "YouTube Premium", "Adobe", "Notion"];

// Fallback so the marketing page still renders before Supabase is connected
// (or if the DB is unreachable) instead of crashing the whole homepage.
const DEMO_SETTINGS = {
  baseUSD: 19,
  endingStyle: "9",
  passthrough: 100,
  maxDiscount: 20,
  chargePremium: true,
  paymentProvider: "stripe",
  allowedDomains: [],
};

export default async function Home() {
  // The public marketing page previews the demo tenant's pricing.
  let settings = DEMO_SETTINGS;
  try {
    const demo = await getDefaultTenant();
    if (demo) settings = rowToSettings(demo);
  } catch {
    // No DATABASE_URL yet / DB unreachable — fall back to demo defaults.
  }
  const { rates } = await getRates();

  // Compute each country's real localized price at your base USD.
  const priced = listCountries().map((c) => {
    const fx = rates[c.currency] ?? 1;
    const ratio = effectiveRatio(c.pppFactor, settings.passthrough, settings.chargePremium, settings.maxDiscount);
    const value = localPrice(settings.baseUSD, ratio, fx, settings.endingStyle, c.decimals, settings.maxDiscount);
    return {
      ...c,
      // Accurate discount/premium from the ACTUAL rounded price (not the intent).
      discount: effectiveDiscountFromPrice(value, fx, settings.baseUSD),
      display: formatMoney(value, c.symbol, c.decimals),
    };
  });

  const tiers = TIERS.map((t) => ({
    ...t,
    countries: priced.filter((c) => t.test(c.pppFactor)),
  }));

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-5xl px-6 pb-24">
        {/* ---------- Hero ---------- */}
        <section className="relative pt-20 text-center">
          {/* Decorative background: blueprint grid + drifting amber blobs */}
          <div className="pointer-events-none absolute inset-x-[-50vw] -top-14 bottom-0 -z-10">
            <div className="bg-grid absolute inset-0" />
            <div className="absolute left-[18%] top-10 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl animate-blob" />
            <div
              className="absolute right-[16%] top-40 h-80 w-80 rounded-full bg-orange-200/40 blur-3xl animate-blob"
              style={{ animationDelay: "4s" }}
            />
          </div>

          <div className="animate-fade-up">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Free &amp; open source · {LICENSE} licensed · self-hosted
            </span>
          </div>
          <h1 className="animate-fade-up text-5xl font-bold tracking-tight sm:text-6xl" style={{ animationDelay: "80ms" }}>
            Stop losing 70% of the world to{" "}
            <span className="text-gradient">one wrong price.</span>
          </h1>
          <p
            className="animate-fade-up mx-auto mt-5 max-w-2xl text-lg text-neutral-600"
            style={{ animationDelay: "160ms" }}
          >
            You set <strong>one</strong> base price in USD. saasevenly shows every
            visitor a fair price in their own currency — with charm endings that
            convert — and charges it through your own Stripe. The exact playbook
            Netflix, Apple, and Spotify use, in two lines of code.
          </p>
          <p
            className="animate-fade-up mx-auto mt-3 max-w-2xl text-neutral-500"
            style={{ animationDelay: "200ms" }}
          >
            It's <strong className="text-neutral-700">free and open source</strong>.
            You run it yourself, on your own database, with your own payment keys
            — so the money goes straight from your customer to you.
          </p>
          <div
            className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "240ms" }}
          >
            <a
              href={DEPLOY_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-accent px-6 py-3 font-semibold text-white shadow-lg shadow-accent/30 transition hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-xl hover:shadow-accent/30"
            >
              Deploy your own →
            </a>
            <Link
              href="/pricing"
              className="rounded-lg border border-neutral-300 bg-white px-6 py-3 font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:border-neutral-400 hover:shadow-md"
            >
              See it live →
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-neutral-300 bg-white px-6 py-3 font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:border-neutral-400 hover:shadow-md"
            >
              ★ GitHub
            </a>
          </div>

          {/* Animated globe + floating localized prices */}
          <div className="animate-fade-in" style={{ animationDelay: "350ms" }}>
            <HeroVisual />
          </div>
        </section>

        {/* ---------- The conversion case ---------- */}
        <section className="mt-24 grid gap-4 sm:grid-cols-3">
          {[
            {
              stat: <CountUp end={4} prefix="1.6–" suffix="×" />,
              label: "more checkouts in emerging markets when prices match local purchasing power",
              src: "Gumroad & Paddle PPP experiments",
            },
            {
              stat: <CountUp end={30} prefix="+" suffix="%" />,
              label: "average lift in paid conversions reported after localizing currency & price",
              src: "industry case studies",
            },
            {
              stat: <CountUp end={100} suffix="%" />,
              label: "of the global SaaS leaders already price by region — you're competing with them",
              src: "Netflix, Apple, Spotify, Steam…",
            },
          ].map((b, i) => (
            <Reveal key={b.src} delay={i * 120}>
              <div className="card-lift h-full rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
                <div className="text-4xl font-bold text-accent-dark">{b.stat}</div>
                <p className="mt-2 text-sm text-neutral-600">{b.label}</p>
                <p className="mt-3 text-xs text-neutral-400">{b.src}</p>
              </div>
            </Reveal>
          ))}
        </section>
        <p className="mt-3 text-center text-xs text-neutral-400">
          Ranges from published pricing studies; your results depend on your product and audience.
        </p>

        {/* ---------- The psychology ---------- */}
        <section className="mt-24">
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Why this actually makes people subscribe
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-neutral-600">
              Four well-documented pricing-psychology effects, working at once.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {[
              {
                icon: "🌍",
                title: "Willingness-to-pay matching (PPP)",
                body: "$19 is a rounding error in San Francisco and a day's wage in Lagos. Charging both the same price means one group overpays and the other can't buy at all. Pricing to local purchasing power captures buyers you were silently turning away.",
              },
              {
                icon: "🔚",
                title: "Charm pricing (the '9' effect)",
                body: "₹449 reads as dramatically cheaper than ₹450 — the brain anchors on the left-most digit. saasevenly re-applies your charm ending (9 / .99 / round) in every currency, so localized prices still feel deliberate, not auto-translated.",
              },
              {
                icon: "🏦",
                title: "Local-currency trust",
                body: "Seeing ₹ or R$ instead of $ removes the 'is this card going to work / how much is that really?' hesitation at the worst possible moment — the checkout. Familiar currency = fewer abandoned carts.",
              },
              {
                icon: "🎁",
                title: "Anchoring & the visible discount",
                body: "A '20% off for your region' badge frames the local price as a deal, not a downgrade. Modest and credible beats deep and desperate — the visitor feels seen, and you protect your premium-market revenue at full price.",
              },
            ].map((c, i) => (
              <Reveal key={c.title} delay={(i % 2) * 120}>
                <div className="card-lift group h-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    {c.icon}
                  </div>
                  <h3 className="mt-3 font-bold">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">{c.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- Social proof ---------- */}
        <Reveal as="section" className="mt-24">
          <div className="relative overflow-hidden rounded-3xl bg-neutral-900 px-8 py-12 text-center text-white">
            {/* Faint amber glow in the corner */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
            <h2 className="text-3xl font-bold tracking-tight">
              The biggest companies in the world already do this
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-neutral-300">
              Regional pricing isn't a growth hack on the fringe — it's standard
              practice at the top of the market. It was just too much engineering for
              a solo founder. Until now.
            </p>

            {/* Scrolling logo marquee (duplicated list = seamless loop) */}
            <div
              className="mt-8 overflow-hidden"
              style={{
                WebkitMaskImage: "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
                maskImage: "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
              }}
            >
              <div className="marquee-track flex w-max animate-marquee items-center gap-12 text-lg font-semibold text-neutral-200">
                {[...LOGOS, ...LOGOS].map((n, i) => (
                  <span key={`${n}-${i}`} className="whitespace-nowrap opacity-80 transition hover:opacity-100">
                    {n}
                  </span>
                ))}
              </div>
            </div>

            <p className="mx-auto mt-6 max-w-2xl text-sm text-neutral-400">
              Netflix is cheaper in India than the US. Spotify localizes in 180+
              markets. Steam has a published regional-pricing matrix. They do it
              because it measurably grows revenue — and now you get the same lever.
            </p>
          </div>
        </Reveal>

        {/* ---------- The two-way lever (discount down + premium up) ---------- */}
        <section className="mt-24">
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tight">
              It cuts prices where it grows sales — and{" "}
              <span className="text-emerald-600">raises them where it grows profit</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-neutral-600">
              Localized pricing isn't only about discounts. The same data that says
              India should pay less says Switzerland can pay more.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {/* Discount side */}
            <Reveal>
              <div className="card-lift h-full rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
                <div className="flex items-center gap-2">
                  <span className="animate-float text-2xl">📉</span>
                  <h3 className="font-bold">Discount in lower-income markets</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                  Your $19 is unaffordable in much of the world, so those visitors
                  never buy. A fair local price turns "too expensive" into a sale —
                  recovering revenue you were getting <strong>zero</strong> of.
                </p>
                <p className="mt-3 text-sm font-semibold text-accent-dark">
                  Result: more customers.
                </p>
              </div>
            </Reveal>
            {/* Premium side */}
            <Reveal delay={120}>
              <div className="card-lift h-full rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6">
                <div className="flex items-center gap-2">
                  <span className="animate-float text-2xl" style={{ animationDelay: "1s" }}>📈</span>
                  <h3 className="font-bold">Premium in higher-income markets</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                  In Switzerland, Norway or Denmark <em>everything</em> costs more —
                  a coffee is $7. Charging your flat $19 there leaves money on the
                  table. A modest premium is invisible to locals and drops straight
                  to your bottom line.
                </p>
                <p className="mt-3 text-sm font-semibold text-emerald-700">
                  Result: more profit per customer.
                </p>
              </div>
            </Reveal>
          </div>
          <p className="mx-auto mt-5 max-w-2xl text-center text-sm text-neutral-500">
            This is exactly how the App Store, Steam and Spotify price — cheaper in
            Brazil, pricier in Switzerland. The premium is a single toggle in the
            dashboard, on by default.
          </p>
        </section>

        {/* ---------- Countries by tier ---------- */}
        <section className="mt-24">
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tight">
              {priced.length} markets, split into tiers
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-neutral-600">
              Not a mockup — these are computed right now from a base of{" "}
              <strong>${settings.baseUSD}</strong> at today's exchange rates, capped
              at a <strong>{settings.maxDiscount}%</strong> max discount. Every number
              is a dial you control.
            </p>
          </Reveal>

          <div className="mt-10 space-y-6">
            {tiers.map((tier, ti) => (
              <Reveal key={tier.key} delay={ti * 80}>
                <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                  <div className={"bg-gradient-to-r px-6 py-4 text-white " + tier.accent}>
                    <h3 className="text-lg font-bold">{tier.name}</h3>
                    <p className="mt-0.5 text-sm text-white/85">{tier.blurb}</p>
                  </div>
                  <div className="grid gap-px bg-neutral-100 sm:grid-cols-2 lg:grid-cols-4">
                    {tier.countries.map((c) => (
                      <div key={c.code} className="group bg-white p-4 transition-colors hover:bg-amber-50/50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-neutral-700">
                            <span className="mr-1.5 inline-block transition-transform duration-300 group-hover:scale-125">{c.flag}</span>
                            {c.name}
                          </span>
                          {c.discount > 0 ? (
                            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-dark">
                              {c.discount}% off
                            </span>
                          ) : c.discount < 0 ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              +{Math.abs(c.discount)}% premium
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-2 text-2xl font-bold tracking-tight">{c.display}</div>
                        <div className="text-xs text-neutral-400">{c.currency} / month</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- Trust / anti-piracy ---------- */}
        <section className="mt-24">
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Built so <span className="text-gradient">nobody can game your prices</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-neutral-600">
              Regional pricing only works if visitors can't just claim to be in
              the cheapest country. saasevenly is locked down on three fronts, so
              your prices — and your revenue — stay yours.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: "🔒",
                title: "Locked to your domain",
                body: "Your install key only works on the website you register. If someone copies it onto their own site, the browser reports the wrong domain and your instance refuses to serve them.",
              },
              {
                icon: "🧮",
                title: "Prices set on the server",
                body: "The final charge is always computed server-side from your saved settings — never trusted from the browser. A visitor can't edit the page to pay $1: checkout re-prices everything before a card is touched.",
              },
              {
                icon: "🗝️",
                title: "Your keys, your money",
                body: "Payments run through your own Stripe, PayPal, Razorpay or Dodo account. There's no platform in the middle taking a cut, holding funds, or seeing your customer list — because there's no platform at all.",
              },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i * 120}>
                <div className="card-lift h-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-2xl">
                    {c.icon}
                  </div>
                  <h3 className="mt-3 font-bold">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">{c.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- Free & open source ---------- */}
        <section className="mt-24">
          <Reveal>
            <h2 className="text-center text-3xl font-bold tracking-tight">
              And it's <span className="text-gradient">completely free</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-neutral-600">
              Not free-with-an-asterisk. There is no paid tier, no trial clock, no
              seat count, no feature held back. The whole thing is {LICENSE}-licensed
              on GitHub — read it, fork it, sell it, whatever you like.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: "📦",
                title: "Runs on your own stack",
                body: "One Next.js app plus a Postgres database. Deploy it to Vercel in about two minutes, or anywhere else that runs Node. Your data never touches anyone else's server.",
              },
              {
                icon: "🔍",
                title: "Nothing hidden",
                body: "Every pricing rule, PPP factor and rounding decision is plain, commented JavaScript you can read in an afternoon. If you disagree with a number, change it.",
              },
              {
                icon: "☕",
                title: "Donations, not subscriptions",
                body: "If it makes you money, a coffee keeps the demo online and the markets up to date. Entirely optional — the software is identical either way.",
              },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i * 120}>
                <div className="card-lift h-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-2xl">
                    {c.icon}
                  </div>
                  <h3 className="mt-3 font-bold">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">{c.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- Final CTA ---------- */}
        <Reveal as="section" className="mt-24">
          <div className="relative overflow-hidden rounded-3xl border border-accent bg-accent-soft px-8 py-12 text-center">
            <div className="pointer-events-none absolute -left-20 -bottom-24 h-64 w-64 rounded-full bg-white/50 blur-3xl" />
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
              One base price. A fair price everywhere. Two lines of code.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-neutral-700">
              Deploy your own copy in a couple of minutes and start converting the
              buyers your flat USD price was turning away.
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

        {/* ---------- Footer ---------- */}
        <footer className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-neutral-200 pt-8 text-sm text-neutral-400 sm:flex-row">
          <span>
            saas<span className="text-accent">evenly</span> — fair pricing, everywhere.{" "}
            <span className="text-neutral-300">{LICENSE} licensed.</span>
          </span>
          <div className="flex flex-wrap justify-center gap-5">
            <Link href="/pricing" className="transition hover:text-neutral-600">Live demo</Link>
            <Link href="/install" className="transition hover:text-neutral-600">Install guide</Link>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="transition hover:text-neutral-600">GitHub</a>
            <a href={KOFI_URL} target="_blank" rel="noreferrer" className="transition hover:text-neutral-600">Donate</a>
          </div>
        </footer>
      </main>
    </>
  );
}
