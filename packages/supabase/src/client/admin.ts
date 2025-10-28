import { createClient } from "@supabase/supabase-js";
import { getBaseEnv } from "@zeke/utils/env";
import type { Database } from "../types/db";

// Validate environment at startup - fail fast if missing critical Supabase vars
const env = getBaseEnv();

export const supabaseAdminClient = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);
