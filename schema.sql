-- ===========================================================================
-- saasevenly — database schema (Postgres)
--
-- Run this once against your database. With Supabase:
--   Dashboard → SQL Editor → New query → paste this → Run.
-- Any Postgres works (Neon, Railway, RDS, a local postgres…).
--
-- It is fully idempotent — safe to run again any time. It creates the tables
-- and seeds a "demo" tenant with example plans so the public /pricing page has
-- something to show before you sign up.
-- ===========================================================================

-- ---- founders ("tenants") -------------------------------------------------
-- One row per person using this instance. saasevenly is free software with no
-- paid tier, so there is deliberately no plan, seat or expiry column here.
CREATE TABLE IF NOT EXISTS tenants (
  id                     BIGSERIAL PRIMARY KEY,
  email                  TEXT UNIQUE NOT NULL,
  password_hash          TEXT NOT NULL,
  name                   TEXT,
  site_key               TEXT UNIQUE NOT NULL,          -- goes in the embed snippet
  allowed_domains        TEXT NOT NULL DEFAULT '',      -- comma-separated allowlist ('' = allow any)
  -- pricing settings:
  base_usd               NUMERIC NOT NULL DEFAULT 19,
  ending_style           TEXT NOT NULL DEFAULT '9',
  max_discount           INTEGER NOT NULL DEFAULT 20,
  charge_premium         BOOLEAN NOT NULL DEFAULT TRUE,
  payment_provider       TEXT NOT NULL DEFAULT 'stripe',
  -- gateway connection (for charging THEIR customers):
  stripe_account_id      TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add newer columns to databases created before they existed (safe no-ops otherwise).
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS allowed_domains TEXT NOT NULL DEFAULT '';

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

CREATE INDEX IF NOT EXISTS products_tenant_idx ON products (tenant_id);
CREATE INDEX IF NOT EXISTS sessions_tenant_idx ON sessions (tenant_id);
CREATE INDEX IF NOT EXISTS tenants_created_idx ON tenants (created_at);

-- ---- seed the demo tenant -------------------------------------------------
-- Powers the public /pricing demo before anyone signs up. The password hash is
-- a placeholder that can never match a real login.
INSERT INTO tenants (email, password_hash, name, site_key, allowed_domains, base_usd)
VALUES ('demo@saasevenly.local', 'seed:none', 'Demo Founder', 'se_demo_public', '', 19)
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

-- ---------------------------------------------------------------------------
-- Upgrading from the old invite-only build? These columns and this table are
-- no longer used. Dropping them is optional — uncomment if you want them gone.
--
--   ALTER TABLE tenants DROP COLUMN IF EXISTS subscription_active;
--   ALTER TABLE tenants DROP COLUMN IF EXISTS invite_code;
--   ALTER TABLE tenants DROP COLUMN IF EXISTS free_until;
--   ALTER TABLE tenants DROP COLUMN IF EXISTS stripe_customer_id;
--   ALTER TABLE tenants DROP COLUMN IF EXISTS stripe_subscription_id;
--   ALTER TABLE tenants DROP COLUMN IF EXISTS billing_plan;
--   DROP TABLE IF EXISTS invite_codes;
-- ---------------------------------------------------------------------------
