// Public install guide. If the founder is logged in we personalize every
// snippet with THEIR site key; otherwise we show a placeholder and point them
// at their own deployment.
import { getCurrentTenant } from "@/lib/auth";
import { accountsEnabled } from "@/lib/site";
import InstallClient from "./InstallClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Install guide" };

export default async function InstallPage() {
  // No accounts on the demo deploy, so there's no session to personalize from.
  const tenant = accountsEnabled() ? await getCurrentTenant() : null;
  return (
    <InstallClient
      siteKey={tenant?.site_key || null}
      baseUSD={tenant?.base_usd || 19}
      accounts={accountsEnabled()}
    />
  );
}
