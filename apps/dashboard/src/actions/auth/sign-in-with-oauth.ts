'use server';

import { redirect } from 'next/navigation';

import type { ActionResponse } from '@/src/types/action-response';
import { getURL } from '@/src/utils/get-url';
import { createSupabaseServerClient } from '@zeke/auth';

export async function signInWithOAuth(
  provider: 'google'
): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getURL('/auth/callback'),
    },
  });

  if (error) {
    return { data: null, error };
  }

  return redirect(data.url);
}
