import { createClient } from "@api/services/supabase";
import { verifyAccessToken, type Session } from "@api/utils/auth";
import { getGeoContext } from "@api/utils/geo";
import type { Database } from "@zeke/db/client";
import { connectDb } from "@zeke/db/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { HonoRequest } from "hono";

export type ApiContext = {
  session: Session | null;
  supabase: SupabaseClient;
  db: Database;
  geo: ReturnType<typeof getGeoContext>;
  accessToken?: string;
};

export async function createApiContext(req: HonoRequest): Promise<ApiContext> {
  const authHeader = req.header("authorization") ?? req.header("Authorization");
  const accessToken = authHeader?.split(" ")[1];

  const [session, supabase, db] = await Promise.all([
    verifyAccessToken(accessToken),
    createClient(accessToken),
    connectDb(),
  ]);

  const geo = getGeoContext(req);

  return {
    session,
    supabase,
    db,
    geo,
    accessToken,
  };
}
