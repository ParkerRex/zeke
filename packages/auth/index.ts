// Main exports for the auth package
export { createSupabaseBrowserClient } from './clients/browser';
export {
  createSupabaseServerClient,
  getUser,
  getSession,
} from './clients/server';
export { updateSession } from './middleware';
export { AuthProvider, useAuth } from './provider';
export type { AuthContextType } from './types';

// Server-side auth utilities
export { auth, currentUser } from './server';
