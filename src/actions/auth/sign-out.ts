'use server'

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'
import type { ActionResponse } from '@/types/action-response'

export async function signOut(): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error(error)
    return { data: null, error }
  }

  return { data: null, error: null }
}

