'use client';

import { useTheme } from 'next-themes';
import { createContext, useContext, useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from './clients/browser';
import type { AuthContextType, AuthProviderProperties } from './types';

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export const AuthProvider = ({
  children,
  privacyUrl,
  termsUrl,
  helpUrl,
}: AuthProviderProperties) => {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [session, setSession] = useState<AuthContextType['session']>(null);
  const [loading, setLoading] = useState(true);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Store URLs for potential use in auth flows
  const authConfig = {
    privacyUrl,
    termsUrl,
    helpUrl,
    theme: isDark ? 'dark' : 'default',
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
