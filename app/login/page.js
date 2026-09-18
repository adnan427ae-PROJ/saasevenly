import AuthForm from "../AuthForm";
import SelfHostGate from "../components/SelfHostGate";
import { accountsEnabled } from "@/lib/site";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  // On the public demo there are no accounts — point people at their own copy.
  if (!accountsEnabled()) return <SelfHostGate />;
  return <AuthForm mode="login" />;
}
