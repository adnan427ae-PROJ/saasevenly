// POST /api/auth/login  { email, password }
import { NextResponse } from "next/server";
import { getTenantByEmail } from "@/lib/tenants";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(request) {
  const { email, password } = await request.json().catch(() => ({}));
  const tenant = await getTenantByEmail(email || "");

  if (!tenant || !verifyPassword(password || "", tenant.password_hash)) {
    return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
  }

  await createSession(tenant.id);
  return NextResponse.json({ ok: true });
}
