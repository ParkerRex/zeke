import type { Config } from "drizzle-kit";
import { readFileSync } from "fs";
import { resolve } from "path";

const isSupabase = process.env.DATABASE_SESSION_POOLER_URL?.includes("supabase.com");

export default {
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_SESSION_POOLER_URL || process.env.DATABASE_SESSION_POOLER!,
    ssl: isSupabase ? {
      ca: readFileSync(resolve(__dirname, "../../prod-ca-2021.crt")).toString(),
    } : false,
  },
} satisfies Config;
