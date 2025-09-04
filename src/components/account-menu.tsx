'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IoPersonCircleOutline } from 'react-icons/io5';

import {
  DropdownMenu,
  DropdownMenuArrow,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ActionResponse } from '@/types/action-response';

import { useToast } from './ui/use-toast';

type Props = {
  signOut: () => Promise<ActionResponse>;
  email?: string | null;
  avatarUrl?: string | null;
};

export function AccountMenu({ signOut, email, avatarUrl }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  async function handleLogoutClick() {
    const response = await signOut();

    if (response?.error) {
      toast({
        variant: 'destructive',
        description: 'An error occurred while logging out. Please try again or contact support.',
      });
    } else {
      router.refresh();

      toast({
        description: 'You have been logged out.',
      });
    }
  }

  const initial = (email?.[0] ?? '').toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className='rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-150 cursor-pointer'
        aria-label='Account menu'
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={email ?? 'Account'}
            width={32}
            height={32}
            className='h-8 w-8 rounded-full object-cover'
          />
        ) : initial ? (
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700'>
            {initial}
          </div>
        ) : (
          <IoPersonCircleOutline size={24} className='text-gray-700' />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className='me-4 min-w-40'>
        <DropdownMenuItem asChild>
          <Link href='/account' className='cursor-pointer'>Account</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLogoutClick}
          className='cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50'
        >
          Log Out
        </DropdownMenuItem>
        <DropdownMenuArrow className='me-4 fill-white' />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
