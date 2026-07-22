"use client";

// The "Install" tab, written for a non-coder. Plain English, one idea per step,
// with a "what this does / why" note under each snippet.
import { useEffect, useState } from "react";
import Link from "next/link";
import CopyBox from "../components/CopyBox";

function Step({ n, title, children }) {
  return (
    <div className="flex gap-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
        {n}
      </span>
      <div className="min-w-0 flex-1 pb-8">
        <h3 className="font-semibold text-neutral-800">{title}</h3>
        <div className="mt-2 space-y-2">{children}</div>
      </div>
    </div>
  );
}

export default function InstallPanel({ baseUSD, siteKey }) {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  // The site key ties this embed to YOUR account. Prices only localize while
  // your saasevenly subscription is active.
  const keyQuery = siteKey ? `?key=${siteKey}` : "";
  const scriptUrl = `${origin || "https://your-website.com"}/saasevenly.js${keyQuery}`;

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold">How to put saasevenly on your website</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Prefer instructions tailored to how your site was built (AI tools, site
        builders, or hand-written code)? Open the{" "}
        <Link href="/install" className="font-medium text-accent-dark underline">
          full install guide
        </Link>
        {" "}— it pre-fills your site key too.
      </p>
      <p className="mt-1 text-sm text-neutral-600">
        Think of this like adding Google Analytics: you paste two small bits of
        code into your existing site once. No coding, no rebuild. It works on
        plain HTML, WordPress, Webflow, Framer, Shopify — anywhere you can add
        HTML.
      </p>

      <div className="mt-6">
        <Step n={1} title="Find a price on your site and 'tag' it">
          <p className="text-sm text-neutral-600">
            Wherever you show a price, wrap it like this. The number in quotes is
            your price in <strong>US dollars</strong> — that's the only number
            you ever set.
          </p>
          <CopyBox code={`<span data-saasevenly="${baseUSD}">$${baseUSD}</span>`} />
          <p className="text-xs text-neutral-500">
            <strong>What this does:</strong> it marks this price so saasevenly
            knows to translate it. The visible “${baseUSD}” is just a placeholder
            shown for a split second before the visitor's local price appears.
            Repeat for every price/plan on the page.
          </p>
        </Step>

        <Step n={2} title="Paste the saasevenly script once, near the bottom">
          <p className="text-sm text-neutral-600">
            Add this single line just before the closing{" "}
            <code className="rounded bg-neutral-100 px-1">&lt;/body&gt;</code> tag
            of your page (in most site builders there's a “custom code / footer”
            box for exactly this).
          </p>
          <CopyBox code={`<script src="${scriptUrl}"></script>`} />
          <p className="text-xs text-neutral-500">
            <strong>What this does:</strong> it loads saasevenly, which finds
            every tagged price, detects the visitor's country, and swaps in their
            fair local price with a little amber flash. You add this line{" "}
            <strong>once per page</strong>, no matter how many prices are on it.
          </p>
        </Step>

        <Step n={3} title="Pick who collects the money">
          <p className="text-sm text-neutral-600">
            Go to the <strong>Payments</strong> tab and choose your gateway
            (Stripe, PayPal, or Razorpay), then paste that gateway's keys into the{" "}
            <code className="rounded bg-neutral-100 px-1">.env.local</code> file.
            When a visitor clicks your Subscribe button, they're charged in their
            own currency through that gateway.
          </p>
          <p className="text-xs text-neutral-500">
            <strong>What this does:</strong> connects real payments. Until you add
            keys, the buttons will show a friendly “not connected yet” message
            instead of charging anyone.
          </p>
        </Step>

        <Step n={4} title="Lock your key to your domain (stops freeloaders)">
          <p className="text-sm text-neutral-600">
            Your site key is visible in your page's source, so on its own anyone
            could copy it onto their site and use your subscription for free. Go
            to the <strong>Domains</strong> tab and add your website — after that
            your key only works on your domain, and nowhere else.
          </p>
          <p className="text-xs text-neutral-500">
            <strong>What this does:</strong> saasevenly checks every request comes
            from a site you registered (the browser reports this and it can't be
            faked from a web page). A copied key on someone else's site gets
            nothing. The same trick Google Maps and Stripe keys use.
          </p>
        </Step>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <p className="text-sm font-semibold text-neutral-700">See it working right now</p>
        <ul className="mt-2 space-y-1 text-sm text-neutral-600">
          <li>
            • Your own page:{" "}
            <a href="/pricing" className="text-accent-dark underline">/pricing</a>
          </li>
          <li>
            • Pretend you're in India:{" "}
            <a href="/pricing?country=IN" className="text-accent-dark underline">
              /pricing?country=IN
            </a>
          </li>
          <li>
            • A standalone example file is in your project folder:{" "}
            <code className="rounded bg-neutral-200 px-1">example-embed.html</code>{" "}
            — just double-click it to open in your browser.
          </li>
        </ul>
      </div>

      <p className="mt-4 text-xs text-neutral-400">
        That's the whole install: one tag on each price + one script line + pick a
        gateway. The same two snippets work on any number of pages and sites.
      </p>
    </section>
  );
}
