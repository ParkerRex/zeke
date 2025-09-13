'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IoPersonCircleOutline } from 'react-icons/io5';

import type { ActionResponse } from '@/types/action-response';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@zeke/design-system/components/ui/dropdown-menu';
import { toast } from 'sonner';

type Props = {
  signOutAction: () => Promise<ActionResponse>;
  email?: string | null;
  avatarUrl?: string | null;
};

export function AccountMenu({ signOutAction, email, avatarUrl }: Props) {
  const router = useRouter();

  async function handleLogoutClick() {
    const response = await signOutAction();

    if (response?.error) {
      toast.error(
        'An error occurred while logging out. Please try again or contact support.'
      );
    } else {
      router.refresh();
      toast.success('You have been logged out.');
    }
  }

  const initial = (email?.[0] ?? '').toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="cursor-pointer rounded-full p-1 transition-all duration-150 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
      >
        {
          // Render avatar image, initial badge, or fallback icon without nested ternaries
        }
        {(() => {
          if (avatarUrl) {
            return (
              <Image
                alt={email ?? 'Account'}
                className="h-8 w-8 rounded-full object-cover"
                height={32}
                src={avatarUrl}
                unoptimized
                width={32}
              />
            );
          }
          if (initial) {
            return (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 font-semibold text-gray-700 text-sm">
                {initial}
              </div>
            );
          }
          return <IoPersonCircleOutline className="text-gray-700" size={24} />;
        })()}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="me-4 min-w-40">
        <DropdownMenuItem asChild>
          <Link className="cursor-pointer" href="/account">
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
          onClick={handleLogoutClick}
        >
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
