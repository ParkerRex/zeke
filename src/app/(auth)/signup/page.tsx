import { redirect } from 'next/navigation';

import { getSession } from '@db/queries/account/get-session';
import { getSubscription } from '@db/queries/account/get-subscription';
import { Logo } from '@/components/logo';

import { signInWithOAuth } from '@/actions/auth/sign-in-with-oauth';
import { signInWithEmail } from '@/actions/auth/sign-in-with-email';
import { AuthUI } from '../auth-ui';
import { AuthResearchAside } from '@/components/auth/AuthResearchAside';

export default async function SignUp() {
  const session = await getSession();
  const subscription = await getSubscription();

  if (session && subscription) {
    redirect('/account');
  }

  if (session && !subscription) {
    redirect('/pricing');
  }

  return (
    <section className='relative grid min-h-screen grid-cols-1 md:grid-cols-2'>
      {/* Top-left logo, matching marketing header */}
      <div className='pointer-events-auto absolute left-6 top-6 md:left-8 md:top-8'>
        <Logo />
      </div>

      {/* Left: existing signup UI */}
      <div className='flex items-center justify-center md:justify-start p-6 md:p-10'>
        <div className='w-full max-w-lg md:ml-16'>
          <AuthUI
            mode='signup'
            signInWithOAuth={signInWithOAuth}
            signInWithEmail={signInWithEmail}
            showBrand={false}
            align='left'
          />
        </div>
      </div>

      {/* Right: pains + time stats */}
      <aside className='hidden border-l bg-white md:flex'>
        <AuthResearchAside />
      </aside>
    </section>
  );
}

// right-side stats moved to a shared component
