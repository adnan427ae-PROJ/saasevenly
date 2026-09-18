// Admin dashboard (server component). Admin-only: gated by ADMIN_EMAILS via
// getCurrentAdmin(). Loads live analytics, then hands them to the interactive
// client.
import { redirect } from "next/navigation";
import { getCurrentTenant, getCurrentAdmin } from "@/lib/auth";
import { getAdminStats } from "@/lib/analytics";
import { accountsEnabled } from "@/lib/site";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  // The public demo deploy has no accounts, so it has no admin either.
  if (!accountsEnabled()) redirect("/");

  const admin = await getCurrentAdmin();
  if (!admin) {
    // Logged in but not an admin → dashboard. Logged out → login.
    const tenant = await getCurrentTenant();
    redirect(tenant ? "/dashboard" : "/login");
  }

  const stats = await getAdminStats();
  return <AdminClient email={admin.email} initialStats={stats} />;
}
