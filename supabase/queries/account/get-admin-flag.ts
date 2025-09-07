import { createSupabaseServerClient } from "@/lib/supabase/supabase-server-client";

export async function getAdminFlag() {
  const supabase = await createSupabaseServerClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id ?? null;
  if (!userId) {
    return { userId: null, isAdmin: false } as const;
  }

  const { data, error } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", userId)
    .limit(1)
    .maybeSingle();
  if (error) {
    // Log error in production only
    // console.error("getAdminFlag error", error);
    return { userId, isAdmin: false } as const;
  }
  // data can be null if no user found
  if (!data) {
    return { userId, isAdmin: false } as const;
  }
  return { userId, isAdmin: !!data.is_admin } as const;
}
