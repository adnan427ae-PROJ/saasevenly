<div align="center">

# saasevenly

**Fair pricing, everywhere. Free and open source.**

Set **one** base price in USD. Every visitor sees a fair price in their own
currency — adjusted for local purchasing power, rounded with charm endings that
convert — and pays it through *your* payment gateway.

The pricing playbook Netflix, Apple, Spotify and Steam all use, in two lines of
code on your site.

[Live demo](https://saasevenly.vercel.app/pricing) ·
[Install guide](https://saasevenly.vercel.app/install) ·
[Buy me a coffee](https://ko-fi.com/drtoken)

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fadnan427ae-PROJ%2Fsaasevenly&env=DATABASE_URL&envDescription=Postgres%20connection%20string%20—%20see%20the%20README&project-name=saasevenly&repository-name=saasevenly)

</div>

---

## The problem

Your price is $19. In San Francisco that's a rounding error. In Lagos, Jakarta
or Cairo it's a day's wage. So you charge everyone $19, and most of the world
quietly closes the tab — you never even see them in your funnel.

Charging a fair local price turns those people into customers. The same data
also says Switzerland, Norway and Denmark can comfortably pay *more* than your
US price, which is money you're currently leaving on the table.

Big companies have done this for years. It was just too much engineering for a
solo founder. That's what this fixes.

## What it does

- **36 markets, live FX.** Purchasing-power factors per country, combined with
  today's real exchange rates.
- **Charm rounding in every currency.** `₹449`, not `₹451.37`. Pick `9`, `.99`
  or round endings and they're re-applied per currency.
- **Two-way.** Discounts in lower-income markets, an optional premium in
  higher-income ones. Both are a toggle.
- **A discount cap you control.** Never discount more than you meant to.
- **Two-line embed.** Tag your prices, drop in one script, done. Works on
  Next.js, WordPress, Webflow, Framer, Shopify, Wix, or anything else that
  renders HTML.
- **Server-side checkout.** The final charge is always recomputed on your server
  from your saved settings, so a visitor can't edit the page to pay $1.
- **Domain locking.** Your public site key only works on domains you register.
- **Four gateways.** Stripe, PayPal, Razorpay and Dodo Payments — using *your*
  keys, so money goes straight from your customer to your account.

## How it works

```
Visitor loads your page
        │
        ├── saasevenly.js reads every <span data-saasevenly="19">
        │
        ├── GET /api/price  →  detects country (CDN geo header)
        │                      applies PPP factor + today's FX + charm rounding
        │
        └── prices on the page are rewritten to ₹1,499 / R$59 / CHF 24

Visitor clicks Subscribe
        │
        └── POST /api/checkout  →  price recomputed SERVER-SIDE from your
                                   saved settings, then handed to your gateway
```

Everything runs on your own deployment. There is no saasevenly server in the
middle, no account to buy, and no kill switch — the code you clone is the whole
product.

## Self-host

You need a Postgres database and somewhere to run a Next.js app. Both have
generous free tiers.

### 1. Database

Create a project on [Supabase](https://supabase.com) (or Neon, Railway, or your
own Postgres). Open the SQL editor, paste [`schema.sql`](schema.sql), and run
it. That creates the tables and seeds a demo tenant so the pricing page has
something to show immediately.

Then grab your connection string. On Supabase:
**Project Settings → Database → Connection string → "Transaction" pooler
(port 6543)**, and replace `[YOUR-PASSWORD]` with your database password.

### 2. Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fadnan427ae-PROJ%2Fsaasevenly&env=DATABASE_URL&envDescription=Postgres%20connection%20string%20—%20see%20the%20README&project-name=saasevenly&repository-name=saasevenly)

Vercel forks the repo into your own GitHub account and prompts for
`DATABASE_URL`. Paste the connection string and it builds.

Prefer to run it locally?

```bash
git clone https://github.com/adnan427ae-PROJ/saasevenly.git
cd saasevenly
npm install
cp .env.local.example .env.local   # then fill in DATABASE_URL
npm run dev                        # http://localhost:3000
```

### 3. Wire it up

1. Open your deployment and create an account — the first one is yours.
2. Set your base price, charm ending and max discount on the **dashboard**.
3. Add your website under **Domains** so your site key can't be used elsewhere.
4. Copy the two snippets from the **Install** tab into your site.

That's it. Test any market without a VPN by appending `?country=IN` (or `BR`,
`CH`, `NG`…) to any page URL.

## Environment variables

Only the first one is required.

| Variable | Required | What it's for |
| --- | --- | --- |
| `DATABASE_URL` | **yes** | Postgres connection string. Everything lives here. |
| `ADMIN_EMAILS` | no | Comma-separated emails that get the `/admin` analytics panel. Not stored in the database — only whoever controls the deployment can grant it. |
| `STRIPE_SECRET_KEY` | no | Your Stripe secret key, for charging your customers. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | no | Matching Stripe publishable key. |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` / `PAYPAL_ENV` | no | PayPal gateway. |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | no | Razorpay gateway (good for India/South Asia). |
| `DODO_PAYMENTS_API_KEY` / `DODO_PRODUCT_ID` / `DODO_ENV` | no | Dodo Payments (merchant of record — handles global tax for you). |
| `NEXT_PUBLIC_DEMO_MODE` | no | Set to `1` to run a public *demo* instance: landing page, live pricing demo and install guide stay up, but signup and login are closed. A demo instance stores nothing, so it ignores `DATABASE_URL` and runs on built-in sample data — no database needed. This is what saasevenly.vercel.app runs. Leave it unset for a normal instance. |
| `NEXT_PUBLIC_KOFI_URL` | no | Override the donate link if you fork this. |

See [`.env.local.example`](.env.local.example) for the annotated version with
links to where each key lives.

## Embedding

Tag any price on your site with the USD amount:

```html
<span data-saasevenly="19">$19</span>
```

Load the widget once per page, before `</body>`:

```html
<script src="https://your-instance.vercel.app/saasevenly.js?key=se_live_YOUR_KEY"></script>
```

For single-page apps, re-localize after new prices render:

```js
window.saasevenlyRefresh();
```

And read the detected geo for a "Localized for 🇮🇳 India · 50% off" banner:

```js
document.addEventListener("saasevenly:ready", (e) => {
  // { country, countryName, flag, currency, discountPercent }
  console.log(e.detail);
});
```

The full guide, including per-builder instructions and a copy-paste prompt for
AI coding tools, is at `/install` on your deployment.

## Project layout

```
app/
  page.js             landing page (live-computed tier tables)
  pricing/            the demo / your own pricing page
  dashboard/          settings, plans, domains, install, payments
  install/            public install guide
  donate/             support page
  admin/              analytics for whoever runs the instance
  saasevenly.js/      the embeddable widget, served as JS
  api/
    price/            country detection + localized prices
    checkout/         server-side re-pricing, then the gateway
    auth/ products/ domains/ settings/ admin/
lib/
  pricing.js          PPP maths, charm rounding, discount caps
  countries.js        the 36 markets + PPP factors
  rates.js            exchange rates, cached
  geo.js              country detection from CDN headers
  payments/           stripe, paypal, razorpay, dodo adapters
  domains.js          the site-key domain lock
schema.sql            run this once against your database
```

It's plain JavaScript with comments throughout — readable in an afternoon.

## Contributing

Yes please. See [CONTRIBUTING.md](CONTRIBUTING.md). The most useful
contributions are new markets, new payment gateways, and corrections to the PPP
factors in `lib/countries.js`.

## Support this project

saasevenly is free and always will be — no paid tier, no limits, nothing held
back. If it wins you customers you were losing, you can
[buy me a coffee](https://ko-fi.com/drtoken). It keeps the demo online and the
market data current.

Starring the repo and telling one other founder genuinely helps just as much.

## Licence

[MIT](LICENSE) — use it, fork it, sell it. No strings.
