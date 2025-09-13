import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './db.js';

export type Client = SupabaseClient<Database>;

export * from './db.js';
export * from './stories.js';
export * from './pricing.js';
