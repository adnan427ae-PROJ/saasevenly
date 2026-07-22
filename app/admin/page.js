// Admin dashboard (server component). Admin-only: gated by ADMIN_EMAILS via
// getCurrentAdmin(). Loads live analytics + invite codes, then hands them to the
// interactive client.
import { redirect } from "next/navigation";
import { getCurrentTenant, getCurrentAdmin } from "@/lib/auth";
import { getAdminStats } from "@/lib/analytics";
import { listInvites } from "@/lib/invites";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin — saasevenly" };

export default async function AdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    // Logged in but not an admin → dashboard. Logged out → login.
    const tenant = await getCurrentTenant();
    redirect(tenant ? "/dashboard" : "/login");
  }

  const [stats, invites] = await Promise.all([getAdminStats(), listInvites()]);
  return <AdminClient email={admin.email} initialStats={stats} initialInvites={invites} />;
}
