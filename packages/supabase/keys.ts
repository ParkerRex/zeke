import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
	createEnv({
		server: {
			SUPABASE_SERVICE_ROLE_KEY: z.string().startsWith("sbp_"),
			SUPABASE_WEBHOOK_SECRET: z.string().optional(),
		},
		client: {
			NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
			NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().startsWith("eyJ"),
		},
		runtimeEnv: {
			SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
			SUPABASE_WEBHOOK_SECRET: process.env.SUPABASE_WEBHOOK_SECRET,
			NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
			NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		},
	});
