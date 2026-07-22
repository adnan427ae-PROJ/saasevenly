// ---------------------------------------------------------------------------
// GET  /api/settings  -> the logged-in founder's settings
// POST /api/settings  -> save them
//
// Now tenant-scoped: it reads the current founder from the session cookie.
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { rowToSettings, updateTenantSettings } from "@/lib/tenants";

export async function GET() {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  return NextResponse.json(rowToSettings(tenant));
}

export async function POST(request) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const updated = await updateTenantSettings(tenant.id, body);
  return NextResponse.json({ ok: true, settings: rowToSettings(updated) });
}
