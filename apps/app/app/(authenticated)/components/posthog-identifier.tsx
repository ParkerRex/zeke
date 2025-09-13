'use client';

import { useAnalytics } from '@zeke/analytics';
import { useAuth } from '@zeke/auth';
import { useEffect } from 'react';

export function PostHogIdentifier() {
  const { user } = useAuth();
  const posthog = useAnalytics();

  useEffect(() => {
    if (user && posthog) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name,
      });
    }
  }, [user, posthog]);

  return null;
}
