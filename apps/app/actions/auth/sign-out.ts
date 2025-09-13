'use server';

import type { ActionResponse } from '@/types/action-response';
import { createSupabaseServerClient } from '@zeke/auth';

export async function signOut(): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { data: null, error };
  }

  return { data: null, error: null };
}
