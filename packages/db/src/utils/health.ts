import { sql } from "drizzle-orm";
import { db } from "../client";

export async function checkHealth() {
  const candidate = db as unknown as { executeOnReplica?: (query: unknown) => Promise<unknown>; execute?: (query: unknown) => Promise<unknown> };

  try {
    if (typeof candidate.executeOnReplica === "function") {
      await candidate.executeOnReplica(sql`SELECT 1`);
      return;
    }

    if (typeof candidate.execute === "function") {
      await candidate.execute(sql`SELECT 1`);
      return;
    }
  } catch (error) {
    console.error("Database health check failed", error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Database health check failed: ${message}`);
  }

  throw new Error("Database client does not support execute or executeOnReplica");
}
