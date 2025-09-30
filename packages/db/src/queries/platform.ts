import { eq, sql } from "drizzle-orm";
import type { Database } from "@db/client";
import { platformQuota } from "@db/schema";

export function createPlatformQueries(db: Database) {
  return {
    /**
     * Upsert platform quota
     */
    async upsertPlatformQuota(
      provider: string,
      snapshot: {
        limit?: number | null;
        used?: number | null;
        remaining?: number | null;
        reset_at?: string | null;
      },
    ) {
      await db
        .insert(platformQuota)
        .values({
          provider,
          quota_limit: snapshot.limit ?? undefined,
          used: snapshot.used ?? undefined,
          remaining: snapshot.remaining ?? undefined,
          reset_at: snapshot.reset_at
            ? new Date(snapshot.reset_at).toISOString()
            : undefined,
          updated_at: sql`now()`,
        })
        .onConflictDoUpdate({
          target: platformQuota.provider,
          set: {
            quota_limit: snapshot.limit ?? undefined,
            used: snapshot.used ?? undefined,
            remaining: snapshot.remaining ?? undefined,
            reset_at: snapshot.reset_at
              ? new Date(snapshot.reset_at).toISOString()
              : undefined,
            updated_at: sql`now()`,
          },
        });
    },
  };
}
