/**
 * Worker Drizzle client wrapper
 * Provides a typed interface to the shared Drizzle queries
 */

import {
	createContentQueries,
	createPlatformQueries,
	createRawItemQueries,
	createSourceQueries,
	createStoryQueries,
} from "@zeke/db/queries";
import * as schema from "@zeke/db/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { log } from "../log.js";

// Get database connection string
const connectionString = process.env.DATABASE_URL || "";

// Use SSL only for non-local connections
const useSsl = !(
	connectionString.includes("127.0.0.1") ||
	connectionString.includes("localhost") ||
	connectionString.includes("host.docker.internal")
);

// Create postgres client with connection pooling
const client = postgres(connectionString, {
	ssl: useSsl ? "require" : false,
	max: 3,
	idle_timeout: 30,
	connect_timeout: 30,
	onnotice: () => {}, // Suppress notices
});

// Create Drizzle instance
export const db = drizzle(client, { schema });

// Create query instances
export const rawItemQueries = createRawItemQueries(db);
export const contentQueries = createContentQueries(db);
export const sourceQueries = createSourceQueries(db);
export const storyQueries = createStoryQueries(db);
export const platformQueries = createPlatformQueries(db);

// Export a combined queries object for convenience
export const queries = {
	rawItems: rawItemQueries,
	contents: contentQueries,
	sources: sourceQueries,
	stories: storyQueries,
	platform: platformQueries,
};

// Handle connection errors
client.listen("error", (err) => {
	log("drizzle_client_error", { err: String(err) }, "warn");
});

// Export the raw client for migrations or special cases
export { client as rawClient };

// Export types
export type WorkerDb = typeof db;
export type WorkerQueries = typeof queries;
