'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@zeke/design-system/components/ui/avatar';
import { Button } from '@zeke/design-system/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@zeke/design-system/components/ui/dropdown-menu';
import { LogOut, Settings, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from './provider';

export function UserButton() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    // For now, just redirect to login. In a real app, you'd call a sign out action
    router.push('/login');
  };

  const userInitials = user.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user.user_metadata?.avatar_url}
              alt={user.user_metadata?.full_name || user.email}
            />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user.user_metadata?.full_name && (
              <p className="font-medium">{user.user_metadata.full_name}</p>
            )}
            <p className="w-[200px] truncate text-muted-foreground text-sm">
              {user.email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/account')}>
          <User className="mr-2 h-4 w-4" />
          <span>Account</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/account')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function OrganizationSwitcher({
  hidePersonal = false,
  afterSelectOrganizationUrl = '/',
}: {
  hidePersonal?: boolean;
  afterSelectOrganizationUrl?: string;
}) {
  // For now, this is a placeholder. In a real app, you'd implement organization switching logic
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <div className="flex h-6 w-6 items-center justify-center rounded bg-primary font-medium text-primary-foreground text-xs">
        Z
      </div>
      <span className="font-medium">ZEKE</span>
    </div>
  );
}
