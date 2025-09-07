import { createSupabaseServerClient } from "@/lib/supabase/supabase-server-client";

export async function getSession() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
}
