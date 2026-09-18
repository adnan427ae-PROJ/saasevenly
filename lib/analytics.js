// ---------------------------------------------------------------------------
// analytics.js  —  numbers for the admin dashboard.
//
// Counts real founders only (the seeded demo tenant is excluded). Everything is
// computed live from Supabase so the admin page always shows current state.
// ---------------------------------------------------------------------------
import { requireDb } from "./db";

const DEMO_EMAIL = "demo@saasevenly.local";

export async function getAdminStats() {
  const sql = requireDb();

  const [{ total }] = await sql`
    SELECT COUNT(*)::int total FROM tenants WHERE email <> ${DEMO_EMAIL}`;
  const [{ live }] = await sql`
    SELECT COUNT(*)::int live FROM tenants
    WHERE email <> ${DEMO_EMAIL} AND allowed_domains <> ''`;
  const [{ last7 }] = await sql`
    SELECT COUNT(*)::int last7 FROM tenants
    WHERE email <> ${DEMO_EMAIL} AND created_at > now() - interval '7 days'`;
  const [{ last24 }] = await sql`
    SELECT COUNT(*)::int last24 FROM tenants
    WHERE email <> ${DEMO_EMAIL} AND created_at > now() - interval '24 hours'`;

  // Most recent signups for the live table.
  const recent = await sql`
    SELECT email, name, allowed_domains, created_at
    FROM tenants
    WHERE email <> ${DEMO_EMAIL}
    ORDER BY created_at DESC
    LIMIT 25`;

  // Signups per day for the last 14 days (for the mini bar chart).
  const rows = await sql`
    SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS bucket, COUNT(*)::int AS n
    FROM tenants
    WHERE email <> ${DEMO_EMAIL} AND created_at > now() - interval '14 days'
    GROUP BY 1`;
  const byDay = new Map(rows.map((r) => [r.bucket, r.n]));
  const daily = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    daily.push({ day: key, n: byDay.get(key) || 0 });
  }

  return {
    total,
    live,
    last7,
    last24,
    recent: recent.map((r) => ({
      email: r.email,
      name: r.name,
      domains: r.allowed_domains || "",
      createdAt: r.created_at,
    })),
    daily,
  };
}
