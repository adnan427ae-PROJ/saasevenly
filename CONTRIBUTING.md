# Contributing to saasevenly

Thanks for being here. This is a small, deliberately readable codebase — plain
JavaScript, no build step beyond Next.js, comments explaining *why* rather than
*what*. Please keep it that way.

## Getting set up

```bash
git clone https://github.com/adnan427ae-PROJ/saasevenly.git
cd saasevenly
npm install
cp .env.local.example .env.local   # fill in DATABASE_URL
npm run dev
```

You need a Postgres database. Create a free one on
[Supabase](https://supabase.com) or [Neon](https://neon.tech), run
[`schema.sql`](schema.sql) against it once, and paste the connection string into
`.env.local`.

Before opening a PR:

```bash
npm run build   # must pass
npm run lint
```

## The most wanted contributions

**New markets.** `lib/countries.js` holds each country's currency, symbol,
decimal places and PPP factor. Adding a country is usually one object. Please
cite your source for the PPP factor in the PR — World Bank ICP data is the
usual reference.

**Corrections to existing PPP factors.** These drift. If a number looks wrong,
say so with a source and it'll get fixed.

**New payment gateways.** `lib/payments/` has one adapter per gateway
(`stripe.js`, `paypal.js`, `razorpay.js`, `dodo.js`) behind a common interface
in `index.js`. Copy the closest one. Gateways that work well in
under-served regions are especially welcome — that's the whole point of the
project.

**Bugs in the pricing maths.** `lib/pricing.js` is the heart of it: PPP ratios,
charm rounding, discount caps, and computing the *effective* discount from the
final rounded price. Edge cases here matter more than anywhere else in the
codebase.

## Ground rules

- **No new dependencies without a good reason.** The whole app runs on Next.js,
  React, `postgres` and `stripe`. Adding to that list needs justification in the
  PR.
- **Keep the comment style.** Explain the reasoning, not the syntax.
- **No telemetry, no phone-home, no licence checks.** People self-host this and
  trust it with their pricing. That trust is the product.
- **Money code gets extra scrutiny.** Anything touching `lib/pricing.js`,
  `app/api/checkout/` or `lib/payments/` should say in the PR how you tested it.

## Reporting bugs

Open an issue with what you expected, what happened, and enough detail to
reproduce it — your country/currency, base price and settings if it's a pricing
bug. Screenshots of a wrong price are perfect.

## Security

Found something that would let a visitor change what they're charged, read
another tenant's data, or bypass the domain lock? Please don't open a public
issue — use GitHub's private
[security advisory](https://github.com/adnan427ae-PROJ/saasevenly/security/advisories/new)
form instead.

## Licence

By contributing you agree your work is released under the
[MIT licence](LICENSE).
