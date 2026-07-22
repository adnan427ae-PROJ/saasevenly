// GET /api/admin/stats  —  live analytics for the admin dashboard.
// Admin-only (ADMIN_EMAILS). Used to refresh the numbers without a full reload.
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { getAdminStats } from "@/lib/analytics";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  return NextResponse.json({ ok: true, stats: await getAdminStats() });
}
