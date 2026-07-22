// ---------------------------------------------------------------------------
// auth.js  —  minimal email + password auth with cookie sessions.
//
// Kept deliberately small and dependency-free: password hashing uses Node's
// built-in scrypt, sessions are random tokens stored in the DB and referenced
// by an httpOnly cookie. Good enough for a self-hosted founder tool.
// ---------------------------------------------------------------------------
import crypto from "crypto";
import { cookies } from "next/headers";
import { requireDb } from "./db";
import { getTenantById } from "./tenants";

const COOKIE = "se_session";

// ---- password hashing (scrypt) ----
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith("scrypt:")) return false;
  const [, salt, hash] = stored.split(":");
  const test = crypto.scryptSync(password, salt, 64).toString("hex");
  // Constant-time compare.
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(test, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---- sessions ----
export async function createSession(tenantId) {
  const sql = requireDb();
  const token = crypto.randomBytes(32).toString("hex");
  await sql`INSERT INTO sessions (token, tenant_id) VALUES (${token}, ${tenantId})`;
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return token;
}

export async function destroySession() {
  const token = cookies().get(COOKIE)?.value;
  if (token) {
    const sql = requireDb();
    await sql`DELETE FROM sessions WHERE token = ${token}`;
  }
  cookies().delete(COOKIE);
}

// The currently logged-in tenant (or null). Read from the session cookie.
export async function getCurrentTenant() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const sql = requireDb();
  const rows = await sql`SELECT tenant_id FROM sessions WHERE token = ${token}`;
  if (!rows[0]) return null;
  return getTenantById(rows[0].tenant_id);
}

// ---- admin ----
// Admins are designated by the ADMIN_EMAILS env var (comma-separated), NOT a DB
// flag — so admin access can't be granted through the app, only by whoever
// controls the deployment. You sign up like a normal founder; if your email is
// listed, you also get the /admin panel.
export function isAdminEmail(email) {
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(email) && list.includes(String(email).toLowerCase());
}

// The current tenant IF they're an admin, else null. Guards the admin pages/APIs.
export async function getCurrentAdmin() {
  const tenant = await getCurrentTenant();
  if (!tenant || !isAdminEmail(tenant.email)) return null;
  return tenant;
}
