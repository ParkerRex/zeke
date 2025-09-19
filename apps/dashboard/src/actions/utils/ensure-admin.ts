import { ForbiddenError, UnauthorizedError } from "@/utils/errors";

/**
 * Server-action helper that verifies the provided Supabase client belongs to
 * an admin session. Throws typed errors so callers can map to HTTP statuses.
 */
export async function ensureAdmin(supabase: {
  auth: {
    getSession: () => Promise<{
      data: { session: { user: { id: string } } | null };
      error: Error | null;
    }>;
  };
  rpc: (fn: string) => Promise<{ data: boolean | null; error: Error | null }>;
}) {
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
}
