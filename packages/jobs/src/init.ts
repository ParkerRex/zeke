import { AsyncLocalStorage } from "node:async_hooks";
import type { Database } from "@zeke/db/client";
import { createJobDb } from "@zeke/db/job-client";

// AsyncLocalStorage for per-job database instances
const dbStorage = new AsyncLocalStorage<{
  db: Database;
  disconnect: () => Promise<void>;
}>();

// Helper function to get the database instance
export const getDb = (): Database => {
  const dbObj = dbStorage.getStore();
  if (!dbObj) {
    throw new Error(
      "Database not initialized. Are you running outside of a job context?",
    );
  }
  return dbObj.db;
};

// Run a function with a fresh database instance
export async function withJobDb<T>(fn: () => Promise<T>): Promise<T> {
  const dbObj = createJobDb();

  try {
    return await dbStorage.run(dbObj, fn);
  } finally {
    await dbObj.disconnect();
  }
}

// For backwards compatibility - create db on demand if not in job context
let sharedDb: { db: Database; disconnect: () => Promise<void> } | null = null;

export const getDbOrCreate = (): Database => {
  const jobDb = dbStorage.getStore();
  if (jobDb) {
    return jobDb.db;
  }

  // Fallback to shared instance for non-job contexts
  if (!sharedDb) {
    sharedDb = createJobDb();
  }
  return sharedDb.db;
};

export async function cleanupSharedDb(): Promise<void> {
  if (sharedDb) {
    await sharedDb.disconnect();
    sharedDb = null;
  }
}
