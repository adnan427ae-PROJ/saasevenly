// POST /api/auth/signup  { email, password, name }
// Open signup: saasevenly is free software, so anyone running this instance can
// create an account. The public demo deploy closes signup via DEMO_MODE.
import { NextResponse } from "next/server";
import { getTenantByEmail, createTenant } from "@/lib/tenants";
import { hashPassword, createSession } from "@/lib/auth";
import { accountsEnabled } from "@/lib/site";

export async function POST(request) {
  if (!accountsEnabled()) {
    return NextResponse.json(
      {
        error:
          "This is the public demo — it doesn't host accounts. saasevenly is free and open source: deploy your own copy in a couple of minutes.",
      },
      { status: 403 }
    );
  }

  const { email, password, name } = await request.json().catch(() => ({}));

  if (!email || !password || String(password).length < 6) {
    return NextResponse.json(
      { error: "Enter an email and a password of at least 6 characters." },
      { status: 400 }
    );
  }

  if (await getTenantByEmail(email)) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const tenant = await createTenant({ email, passwordHash: hashPassword(password), name });
  await createSession(tenant.id);
  return NextResponse.json({ ok: true });
}
