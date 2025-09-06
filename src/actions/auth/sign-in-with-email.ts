'use server'

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client'
import type { ActionResponse } from '@/types/action-response'
import { getURL } from '@/utils/get-url'

export async function signInWithEmail(email: string): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getURL('/auth/callback'),
    },
  })

  if (error) {
    console.error(error)
    return { data: null, error }
  }

  return { data: null, error: null }
}

