
'use client';

import { type FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IoLogoGithub, IoLogoGoogle } from 'react-icons/io5';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/utils/cn';
import type { ActionResponse } from '@/types/action-response';

const titleMap = {
  login: 'Welcome back',
  signup: 'Join ZEKE and start getting insights',
} as const;

export function AuthUI({
  mode,
  signInWithOAuth,
  signInWithEmail,
  signInWithPassword,
  showBrand = true,
  align = 'center',
}: {
  mode: 'login' | 'signup';
  signInWithOAuth: (provider: 'github' | 'google') => Promise<ActionResponse>;
  signInWithEmail: (email: string) => Promise<ActionResponse>;
  signInWithPassword?: (email: string, password: string) => Promise<ActionResponse>;
  showBrand?: boolean;
  align?: 'left' | 'center';
}) {
  const [pending, setPending] = useState(false);
  const [emailFormOpen, setEmailFormOpen] = useState(true);

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

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signInWithPassword) return;
    setPending(true);
    const form = event.target as HTMLFormElement;
    const email = (form['email'] as any).value as string;
    const password = (form['password'] as any).value as string;
    const response = await signInWithPassword(email, password);

    if (response?.error) {
      toast({
        variant: 'destructive',
        description: 'Invalid email or password. Please try again.',
      });
      setPending(false);
    }
  }

  const alignClass = align === 'left' ? 'text-left' : 'text-center';

  return (
    <section className={cn('mt-16 w-full rounded-lg bg-white p-10 px-4', alignClass)}>
      <div className={cn('flex flex-col gap-4', align === 'left' ? '' : 'items-center')}>
        {showBrand && (
          <Image src='/logo.png' width={80} height={80} alt='' className={cn(align === 'left' ? '' : 'm-auto')} />
        )}
        <h1 className='text-2xl font-medium'>{titleMap[mode]}</h1>
        {mode === 'signup' ? (
          <p className='text-gray-600 text-sm'>Create a new account</p>
        ) : (
          <p className='text-gray-600 text-sm'>Sign in to your account</p>
        )}
      </div>
      <div className='mt-8 flex flex-col gap-4'>
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

        {/* Divider */}
        <div className='my-2 flex items-center gap-3 text-gray-500'>
          <span className='h-px flex-1 bg-gray-200' />
          <span className='text-xs'>or</span>
          <span className='h-px flex-1 bg-gray-200' />
        </div>

        {/* Form section */}
        {mode === 'login' ? (
          <form onSubmit={handlePasswordSubmit} className='mt-1 space-y-3'>
            <div className='space-y-1'>
              <label htmlFor='email' className='text-sm'>Email</label>
              <Input id='email' type='email' name='email' placeholder='you@example.com' aria-label='Email' autoFocus={align === 'left'} />
            </div>
            <div className='space-y-1'>
              <div className='flex items-center justify-between'>
                <label htmlFor='password' className='text-sm'>Password</label>
                {/* <Link href='/reset-password' className='text-gray-500 text-xs underline'>Forgot Password?</Link> */}
              </div>
              <Input id='password' type='password' name='password' placeholder='••••••••' aria-label='Password' />
            </div>
            <Button type='submit' className='w-full' disabled={pending}>
              {pending ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleEmailSubmit} className='mt-1 space-y-3'>
            <div className='space-y-1'>
              <label htmlFor='email' className='text-sm'>Email</label>
              <Input id='email' type='email' name='email' placeholder='you@example.com' aria-label='Enter your email' autoFocus={align === 'left'} />
            </div>
            <div className='flex justify-end'>
              <Button type='submit' disabled={pending}>
                {pending ? 'Sending…' : 'Sign up with Email'}
              </Button>
            </div>
          </form>
        )}
      </div>
      {mode === 'signup' && (
        <span className={cn('text-gray-600 mt-8 block max-w-sm text-sm', align === 'left' ? '' : 'm-auto')}>
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
      {mode === 'login' && (
        <div className={cn('mt-6 text-sm text-gray-700', align === 'left' ? '' : 'text-center')}>
          Don’t have an account?{' '}
          <Link href='/signup' className='underline hover:no-underline'>Sign Up Now</Link>
        </div>
      )}
    </section>
  );
}
