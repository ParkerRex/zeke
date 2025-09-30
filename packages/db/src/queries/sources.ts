import { and, eq, inArray, or, sql } from "drizzle-orm";
import type { Database } from "@db/client";
import { sourceHealth, sources } from "@db/schema";

export function createSourceQueries(db: Database) {
  return {
    /**
     * Get RSS sources
     */
    async getRssSources() {
      return await db
        .select({
          id: sources.id,
          type: sources.type,
          url: sources.url,
          name: sources.name,
        })
        .from(sources)
        .where(
          and(
            eq(sources.type, "rss"),
            sql`${sources.url} is not null`,
            sql`coalesce(${sources.is_active}, true)`,
          ),
        );
    },

    /**
     * Get YouTube sources
     */
    async getYouTubeSources() {
      return await db
        .select({
          id: sources.id,
          type: sources.type,
          url: sources.url,
          name: sources.name,
          metadata: sources.metadata,
        })
        .from(sources)
        .where(
          and(
            inArray(sources.type, ["youtube_channel", "youtube_search"]),
            or(
              sql`${sources.url} is not null`,
              eq(sources.type, "youtube_search"),
            ),
            sql`coalesce(${sources.is_active}, true)`,
          ),
        );
    },

    /**
     * Get source by ID
     */
    async getSourceById(sourceId: string) {
      const result = await db
        .select()
        .from(sources)
        .where(eq(sources.id, sourceId))
        .limit(1);

      return result[0] ?? null;
    },

    /**
     * Get or create a manual source
     */
    async getOrCreateManualSource(
      type: string,
      name?: string | null,
      url?: string | null,
    ): Promise<string> {
      // Try to find existing source
      const existing = await db
        .select({ id: sources.id })
        .from(sources)
        .where(
          and(
            eq(sources.type, type),
            sql`coalesce(${sources.url},'') = coalesce(${url ?? null},'')`,
          ),
        )
        .limit(1);

      if (existing[0]?.id) {
        return existing[0].id;
      }

      // Create new source
      const result = await db
        .insert(sources)
        .values({
          type,
          name: name ?? undefined,
          url: url ?? undefined,
          is_active: true,
        })
        .returning({ id: sources.id });

      return result[0].id;
    },

    /**
     * Update source metadata
     */
    async updateSourceMetadata(
      sourceId: string,
      patch: Record<string, unknown>,
    ) {
      await db
        .update(sources)
        .set({
          metadata: sql`coalesce(${sources.metadata}, '{}'::jsonb) || ${JSON.stringify(patch)}::jsonb`,
          updated_at: sql`now()`,
        })
        .where(eq(sources.id, sourceId));
    },

    /**
     * Upsert source health
     */
    async upsertSourceHealth(
      sourceId: string,
      status: "ok" | "warn" | "error",
      message?: string | null,
    ) {
      await db
        .insert(sourceHealth)
        .values({
          source_id: sourceId,
          status: status as any,
          last_success_at: status === "ok" ? sql`now()` : undefined,
          last_error_at: status === "error" ? sql`now()` : undefined,
          message: message ?? undefined,
          updated_at: sql`now()`,
        })
        .onConflictDoUpdate({
          target: sourceHealth.source_id,
          set: {
            status: status as any,
            last_success_at:
              status === "ok"
                ? sql`now()`
                : sql`${sourceHealth.last_success_at}`,
            last_error_at:
              status === "error"
                ? sql`now()`
                : sql`${sourceHealth.last_error_at}`,
            message: message ?? undefined,
            updated_at: sql`now()`,
          },
        });
    },
  };
}
