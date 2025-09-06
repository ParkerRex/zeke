import Link from "next/link";
// import Image from 'next/image';
import { IoMenu } from "react-icons/io5";

import { AccountMenu } from "@/components/account-menu";
import { Logo } from "@/components/logo";
import SignOutButton from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getSession } from "@db/queries/account/get-session";

import { signOut } from "@/actions/auth/sign-out";

export async function Navigation() {
  const session = await getSession();

  return (
    <div className="relative flex items-center gap-6">
      {session ? (
        <div className="flex items-center gap-3">
          <AccountMenu email={session.user?.email} signOut={signOut} />
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
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 font-semibold text-gray-700 text-sm">
                      {(session.user?.email?.[0] ?? "").toUpperCase()}
                    </div>
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
                      signOut={signOut}
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
          <Button asChild className="hidden flex-shrink-0 lg:flex" variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild className="hidden flex-shrink-0 lg:flex" variant="default">
            <Link href="/signup">Launch your workspace</Link>
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
                <SheetDescription className="py-8 flex gap-3">
                  <Button asChild className="flex-shrink-0" variant="secondary">
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button asChild className="flex-shrink-0" variant="default">
                    <Link href="/signup">Launch your workspace</Link>
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
