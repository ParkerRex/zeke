import { signOut } from '@/actions/auth/sign-out';
import { AccountMenu } from '@/app/components/account-menu';
import { Logo } from '@/app/components/logo';
import SignOutButton from '@/app/components/sign-out-button';
import { Button } from '@zeke/design-system/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTrigger,
} from '@zeke/design-system/components/ui/sheet';
import { getSession } from '@zeke/supabase/queries';
import Image from 'next/image';
import Link from 'next/link';
import { IoMenu, IoPerson } from 'react-icons/io5';

export async function Navigation() {
  const session = await getSession();
  const avatarUrl =
    (session?.user as any)?.user_metadata?.avatar_url ??
    (session?.user as any)?.user_metadata?.picture ??
    null;

  return (
    <div className="relative flex items-center gap-6">
      {session ? (
        <div className="flex items-center gap-3">
          <AccountMenu
            avatarUrl={avatarUrl}
            email={session.user?.email}
            signOutAction={signOut}
          />
          {session.user?.email && (
            <Link
              className="hidden rounded-full border px-3 py-1 text-gray-700 text-sm transition-colors hover:bg-gray-50 lg:inline-block"
              href="/account"
            >
              {session.user.email}
            </Link>
          )}
          {/* Mobile sheet with account info */}
          <Sheet>
            <SheetTrigger
              aria-label="Open menu"
              className="block rounded-md p-2 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 lg:hidden"
            >
              <IoMenu className="text-gray-700" size={24} />
            </SheetTrigger>
            <SheetContent className="w-full bg-white">
              <SheetHeader>
                <Logo />
                <SheetDescription className="py-8">
                  <div className="flex items-center gap-3">
                    {/* Inline avatar/initials */}
                    {avatarUrl ? (
                      <Image
                        alt={session.user?.email ?? 'Account'}
                        className="h-9 w-9 rounded-full object-cover"
                        height={36}
                        src={avatarUrl}
                        unoptimized
                        width={36}
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 font-semibold text-gray-700 text-sm">
                        {(session.user?.email?.[0] ?? '').toUpperCase()}
                      </div>
                    )}
                    {session.user?.email && (
                      <div className="text-gray-700 text-xs">
                        {session.user.email}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Button asChild variant="secondary">
                      <Link href="/account">Account</Link>
                    </Button>
                    <SignOutButton
                      signOutAction={signOut}
                      size="sm"
                      variant="ghost"
                    />
                  </div>
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <>
          <Button
            asChild
            className="hidden flex-shrink-0 lg:flex"
            size="nav"
            variant="outline"
          >
            <Link className="flex items-center gap-2" href="/login">
              <span>Login</span>
              <IoPerson size={16} />
            </Link>
          </Button>
          <Button
            asChild
            className="hidden flex-shrink-0 lg:flex"
            size="nav"
            variant="default"
          >
            <Link href="/signup">Try for free</Link>
          </Button>
          <Sheet>
            <SheetTrigger
              aria-label="Open menu"
              className="block rounded-md p-2 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 lg:hidden"
            >
              <IoMenu className="text-gray-700" size={24} />
            </SheetTrigger>
            <SheetContent className="w-full bg-white">
              <SheetHeader>
                <Logo />
                <SheetDescription className="flex gap-3 py-8">
                  <Button asChild className="flex-shrink-0" variant="outline">
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button asChild className="flex-shrink-0" variant="default">
                    <Link href="/signup">Try for free</Link>
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
