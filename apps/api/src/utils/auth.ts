import { type JWTPayload, jwtVerify } from "jose";
import { getApiEnv } from "@zeke/utils/env";

export type Session = {
  user: {
    id: string;
    email?: string;
    full_name?: string;
  };
  teamId?: string;
};

type SupabaseJWTPayload = JWTPayload & {
  user_metadata?: {
    email?: string;
    full_name?: string;
    [key: string]: string | undefined;
  };
};

export async function verifyAccessToken(
  accessToken?: string,
): Promise<Session | null> {
  if (!accessToken) return null;

  try {
    // Get validated environment - will fail fast if SUPABASE_JWT_SECRET is missing
    const env = getApiEnv();

    const { payload } = await jwtVerify(
      accessToken,
      new TextEncoder().encode(env.SUPABASE_JWT_SECRET),
    );

    const supabasePayload = payload as SupabaseJWTPayload;

    return {
      user: {
        id: supabasePayload.sub!,
        email: supabasePayload.user_metadata?.email,
        full_name: supabasePayload.user_metadata?.full_name,
      },
    };
  } catch (error) {
    return null;
  }
}
