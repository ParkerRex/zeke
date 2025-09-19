import type { Session } from "@api/utils/auth";
import { getGeoContext } from "@api/utils/geo";
import type { Scope } from "@api/utils/scopes";
import type { Database } from "@zeke/db/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ApiGeoContext = ReturnType<typeof getGeoContext>;

export type Context = {
  Variables: {
    db: Database;
    session: Session | null;
    teamId: string | null;
    supabase: SupabaseClient;
    geo: ApiGeoContext;
    scopes: Scope[];
  };
};
