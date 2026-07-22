// ---------------------------------------------------------------------------
// db.js  —  the Supabase (Postgres) connection.
//
// Data lives in Supabase now, not a local SQLite file, so it PERSISTS on Vercel
// (whose filesystem is temporary). We connect with the lightweight `postgres`
// driver using the DATABASE_URL you copy from Supabase.
//
//   Supabase → Project Settings → Database → Connection string → "Transaction"
//   pooler (port 6543). Paste it into .env.local (local) and Vercel (prod) as
//   DATABASE_URL. Run schema.sql once in the Supabase SQL editor to create the
//   tables and seed the demo tenant.
//
// Every query is async now (Postgres is over the network), so all the helpers
// in lib/*.js and the code that calls them use async/await.
// ---------------------------------------------------------------------------
import postgres from "postgres";

const url = process.env.DATABASE_URL;

// Next.js re-evaluates modules in dev; cache the connection on globalThis so we
// don't open a new pool on every hot reload.
let sql = globalThis.__saasevenlySql;

if (!sql && url) {
  sql = postgres(url, {
    // Supabase's transaction pooler (pgbouncer) doesn't support prepared
    // statements — this must be off or queries fail under the pooler.
    prepare: false,
    ssl: "require",
    max: 5, // small pool; many serverless instances share Supabase's pooler
    idle_timeout: 20,
  });
  globalThis.__saasevenlySql = sql;
}

// True when a DATABASE_URL is configured. Public marketing pages check this so
// they can render sensible defaults before Supabase is connected, instead of
// crashing.
export function hasDb() {
  return Boolean(sql);
}

// A guard the write/read helpers call so a missing DATABASE_URL fails with a
// clear, actionable message instead of an obscure "cannot read undefined".
export function requireDb() {
  if (!sql) {
    throw new Error(
      "DATABASE_URL is not set. Add your Supabase connection string to " +
        ".env.local (local) and to your Vercel project (production)."
    );
  }
  return sql;
}

export default sql;
