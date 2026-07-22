// The founder's saasevenly subscription page: current status, the two
// saasevenly plans, subscribe buttons, and (once subscribed) the Stripe
// billing portal for cards/invoices/cancellation.
import { redirect } from "next/navigation";
import { getCurrentTenant, isAdminEmail } from "@/lib/auth";
import { BILLING_PLANS, isBillingConfigured } from "@/lib/billing";
import BillingClient from "./BillingClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Billing — saasevenly" };

export default async function BillingPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/login");

  return (
    <BillingClient
      email={tenant.email}
      active={Boolean(tenant.subscription_active)}
      plan={tenant.billing_plan}
      hasCustomer={Boolean(tenant.stripe_customer_id)}
      configured={isBillingConfigured()}
      plans={Object.values(BILLING_PLANS)}
      freeUntil={tenant.free_until}
      inviteCode={tenant.invite_code}
      isAdmin={isAdminEmail(tenant.email)}
    />
  );
}
