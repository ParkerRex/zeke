import { createSupabaseServerClient } from "@/lib/supabase/supabase-server-client";
import type { SubscriptionWithProduct } from "@/types/pricing";

export async function getSubscription(): Promise<SubscriptionWithProduct | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*, prices(*, products(*))")
    .in("status", ["trialing", "active"])
    .maybeSingle();
  if (error) {
    throw error;
  }
  return (data as SubscriptionWithProduct | null) ?? null;
}
