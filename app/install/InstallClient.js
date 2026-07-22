"use client";

// The install guide. First question: HOW did you build your site?
//   🪄 "I vibe-coded it"  -> a ready-made prompt to paste into their AI tool,
//                            plus point-and-click steps for site builders.
//   👨‍💻 "I'm a developer" -> the raw snippets, the JS API, SPA notes, checkout
//                            and webhook wiring.
import { useEffect, useState } from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import CopyBox from "../components/CopyBox";

export default function InstallClient({ siteKey, baseUSD }) {
  const [persona, setPersona] = useState(null); // null | "vibe" | "dev"
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const key = siteKey || "se_live_YOUR_KEY";
  const host = origin || "https://your-saasevenly-domain.com";
  const scriptUrl = `${host}/saasevenly.js?key=${key}`;
  const tagSnippet = `<span data-saasevenly="${baseUSD}">$${baseUSD}</span>`;
  const scriptSnippet = `<script src="${scriptUrl}"></script>`;

  return (
    <>
      <SiteNav />
      <main className="relative mx-auto max-w-3xl px-6 py-14">
        {/* Decorative backdrop */}
        <div className="pointer-events-none absolute inset-x-[-40vw] -top-14 h-[420px] -z-10">
          <div className="bg-grid absolute inset-0" />
          <div className="absolute left-[24%] top-6 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl animate-blob" />
        </div>

        <div className="text-center">
          <h1 className="animate-fade-up text-4xl font-bold tracking-tight">
            Add saasevenly to <span className="text-gradient">your site</span>
          </h1>
          <p className="animate-fade-up mx-auto mt-3 max-w-xl text-neutral-600" style={{ animationDelay: "80ms" }}>
            Two tiny snippets. But first — tell us how your site was built, so we
            can give you the right instructions.
          </p>
          {!siteKey && (
            <p className="animate-fade-up mt-3 text-sm text-neutral-500" style={{ animationDelay: "140ms" }}>
              Snippets below use a placeholder key —{" "}
              <Link href="/signup" className="font-medium text-accent-dark underline">create an account</Link>{" "}
              (or <Link href="/login" className="font-medium text-accent-dark underline">log in</Link>) and
              they'll fill in with your real site key.
            </p>
          )}
        </div>

        {/* ---------- The persona question ---------- */}
        <div className="animate-fade-up mt-10 grid gap-4 sm:grid-cols-2" style={{ animationDelay: "200ms" }}>
          <button
            type="button"
            onClick={() => setPersona("vibe")}
            className={
              "card-lift rounded-2xl border-2 bg-white p-6 text-left transition " +
              (persona === "vibe" ? "border-accent ring-1 ring-accent" : "border-neutral-200 hover:border-accent/60")
            }
          >
            <div className="text-3xl">🪄</div>
            <h2 className="mt-2 text-lg font-bold">I vibe-coded my site</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Built with AI (Lovable, Cursor, Bolt, v0, Claude…) or a site
              builder (Webflow, Framer, WordPress, Wix). I don't want to touch code.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setPersona("dev")}
            className={
              "card-lift rounded-2xl border-2 bg-white p-6 text-left transition " +
              (persona === "dev" ? "border-accent ring-1 ring-accent" : "border-neutral-200 hover:border-accent/60")
            }
          >
            <div className="text-3xl">👨‍💻</div>
            <h2 className="mt-2 text-lg font-bold">I'm a developer</h2>
            <p className="mt-1 text-sm text-neutral-600">
              I write the code myself. Give me the snippets, the JS API, and the
              checkout/webhook wiring.
            </p>
          </button>
        </div>

        {/* ---------- Vibe-coder track ---------- */}
        {persona === "vibe" && (
          <div className="animate-fade-up mt-10 space-y-8">
            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">✨ The lazy way: paste this prompt into your AI tool</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Copy the prompt below and paste it into whatever built your site
                — Lovable, Cursor, Bolt, v0, Claude Code, ChatGPT. It contains
                everything the AI needs; you don't have to explain anything.
              </p>
              <div className="mt-4">
                <CopyBox
                  code={[
                    "Add saasevenly price localization to my website:",
                    "",
                    `1. Find every place a price in US dollars is shown (pricing cards, plan tables, banners). Wrap ONLY the price text in a span like this, where the number in data-saasevenly is the USD amount:`,
                    `   <span data-saasevenly="${baseUSD}">$${baseUSD}</span>`,
                    "   Keep all existing styling and classes exactly as they are.",
                    "",
                    "2. Add this script once per page, right before the closing </body> tag (in Next.js, put it in the root layout with next/script and strategy=\"afterInteractive\"):",
                    `   ${scriptSnippet}`,
                    "",
                    "3. Don't change anything else. The script automatically detects each visitor's country and rewrites the tagged prices into their local currency.",
                    "",
                    "4. If my site is a single-page app that renders prices after navigation, call window.saasevenlyRefresh() after the new prices appear in the DOM.",
                  ].join("\n")}
                />
              </div>
              <p className="mt-3 text-xs text-neutral-500">
                <strong>What this does:</strong> the AI tags your prices and adds
                the script. Redeploy your site, open it, and your prices will
                localize automatically — test other countries by adding{" "}
                <code className="rounded bg-neutral-100 px-1">?country=IN</code> to your URL.
              </p>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">🧱 Using a site builder instead?</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Same two snippets, pasted by hand. Here's where each builder hides
                the paste boxes:
              </p>
              <div className="mt-4 space-y-4 text-sm">
                {[
                  {
                    name: "WordPress",
                    where: "Install the free “WPCode” plugin → Code Snippets → add the script to the footer. For prices, edit the page and switch the price block to a “Custom HTML” block with the tagged span.",
                  },
                  {
                    name: "Webflow",
                    where: "Site settings → Custom Code → paste the script in “Footer Code”. For each price, replace the text element with an “Embed” element containing the tagged span.",
                  },
                  {
                    name: "Framer",
                    where: "Site settings → General → Custom Code → “End of <body> tag”. For prices, use an “Embed” component with the tagged span.",
                  },
                  {
                    name: "Shopify",
                    where: "Online Store → Themes → Edit code → theme.liquid → paste the script before </body>. Tag prices inside your section/template files.",
                  },
                  {
                    name: "Wix",
                    where: "Settings → Custom Code → add the script to “Body - end”. For prices, use an HTML iframe/embed element with the tagged span.",
                  },
                ].map((b) => (
                  <div key={b.name} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                    <p className="font-semibold text-neutral-800">{b.name}</p>
                    <p className="mt-0.5 text-neutral-600">{b.where}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-neutral-600">The two snippets you'll paste:</p>
              <div className="mt-2 space-y-2">
                <CopyBox code={tagSnippet} />
                <CopyBox code={scriptSnippet} />
              </div>
            </section>
          </div>
        )}

        {/* ---------- Developer track ---------- */}
        {persona === "dev" && (
          <div className="animate-fade-up mt-10 space-y-8">
            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">1. Tag your prices</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Wrap every displayed USD price. The <code className="rounded bg-neutral-100 px-1">data-saasevenly</code>{" "}
                value is the base USD amount; the inner text is just the pre-localization placeholder.
              </p>
              <div className="mt-3">
                <CopyBox code={tagSnippet} />
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">2. Load the widget</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Once per page, before <code className="rounded bg-neutral-100 px-1">&lt;/body&gt;</code>.
                The <code className="rounded bg-neutral-100 px-1">key</code> ties the embed to your account.
              </p>
              <div className="mt-3">
                <CopyBox code={scriptSnippet} />
              </div>
              <p className="mt-3 text-sm text-neutral-600">Next.js:</p>
              <div className="mt-2">
                <CopyBox
                  code={[
                    "// app/layout.js",
                    "import Script from \"next/script\";",
                    "",
                    `<Script src="${scriptUrl}" strategy="afterInteractive" />`,
                  ].join("\n")}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">3. JS API (optional)</h2>
              <p className="mt-1 text-sm text-neutral-600">
                After localization the widget dispatches an event and exposes the
                visitor's geo on <code className="rounded bg-neutral-100 px-1">window.saasevenly</code> —
                useful for "Localized for 🇮🇳 India · 50% off" banners. SPAs can
                re-localize newly rendered prices with{" "}
                <code className="rounded bg-neutral-100 px-1">saasevenlyRefresh()</code>.
              </p>
              <div className="mt-3">
                <CopyBox
                  code={[
                    "document.addEventListener(\"saasevenly:ready\", (e) => {",
                    "  // { country, countryName, flag, currency, discountPercent }",
                    "  console.log(e.detail);",
                    "});",
                    "",
                    "// After your SPA renders new [data-saasevenly] elements:",
                    "window.saasevenlyRefresh();",
                  ].join("\n")}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">4. Checkout</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Point your subscribe buttons at the checkout API. The price is
                always recomputed <em>server-side</em> from your saved settings —
                the browser can never set its own price. Create plans in the
                dashboard's <strong>Plans</strong> tab and pass the{" "}
                <code className="rounded bg-neutral-100 px-1">productId</code>.
              </p>
              <div className="mt-3">
                <CopyBox
                  code={[
                    `const res = await fetch("${host}/api/checkout", {`,
                    "  method: \"POST\",",
                    "  headers: { \"Content-Type\": \"application/json\" },",
                    "  body: JSON.stringify({",
                    "    productId: 1,                        // from your Plans tab",
                    "    country: window.saasevenly?.country, // detected by the widget",
                    `    key: "${key}",`,
                    "  }),",
                    "});",
                    "const { url } = await res.json();",
                    "window.location.href = url; // hosted checkout in their currency",
                  ].join("\n")}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">5. Grant access after payment</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Set a <code className="rounded bg-neutral-100 px-1">Your plan ID</code> on each plan
                in the dashboard — it's stamped onto the subscription's metadata as{" "}
                <code className="rounded bg-neutral-100 px-1">external_id</code>, so your Stripe
                webhook can map the payment back to your own plan. A complete working
                example lives in <code className="rounded bg-neutral-100 px-1">examples/fulfillment-webhook.js</code>.
              </p>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">6. Test it</h2>
              <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
                <li>• Append <code className="rounded bg-neutral-100 px-1">?country=IN</code> (or BR, CH…) to any page URL to preview that market without a VPN.</li>
                <li>• In production the country comes from your CDN's geo header (Vercel/Cloudflare) or an IP lookup.</li>
                <li>• If your saasevenly subscription is inactive, the widget quietly does nothing — visitors just see your USD prices.</li>
              </ul>
            </section>
          </div>
        )}

        {/* Footer CTA */}
        {persona && (
          <p className="mt-10 text-center text-sm text-neutral-500">
            Stuck? The <Link href="/dashboard" className="text-accent-dark underline">dashboard's Install tab</Link>{" "}
            has the same snippets pre-filled with your key, and the{" "}
            <Link href="/pricing" className="text-accent-dark underline">live demo</Link> shows the result.
          </p>
        )}
      </main>
    </>
  );
}
