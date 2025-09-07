"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/libs/supabase/supabase-server-client";
import type { ActionResponse } from "@/types/action-response";

export async function signInWithPassword(
  email: string,
  password: string
): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { data: null, error };
  }

  return redirect("/account");
}
