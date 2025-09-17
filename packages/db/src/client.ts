import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
	process.env.SUPABASE_DB_URL ??
	process.env.DATABASE_URL ??
	process.env.DATABASE_PRIMARY_URL;

if (!connectionString) {
	throw new Error(
		"Missing SUPABASE_DB_URL (or DATABASE_URL) environment variable for database connection.",
	);
}

const connectionConfig = {
	prepare: false,
	max: Number(process.env.DB_POOL_SIZE ?? 5),
	idle_timeout: 30,
	max_lifetime: 0,
	connect_timeout: 10,
	ssl: connectionString.includes("localhost") ? undefined : "require",
} as const;

const client = postgres(connectionString, connectionConfig);

export const db = drizzle(client, {
	schema,
	casing: "snake_case",
});

export const connectDb = async () => db;

export type Database = typeof db;

// Backwards compatibility for legacy helpers expecting this shape.
export type DatabaseWithPrimary = Database;
