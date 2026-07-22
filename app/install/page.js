// Public install guide. If the founder is logged in we personalize every
// snippet with THEIR site key; otherwise we show a placeholder and nudge them
// to sign up.
import { getCurrentTenant } from "@/lib/auth";
import InstallClient from "./InstallClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Install guide — saasevenly" };

export default async function InstallPage() {
  const tenant = await getCurrentTenant();
  return (
    <InstallClient
      siteKey={tenant?.site_key || null}
      baseUSD={tenant?.base_usd || 19}
    />
  );
}
