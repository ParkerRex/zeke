'use client';

import { type FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IoLogoGithub, IoLogoGoogle } from 'react-icons/io5';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import type { ActionResponse } from '@/types/action-response';

const titleMap = {
  login: 'Login to ZEKE',
  signup: 'Join ZEKE and start getting insights',
} as const;

export function AuthUI({
  mode,
  signInWithOAuth,
  signInWithEmail,
}: {
  mode: 'login' | 'signup';
  signInWithOAuth: (provider: 'github' | 'google') => Promise<ActionResponse>;
  signInWithEmail: (email: string) => Promise<ActionResponse>;
}) {
  const [pending, setPending] = useState(false);
  const [emailFormOpen, setEmailFormOpen] = useState(false);

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = event.target as HTMLFormElement;
    const email = form['email'].value;
    const response = await signInWithEmail(email);

    if (response?.error) {
      toast({
        variant: 'destructive',
        description: 'An error occurred while authenticating. Please try again.',
      });
    } else {
      toast({
        description: `To continue, click the link in the email sent to: ${email}`,
      });
    }

    form.reset();
    setPending(false);
  }

  async function handleOAuthClick(provider: 'google' | 'github') {
    setPending(true);
    const response = await signInWithOAuth(provider);

    if (response?.error) {
      toast({
        variant: 'destructive',
        description: 'An error occurred while authenticating. Please try again.',
      });
      setPending(false);
    }
  }

  return (
    <section className='mt-16 flex w-full flex-col gap-16 rounded-lg bg-white p-10 px-4 text-center'>
      <div className='flex flex-col gap-4'>
        <Image src='/logo.png' width={80} height={80} alt='' className='m-auto' />
        <h1 className='text-lg'>{titleMap[mode]}</h1>
      </div>
      <div className='flex flex-col gap-4'>
        <Button
          variant='default'
          size='lg'
          className='flex w-full items-center justify-center gap-2 py-4'
          onClick={() => handleOAuthClick('github')}
          disabled={pending}
          type='button'
        >
          <IoLogoGithub size={20} />
          Continue with GitHub
        </Button>
        <Button
          variant='outline'
          size='lg'
          className='flex w-full items-center justify-center gap-2 py-4'
          onClick={() => handleOAuthClick('google')}
          disabled={pending}
          type='button'
        >
          <IoLogoGoogle size={20} />
          Continue with Google
        </Button>

        <Collapsible open={emailFormOpen} onOpenChange={setEmailFormOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant='secondary'
              size='lg'
              className='flex w-full items-center justify-center gap-2 py-4'
              disabled={pending}
              type='button'
            >
              Continue with Email
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className='mt-[-2px] w-full rounded-b-md bg-gray-100 p-8'>
              <form onSubmit={handleEmailSubmit}>
                <Input
                  type='email'
                  name='email'
                  placeholder='Enter your email'
                  aria-label='Enter your email'
                  autoFocus
                />
                <div className='mt-4 flex justify-end gap-2'>
                  <Button variant='ghost' type='button' onClick={() => setEmailFormOpen(false)}>
                    Cancel
                  </Button>
                  <Button type='submit' disabled={pending}>
                    {pending ? 'Sending...' : 'Send Magic Link'}
                  </Button>
                </div>
              </form>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
      {mode === 'signup' && (
        <span className='text-gray-600 m-auto max-w-sm text-sm'>
          By clicking continue, you agree to our{' '}
          <Link href='/terms' className='underline hover:no-underline transition-all duration-150'>
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href='/privacy' className='underline hover:no-underline transition-all duration-150'>
            Privacy Policy
          </Link>
          .
        </span>
      )}
    </section>
  );
}
