import { z } from "zod";

/**
 * Environment variable validation schema
 *
 * This module provides centralized, type-safe environment variable validation
 * to prevent the application from starting with missing or invalid configuration.
 *
 * Critical security note: All secret keys and tokens MUST be validated at startup
 * to prevent silent failures and potential security bypasses.
 */

// Helper to create optional string with empty string as undefined
const optionalString = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((val) => val || undefined);

// Base environment schema - required for all apps
const baseEnvSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Database - CRITICAL
  DATABASE_PRIMARY_URL: z.string().min(1, "DATABASE_PRIMARY_URL is required"),
  DATABASE_PRIMARY_POOLER_URL: optionalString,
  DATABASE_URL: optionalString,

  // PostgreSQL SSL mode
  PGSSLMODE: z.enum(["disable", "no-verify", "require"]).optional(),

  // Authentication (Better Auth) - CRITICAL
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET is required and must be at least 32 characters"),
  AUTH_TRUSTED_ORIGINS: optionalString,

  // OAuth Providers (optional - enable as needed)
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  GITHUB_CLIENT_ID: optionalString,
  GITHUB_CLIENT_SECRET: optionalString,
  APPLE_CLIENT_ID: optionalString,
  APPLE_CLIENT_SECRET: optionalString,
  APPLE_TEAM_ID: optionalString,
  APPLE_KEY_ID: optionalString,

  // Storage (MinIO) - CRITICAL for file uploads
  MINIO_ENDPOINT: z
    .string()
    .url("MINIO_ENDPOINT must be a valid URL")
    .optional(),
  MINIO_ACCESS_KEY: optionalString,
  MINIO_SECRET_KEY: optionalString,
  MINIO_ROOT_USER: optionalString,
  MINIO_ROOT_PASSWORD: optionalString,
  MINIO_BUCKET_VAULT: z.string().default("vault"),
  MINIO_BUCKET_INBOX: z.string().default("inbox"),
  MINIO_BUCKET_ASSETS: z.string().default("assets"),
  NEXT_PUBLIC_STORAGE_URL: optionalString,

  // Realtime WebSocket
  NEXT_PUBLIC_REALTIME_WS_URL: optionalString,

  // Application URLs
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),

  // OpenAI - CRITICAL for AI features
  OPENAI_API_KEY: z
    .string()
    .min(20, "OPENAI_API_KEY is required for AI features"),

  // Background Jobs (pg-boss)
  JOBS_CRON_TZ: z.string().default("UTC"),

  // Redis - Required for caching
  REDIS_URL: z
    .string()
    .url("REDIS_URL must be a valid URL")
    .default("redis://localhost:6379"),

  // API Security
  API_SECRET_KEY: z
    .string()
    .min(32, "API_SECRET_KEY must be at least 32 characters for security"),
  ALLOWED_API_ORIGINS: optionalString,

  // Vercel (optional, for deployments)
  VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  VERCEL_URL: optionalString,

  // Fly.io (optional, for deployments)
  FLY_REGION: optionalString,
  FLY_ALLOC_ID: optionalString,

  // Server configuration
  PORT: z.string().regex(/^\d+$/).transform(Number).optional(),

  // Stripe (optional, for payments)
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optionalString,

  // Email services (optional)
  RESEND_API_KEY: optionalString,

  // Support/Feedback (optional)
  PLAIN_API_KEY: optionalString,

  // Monitoring (optional)
  NEXT_PUBLIC_SENTRY_DSN: optionalString,

  // YouTube API (optional)
  YOUTUBE_API_KEY: optionalString,
  YOUTUBE_QUOTA_LIMIT: z.string().regex(/^\d+$/).optional(),
  YOUTUBE_QUOTA_RESET_HOUR: z.string().regex(/^\d+$/).optional(),
  YOUTUBE_RATE_LIMIT_BUFFER: z.string().regex(/^\d+$/).optional(),
});

// Engine-specific environment schema
const engineEnvSchema = baseEnvSchema.pick({
  NODE_ENV: true,
  API_SECRET_KEY: true,
  JOBS_CRON_TZ: true,
  YOUTUBE_API_KEY: true,
  YOUTUBE_QUOTA_LIMIT: true,
  YOUTUBE_QUOTA_RESET_HOUR: true,
  YOUTUBE_RATE_LIMIT_BUFFER: true,
  PORT: true,
});

// API-specific environment schema
const apiEnvSchema = baseEnvSchema.pick({
  NODE_ENV: true,
  DATABASE_PRIMARY_URL: true,
  DATABASE_PRIMARY_POOLER_URL: true,
  PGSSLMODE: true,
  AUTH_SECRET: true,
  OPENAI_API_KEY: true,
  JOBS_CRON_TZ: true,
  REDIS_URL: true,
  ALLOWED_API_ORIGINS: true,
  FLY_REGION: true,
  FLY_ALLOC_ID: true,
  PORT: true,
  RESEND_API_KEY: true,
});

