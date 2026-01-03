import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getBaseEnv } from "@zeke/utils/env";
import * as schema from "./schema";

// Validate environment at startup - fail fast if DATABASE_PRIMARY_URL is missing
const env = getBaseEnv();

const isDevelopment = env.NODE_ENV === "development";

const sslMode = env.PGSSLMODE?.toLowerCase();
const sslOptions =
  sslMode === "disable"
    ? undefined
    : { rejectUnauthorized: sslMode !== "no-verify" };

const connectionConfig = {
  max: isDevelopment ? 8 : 12,
  idleTimeoutMillis: isDevelopment ? 5000 : 60000,
  connectionTimeoutMillis: 15000,
  maxUses: isDevelopment ? 100 : 0,
  allowExitOnIdle: true,
};

const primaryPool = new Pool({
  connectionString: env.DATABASE_PRIMARY_URL,
  ssl: sslOptions,
  ...connectionConfig,
});

// Connection pool monitoring function
export const getConnectionPoolStats = () => {
  const getPoolStats = (pool: Pool, name: string) => {
    try {
      return {
        name,
        total: pool.options?.max ?? 0,
        idle: pool.idleCount || 0,
        active: pool.totalCount - pool.idleCount,
        waiting: pool.waitingCount || 0,
        ended: pool.ended || false,
      };
    } catch (error) {
      return {
        name,
        error: error instanceof Error ? error.message : String(error),
        total: 0,
        idle: 0,
        active: 0,
        waiting: 0,
        ended: true,
      };
    }
  };

  const pools = {
    primary: getPoolStats(primaryPool, "primary"),
  };

  const poolArray = Object.values(pools);
  const totalActive = poolArray.reduce(
    (sum: number, pool: any) => sum + (pool.active || 0),
    0,
  );
  const totalWaiting = poolArray.reduce(
    (sum: number, pool: any) => sum + (pool.waiting || 0),
    0,
  );
  const hasExhaustedPools = poolArray.some(
    (pool: any) =>
      (pool.active || 0) >= (pool.total || 0) || (pool.waiting || 0) > 0,
  );

  const totalConnections = primaryPool.options?.max ?? connectionConfig.max;
  const utilizationPercent = totalConnections
    ? Math.round((totalActive / totalConnections) * 100)
    : 0;

  const currentEnv = getBaseEnv();

  return {
    timestamp: new Date().toISOString(),
    region: currentEnv.FLY_REGION || "unknown",
    instance: currentEnv.FLY_ALLOC_ID || "local",
    pools,
    summary: {
      totalConnections,
      totalActive,
      totalWaiting,
      hasExhaustedPools,
      utilizationPercent,
    },
  };
};

export const primaryDb = drizzle(primaryPool, {
  schema,
  casing: "snake_case",
});

export const db = primaryDb;

// Keep connectDb for backward compatibility, but just return the singleton
export const connectDb = async () => {
  return db;
};

export const createClient = () => db;

export type Database = Awaited<ReturnType<typeof connectDb>>;
