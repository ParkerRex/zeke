"use server";

import { createSupabaseServerClient } from "@/libs/supabase/supabase-server-client";

export async function getUser() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("users").select("*").single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    data,
  };
}