// Dashboard-specific environment schema
const dashboardEnvSchema = baseEnvSchema.pick({
  NODE_ENV: true,
  AUTH_SECRET: true,
  AUTH_TRUSTED_ORIGINS: true,
  GOOGLE_CLIENT_ID: true,
  GOOGLE_CLIENT_SECRET: true,
  GITHUB_CLIENT_ID: true,
  GITHUB_CLIENT_SECRET: true,
  APPLE_CLIENT_ID: true,
  APPLE_CLIENT_SECRET: true,
  NEXT_PUBLIC_SITE_URL: true,
  NEXT_PUBLIC_APP_URL: true,
  NEXT_PUBLIC_API_URL: true,
  NEXT_PUBLIC_STORAGE_URL: true,
  NEXT_PUBLIC_REALTIME_WS_URL: true,
  STRIPE_SECRET_KEY: true,
  STRIPE_WEBHOOK_SECRET: true,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: true,
  PLAIN_API_KEY: true,
  NEXT_PUBLIC_SENTRY_DSN: true,
  VERCEL_ENV: true,
  VERCEL_URL: true,
});

// Type inference
export type BaseEnv = z.infer<typeof baseEnvSchema>;
export type EngineEnv = z.infer<typeof engineEnvSchema>;
export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type DashboardEnv = z.infer<typeof dashboardEnvSchema>;

/**
 * Validates environment variables against a schema
 * Throws a detailed error if validation fails
 */
function validateEnv<T extends z.ZodType>(
  schema: T,
  source: NodeJS.ProcessEnv = process.env,
): z.infer<T> {
  try {
    return schema.parse(source);
  } catch (error: any) {
    // Handle Zod validation errors
    if (error && error.name === "ZodError") {
      // In Zod v4, the error message contains the stringified errors array
      // Try to parse it, or use the error object directly if it has errors property
      let errorList: any[] = [];

      if ("errors" in error && Array.isArray(error.errors)) {
        // Zod v3 format
        errorList = error.errors;
      } else if (error.message) {
        // Zod v4 format - parse the message
        try {
          errorList = JSON.parse(error.message);
        } catch {
          // If parsing fails, show the raw message
          console.error("\n❌ Environment variable validation failed:");
          console.error(error.message);
          console.error(
            "\nPlease check your .env file and ensure all required variables are set.\n",
          );
          throw new Error("Invalid environment configuration");
        }
      }

      const missingVars = errorList
        .map((err: any) => `  - ${err.path.join(".")}: ${err.message}`)
        .join("\n");

      console.error("\n❌ Environment variable validation failed:\n");
      console.error(missingVars);
      console.error(
        "\nPlease check your .env file and ensure all required variables are set.\n",
      );

      throw new Error("Invalid environment configuration");
    }
    throw error;
  }
}

// Cached validated environment - only parse once
let cachedEnv: BaseEnv | null = null;
let cachedEngineEnv: EngineEnv | null = null;
let cachedApiEnv: ApiEnv | null = null;
let cachedDashboardEnv: DashboardEnv | null = null;

/**
 * Get validated base environment variables
 * This will fail fast at startup if required variables are missing
 */
export function getBaseEnv(): BaseEnv {
  if (!cachedEnv) {
    cachedEnv = validateEnv(baseEnvSchema);
  }
  return cachedEnv;
}

/**
 * Get validated engine environment variables
 */
export function getEngineEnv(): EngineEnv {
  if (!cachedEngineEnv) {
    cachedEngineEnv = validateEnv(engineEnvSchema);
  }
  return cachedEngineEnv;
}

/**
 * Get validated API environment variables
 */
export function getApiEnv(): ApiEnv {
  if (!cachedApiEnv) {
    cachedApiEnv = validateEnv(apiEnvSchema);
  }
  return cachedApiEnv;
}

/**
 * Get validated dashboard environment variables
 */
export function getDashboardEnv(): DashboardEnv {
  if (!cachedDashboardEnv) {
    cachedDashboardEnv = validateEnv(dashboardEnvSchema);
  }
  return cachedDashboardEnv;
}

/**
 * Reset cached environment (useful for testing)
 */
export function resetEnvCache(): void {
  cachedEnv = null;
  cachedEngineEnv = null;
  cachedApiEnv = null;
  cachedDashboardEnv = null;
}

// Export schemas for testing and extension
export const schemas = {
  base: baseEnvSchema,
  engine: engineEnvSchema,
  api: apiEnvSchema,
  dashboard: dashboardEnvSchema,
};
