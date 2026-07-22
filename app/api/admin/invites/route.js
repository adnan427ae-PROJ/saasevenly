// /api/admin/invites  —  manage invite codes (admin-only).
//   GET                                      list all codes
//   POST  { code?, label?, maxUses, freeDays } create a code (code auto-generated if omitted)
//   PATCH { id, active }                     enable/disable a code
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { listInvites, createInvite, setInviteActive } from "@/lib/invites";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  return NextResponse.json({ ok: true, invites: await listInvites() });
}

export async function POST(request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const result = await createInvite(body);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json({ ok: true, invite: result.invite });
}

export async function PATCH(request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const invite = await setInviteActive(Number(body.id), Boolean(body.active));
  if (!invite) return NextResponse.json({ error: "Code not found." }, { status: 404 });
  return NextResponse.json({ ok: true, invite });
}
