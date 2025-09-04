import Link from 'next/link';
// import Image from 'next/image';
import { IoMenu } from 'react-icons/io5';

import { AccountMenu } from '@/components/account-menu';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTrigger } from '@/components/ui/sheet';
import { getSession } from '@/features/account/controllers/get-session';
import SignOutButton from '@/components/sign-out-button';

import { signOut } from './(auth)/auth-actions';

export async function Navigation() {
  const session = await getSession();

  return (
    <div className='relative flex items-center gap-6'>
      {session ? (
        <div className='flex items-center gap-3'>
          <AccountMenu signOut={signOut} email={session.user?.email} />
          {session.user?.email && (
            <Link
              href='/account'
              className='hidden rounded-full border px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-50 lg:inline-block'
            >
              {session.user.email}
            </Link>
          )}
          {/* Mobile sheet with account info */}
          <Sheet>
            <SheetTrigger
              className='block rounded-md p-2 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 lg:hidden'
              aria-label='Open menu'
            >
              <IoMenu size={24} className='text-gray-700' />
            </SheetTrigger>
            <SheetContent className='w-full bg-white'>
              <SheetHeader>
                <Logo />
                <SheetDescription className='py-8'>
                  <div className='flex items-center gap-3'>
                    {/* Inline avatar/initials */}
                    <div className='flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700'>
                      {(session.user?.email?.[0] ?? '').toUpperCase()}
                    </div>
                    {session.user?.email && <div className='text-xs text-gray-700'>{session.user.email}</div>}
                  </div>
                  <div className='mt-4 flex items-center gap-2'>
                    <Button variant='secondary' asChild>
                      <Link href='/account'>Account</Link>
                    </Button>
                    <SignOutButton signOut={signOut} variant='ghost' size='sm' />
                  </div>
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <>
          <Button variant='default' className='hidden flex-shrink-0 lg:flex' asChild>
            <Link href='/signup'>Get started for free</Link>
          </Button>
          <Sheet>
            <SheetTrigger
              className='block rounded-md p-2 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 lg:hidden'
              aria-label='Open menu'
            >
              <IoMenu size={24} className='text-gray-700' />
            </SheetTrigger>
            <SheetContent className='w-full bg-white'>
              <SheetHeader>
                <Logo />
                <SheetDescription className='py-8'>
                  <Button variant='default' className='flex-shrink-0' asChild>
                    <Link href='/signup'>Get started for free</Link>
                  </Button>
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}
