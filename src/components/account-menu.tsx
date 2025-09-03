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

export function AccountMenu({ signOut }: { signOut: () => Promise<ActionResponse> }) {
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-150 cursor-pointer' aria-label='Account menu'>
        <IoPersonCircleOutline size={24} className='text-gray-700' />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='me-4 min-w-40'>
        <DropdownMenuItem asChild>
          <Link href='/account' className='cursor-pointer'>Account</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogoutClick} className='cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50'>
          Log Out
        </DropdownMenuItem>
        <DropdownMenuArrow className='me-4 fill-white' />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
