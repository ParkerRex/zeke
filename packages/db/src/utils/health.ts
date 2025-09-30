import { db } from "../client";
import { sql } from "drizzle-orm";

export async function checkHealth(): Promise<void> {
  try {
    // Simple query to check database connectivity
    await db.execute(sql`SELECT 1`);
  } catch (error) {
    throw new Error(`Database health check failed: ${error}`);
  }
}
