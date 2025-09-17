import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/db';

export const supabaseAdminClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
