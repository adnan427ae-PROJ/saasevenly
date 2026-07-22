// POST /api/auth/signup  { email, password, name, invite }
// Invite-only launch: a valid invite code is REQUIRED. Redeeming it grants free
// access for the code's free_days. Creates the account, logs them in.
import { NextResponse } from "next/server";
import { getTenantByEmail, createTenant } from "@/lib/tenants";
import { hashPassword, createSession } from "@/lib/auth";
import { validateInvite, redeemInvite } from "@/lib/invites";

export async function POST(request) {
  const { email, password, name, invite } = await request.json().catch(() => ({}));

  if (!email || !password || String(password).length < 6) {
    return NextResponse.json(
      { error: "Enter an email and a password of at least 6 characters." },
      { status: 400 }
    );
  }
  if (!invite) {
    return NextResponse.json(
      { error: "saasevenly is invite-only right now — enter your invite code." },
      { status: 400 }
    );
  }

  // Check the code is valid BEFORE we do anything else.
  const check = await validateInvite(invite);
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 403 });
  }

  if (await getTenantByEmail(email)) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  // Atomically claim a use of the code (guards against races / exhaustion).
  const redeemed = await redeemInvite(invite);
  if (!redeemed) {
    return NextResponse.json(
      { error: "That invite code was just used up. Ask for another." },
      { status: 403 }
    );
  }

  const tenant = await createTenant({
    email,
    passwordHash: hashPassword(password),
    name,
    inviteCode: redeemed.code,
    freeDays: redeemed.free_days,
  });
  await createSession(tenant.id);
  return NextResponse.json({ ok: true });
}
