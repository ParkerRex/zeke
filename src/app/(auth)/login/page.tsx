import { getSession } from "@db/queries/account/get-session";
import { getSubscription } from "@db/queries/account/get-subscription";
import { redirect } from "next/navigation";
import { signInWithOAuth } from "@/actions/auth/sign-in-with-oauth";
import { AuthResearchAside } from "@/components/auth/auth-research-aside";
import { Logo } from "@/components/logo";
import { AuthUI } from "../auth-ui";

export default async function LoginPage() {
  const session = await getSession();
  const subscription = await getSubscription();

  if (session && subscription) {
    redirect("/account");
  }

  if (session && !subscription) {
    redirect("/pricing");
  }

  return (
    <section className="relative grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* Top-left logo, matching marketing header */}
      <div className="pointer-events-auto absolute top-6 left-6 md:top-8 md:left-8">
        <Logo />
      </div>

      {/* Left: login UI */}
      <div className="flex items-center justify-center p-6 md:justify-start md:p-10">
        <div className="w-full max-w-lg md:ml-16">
          <AuthUI
            align="left"
            mode="login"
            showBrand={false}
            signInWithOAuth={signInWithOAuth}
          />
        </div>
      </div>

      {/* Right: same stats/pain panel */}
      <aside className="hidden border-l bg-white md:flex">
        <AuthResearchAside />
      </aside>
    </section>
  );
}
