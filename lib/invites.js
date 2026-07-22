// ---------------------------------------------------------------------------
// invites.js  —  invite codes for the invite-only launch.
//
// Each code grants free access for `free_days` when redeemed at signup. A code
// can be single-use, multi-use, or unlimited (max_uses = 0). Redemption is
// atomic so two people can't over-use the last seat of a code.
// ---------------------------------------------------------------------------
import { requireDb } from "./db";

// Codes are matched case-insensitively; we store and compare uppercase.
export function normCode(code) {
  return String(code || "").trim().toUpperCase();
}

export async function getInvite(code) {
  const c = normCode(code);
  if (!c) return null;
  const sql = requireDb();
  const rows = await sql`SELECT * FROM invite_codes WHERE code = ${c}`;
  return rows[0] || null;
}

// Human-readable check used to give a precise signup error before redeeming.
export async function validateInvite(code) {
  const invite = await getInvite(code);
  if (!invite) return { ok: false, reason: "That invite code isn't valid." };
  if (!invite.active) return { ok: false, reason: "That invite code has been disabled." };
  if (invite.max_uses !== 0 && invite.used_count >= invite.max_uses) {
    return { ok: false, reason: "That invite code has already been fully used." };
  }
  return { ok: true, invite };
}

// Atomically claim one use of a code. Returns the invite row on success, or null
// if it was invalid/exhausted (the WHERE clause enforces the rules in one shot,
// so concurrent signups can't exceed max_uses).
export async function redeemInvite(code) {
  const c = normCode(code);
  if (!c) return null;
  const sql = requireDb();
  const rows = await sql`
    UPDATE invite_codes
    SET used_count = used_count + 1
    WHERE code = ${c}
      AND active = TRUE
      AND (max_uses = 0 OR used_count < max_uses)
    RETURNING *`;
  return rows[0] || null;
}

// ---- admin management ----

export async function listInvites() {
  const sql = requireDb();
  const rows = await sql`SELECT * FROM invite_codes ORDER BY created_at DESC, id DESC`;
  return rows.map(rowToInvite);
}

export async function createInvite({ code, label, maxUses, freeDays }) {
  const sql = requireDb();
  const c = code ? normCode(code) : "SE-" + randomCode();
  const rows = await sql`
    INSERT INTO invite_codes (code, label, max_uses, free_days)
    VALUES (
      ${c},
      ${label ? String(label) : null},
      ${clampInt(maxUses, 0, 100000, 1)},
      ${clampInt(freeDays, 0, 3650, 90)}
    )
    ON CONFLICT (code) DO NOTHING
    RETURNING *`;
  if (!rows[0]) return { error: "That code already exists — pick another." };
  return { invite: rowToInvite(rows[0]) };
}

export async function setInviteActive(id, active) {
  const sql = requireDb();
  const rows = await sql`
    UPDATE invite_codes SET active = ${Boolean(active)} WHERE id = ${id} RETURNING *`;
  return rows[0] ? rowToInvite(rows[0]) : null;
}

function rowToInvite(r) {
  return {
    id: r.id,
    code: r.code,
    label: r.label,
    maxUses: r.max_uses,
    usedCount: r.used_count,
    freeDays: r.free_days,
    active: r.active,
    createdAt: r.created_at,
    // Convenience for the UI:
    remaining: r.max_uses === 0 ? null : Math.max(0, r.max_uses - r.used_count),
    unlimited: r.max_uses === 0,
  };
}

function clampInt(v, lo, hi, dflt) {
  const n = Math.round(Number(v));
  if (Number.isNaN(n)) return dflt;
  return Math.min(hi, Math.max(lo, n));
}

function randomCode() {
  // Short, unambiguous (no 0/O/1/I) code for auto-generated invites.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}
