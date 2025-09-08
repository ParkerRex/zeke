"use server";

import { createSupabaseServerClient } from "@/lib/supabase/supabase-server-client";
import type { ActionResponse } from "@/types/action-response";
import { getURL } from "@/utils/get-url";

export async function signInWithEmail(email: string): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getURL("/auth/callback"),
      shouldCreateUser: false,
    },
  });

  if (error) {
    // Error is returned to the client for handling
    return { data: null, error };
  }

  return { data: null, error: null };
}
