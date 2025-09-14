import 'server-only';
import { redirect } from 'next/navigation';
import { getUser as getUserFromClient } from './clients/server';

/**
 * Get the current authenticated user
 * Returns null if no user is authenticated
 */
export async function currentUser() {
  try {
    return await getUserFromClient();
  } catch {
    return null;
  }
}

/**
 * Auth utilities for server-side authentication checks
 */
export async function auth() {
  const user = await currentUser();

  return {
    user,
    redirectToSignIn: () => {
      redirect('/login');
    },
  };
}
