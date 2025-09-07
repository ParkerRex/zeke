"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/supabase-server-client";
import type { ActionResponse } from "@/types/action-response";
import { getURL } from "@/utils/get-url";

export async function signInWithOAuth(
  provider: "github" | "google"
): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getURL("/auth/callback"),
    },
  });

  if (error) {
    return { data: null, error };
  }

  return redirect(data.url);
}
