import AuthForm from "../AuthForm";
import SelfHostGate from "../components/SelfHostGate";
import { accountsEnabled } from "@/lib/site";

export const metadata = { title: "Sign up" };

export default function SignupPage() {
  // On the public demo there are no accounts — point people at their own copy.
  if (!accountsEnabled()) return <SelfHostGate />;
  return <AuthForm mode="signup" />;
}
