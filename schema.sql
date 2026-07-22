-- ===========================================================================
-- saasevenly — Supabase schema
--
-- Run this in your Supabase project:
--   Supabase dashboard → SQL Editor → New query → paste this → Run.
--
-- It is fully idempotent — safe to run again any time. It creates the tables,
-- adds newer columns if they're missing, seeds a "demo" tenant + example plans,
-- and seeds a starter invite code (EARLYBIRD) for your invite-only launch.
-- ===========================================================================

-- ---- founders ("tenants") -------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
  id                     BIGSERIAL PRIMARY KEY,
  email                  TEXT UNIQUE NOT NULL,
  password_hash          TEXT NOT NULL,
  name                   TEXT,
  site_key               TEXT UNIQUE NOT NULL,          -- goes in the embed snippet
  subscription_active    BOOLEAN NOT NULL DEFAULT TRUE, -- paying / free-access = TRUE
  allowed_domains        TEXT NOT NULL DEFAULT '',      -- comma-separated allowlist ('' = allow any)
  -- invite-only launch:
  invite_code            TEXT,                          -- the code they signed up with
  free_until             TIMESTAMPTZ,                   -- free-access end date (NULL = n/a)
  -- pricing settings:
  base_usd               NUMERIC NOT NULL DEFAULT 19,
  ending_style           TEXT NOT NULL DEFAULT '9',
  max_discount           INTEGER NOT NULL DEFAULT 20,
  charge_premium         BOOLEAN NOT NULL DEFAULT TRUE,
  payment_provider       TEXT NOT NULL DEFAULT 'stripe',
  -- gateway connection (their customers' payments):
  stripe_account_id      TEXT,
  -- saasevenly's OWN billing of this founder (platform Stripe webhooks):
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  billing_plan           TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add newer columns to databases created before they existed (safe no-ops otherwise).
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS allowed_domains TEXT NOT NULL DEFAULT '';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS invite_code TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS free_until TIMESTAMPTZ;

-- ---- login sessions -------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  tenant_id  BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- a founder's plans/products ------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id          BIGSERIAL PRIMARY KEY,
  tenant_id   BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  base_usd    NUMERIC NOT NULL,
  interval    TEXT NOT NULL DEFAULT 'month',   -- 'month' | 'quarter' | 'year'
  external_id TEXT,                            -- founder's own plan/price id
  sort        INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- invite codes (invite-only launch) -----------------------------------
-- Each code grants free access for `free_days` when redeemed at signup.
-- max_uses = 0 means unlimited. used_count tracks redemptions.
CREATE TABLE IF NOT EXISTS invite_codes (
  id         BIGSERIAL PRIMARY KEY,
  code       TEXT UNIQUE NOT NULL,
  label      TEXT,                              -- e.g. "Twitter launch", "Friends"
  max_uses   INTEGER NOT NULL DEFAULT 1,        -- 0 = unlimited
  used_count INTEGER NOT NULL DEFAULT 0,
  free_days  INTEGER NOT NULL DEFAULT 90,       -- free access granted on redemption
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_tenant_idx ON products (tenant_id);
CREATE INDEX IF NOT EXISTS sessions_tenant_idx ON sessions (tenant_id);
CREATE INDEX IF NOT EXISTS tenants_created_idx ON tenants (created_at);

-- ---- seed the demo tenant -------------------------------------------------
INSERT INTO tenants (email, password_hash, name, site_key, subscription_active, allowed_domains, base_usd)
VALUES ('demo@saasevenly.local', 'seed:none', 'Demo Founder', 'se_demo_public', TRUE, '', 19)
ON CONFLICT (email) DO NOTHING;

-- ---- seed a few demo plans (only if the demo tenant has none) -------------
INSERT INTO products (tenant_id, name, base_usd, interval, sort)
SELECT t.id, v.name, v.price, v.interval, v.sort
FROM (SELECT id FROM tenants WHERE email = 'demo@saasevenly.local') t
CROSS JOIN (VALUES
  ('Starter',  9,   'month', 0),
  ('Pro',      19,  'month', 1),
  ('Scale',    49,  'month', 2),
  ('Starter',  90,  'year',  3),
  ('Pro',      190, 'year',  4),
  ('Scale',    490, 'year',  5)
) AS v(name, price, interval, sort)
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.tenant_id = t.id);

-- ---- seed a starter invite code -------------------------------------------
-- Multi-use (50), 90 days free. Create more in the admin panel.
INSERT INTO invite_codes (code, label, max_uses, free_days)
VALUES ('EARLYBIRD', 'Launch code', 50, 90)
ON CONFLICT (code) DO NOTHING;
