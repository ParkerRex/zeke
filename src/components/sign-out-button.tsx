'use client';

import type { ComponentProps } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { ActionResponse } from '@/types/action-response';

import { useToast } from './ui/use-toast';

type Props = {
  signOut: () => Promise<ActionResponse>;
  className?: string;
  variant?: ComponentProps<typeof Button>['variant'];
  size?: ComponentProps<typeof Button>['size'];
};

export function SignOutButton({ signOut, className, variant = 'destructive', size = 'sm' }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  async function handleClick() {
    const response = await signOut();
    if (response?.error) {
      toast({
        variant: 'destructive',
        description: 'An error occurred while logging out. Please try again or contact support.',
      });
    } else {
      router.refresh();
      toast({ description: 'You have been logged out.' });
    }
  }

  return (
    <Button onClick={handleClick} className={className} variant={variant} size={size}>
      Sign Out
    </Button>
  );
}

export default SignOutButton;
