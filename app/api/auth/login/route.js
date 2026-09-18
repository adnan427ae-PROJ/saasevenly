// POST /api/auth/login  { email, password }
import { NextResponse } from "next/server";
import { getTenantByEmail } from "@/lib/tenants";
import { verifyPassword, createSession } from "@/lib/auth";
import { accountsEnabled } from "@/lib/site";

export async function POST(request) {
  // The public demo deploy doesn't host accounts at all — see lib/site.js.
  if (!accountsEnabled()) {
    return NextResponse.json(
      { error: "This is the public demo — accounts live on your own deployment." },
      { status: 403 }
    );
  }

  const { email, password } = await request.json().catch(() => ({}));
  const tenant = await getTenantByEmail(email || "");

  if (!tenant || !verifyPassword(password || "", tenant.password_hash)) {
    return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
  }

  await createSession(tenant.id);
  return NextResponse.json({ ok: true });
}
