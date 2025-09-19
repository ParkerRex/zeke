import { createClient } from "@zeke/supabase/server";
import { ForbiddenError, UnauthorizedError } from "./errors";

/**
 * Ensure the current request belongs to an admin user. Throws typed errors so
 * callers can return the appropriate HTTP response. Returns the Supabase
 * client + session for subsequent work.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (!session?.user) {
    throw new UnauthorizedError();
  }

  const { data, error: adminError } = await supabase.rpc("is_admin_user");

  if (adminError) {
    throw adminError;
  }

  if (!data) {
    throw new ForbiddenError();
  }

  return { supabase, session } as const;
}
