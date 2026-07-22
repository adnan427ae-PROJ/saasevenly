// ---------------------------------------------------------------------------
// /api/domains  —  manage the logged-in founder's allowed-domains allowlist.
//   GET   -> { domains: ["acme.com", ...] }
//   POST  { domains: "acme.com, app.acme.com" | ["acme.com", ...] }  -> save
//
// This is the anti-piracy control: only these domains may run the founder's
// embed (see lib/domains.js). An empty list means "not locked yet — allow any".
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { updateTenantDomains } from "@/lib/tenants";
import { parseDomains } from "@/lib/domains";

export async function GET() {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  return NextResponse.json({ domains: parseDomains(tenant.allowed_domains) });
}

export async function POST(request) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const updated = await updateTenantDomains(tenant.id, body.domains ?? "");
  return NextResponse.json({ ok: true, domains: parseDomains(updated.allowed_domains) });
}
