import type { Session, User } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export type AuthProviderProperties = {
  children: React.ReactNode;
  privacyUrl?: string;
  termsUrl?: string;
  helpUrl?: string;
};
