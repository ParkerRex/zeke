import type { Config } from "drizzle-kit";

export default {
	out: "./migrations",
	schema: "./src/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_SESSION_POOLER_URL,
	},
} satisfies Config;
