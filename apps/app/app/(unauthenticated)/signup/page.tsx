import { signInWithOAuth } from '@/actions/auth/sign-in-with-oauth';
import { AuthResearchAside } from '@/app/components/auth-research-aside';
import { AuthUI } from '@/app/components/auth-ui';
import { Logo } from '@/app/components/logo';
import { getSession } from '@zeke/supabase/queries';
import { getSubscription } from '@zeke/supabase/queries';
import { redirect } from 'next/navigation';

export default async function SignUp() {
  const session = await getSession();
  const subscription = await getSubscription();

  if (session && subscription) {
    redirect('/home');
  }

  if (session && !subscription) {
    redirect('/pricing');
  }

  return (
    <section className="relative grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* Top-left logo, matching marketing header */}
      <div className="pointer-events-auto absolute top-6 left-6 md:top-8 md:left-8">
        <Logo />
      </div>

      {/* Left: existing signup UI */}
      <div className="flex items-center justify-center p-6 md:justify-start md:p-10">
        <div className="w-full max-w-lg md:ml-16">
          <AuthUI
            align="left"
            mode="signup"
            showBrand={false}
            signInWithOAuth={signInWithOAuth}
          />
        </div>
      </div>

      {/* Right: pains + time stats */}
      <aside className="hidden border-l bg-white md:flex">
        <AuthResearchAside />
      </aside>
    </section>
  );
}

// right-side stats moved to a shared component
