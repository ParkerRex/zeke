import { eq, sql } from "drizzle-orm";
import type { Database } from "@db/client";
import { rawItems } from "@db/schema";

export function createRawItemQueries(db: Database) {
	return {
		/**
		 * Upsert a raw item (discovery) into the database
		 */
		async upsertRawItem(params: {
			source_id: string;
			external_id: string;
			url: string;
			title?: string | null;
			kind?: string | null;
			status?: string | null;
			published_at?: string | null;
			metadata?: Record<string, unknown>;
		}): Promise<string | null> {
			const {
				source_id,
				external_id,
				url,
				title,
				kind,
				status,
				published_at,
				metadata,
			} = params;

			const result = await db
				.insert(rawItems)
				.values({
					source_id,
					external_id,
					url,
					title: title ?? undefined,
					kind: kind ?? "article",
					status: status ?? "pending",
					published_at: published_at ?? undefined,
					metadata: metadata ?? undefined,
				})
				.onConflictDoNothing({
					target: [rawItems.source_id, rawItems.external_id],
				})
				.returning({ id: rawItems.id });

			return result[0]?.id ?? null;
		},

		/**
		 * Find raw items by their IDs
		 */
		async findRawItemsByIds(ids: string[]): Promise<
			Array<{
				id: string;
				url: string | null;
				title: string | null;
				kind: string | null;
				metadata: unknown;
			}>
		> {
			if (!ids.length) {
				return [];
			}

			const results = await db
				.select({
					id: rawItems.id,
					url: rawItems.url,
					title: rawItems.title,
					kind: rawItems.kind,
					metadata: rawItems.metadata,
				})
				.from(rawItems)
				.where(sql`${rawItems.id} = any(${ids}::uuid[])`);

			return results;
		},

		/**
		 * Get raw items by source ID
		 */
		async getRawItemsBySourceId(sourceId: string) {
			return await db
				.select()
				.from(rawItems)
				.where(eq(rawItems.source_id, sourceId));
		},

		/**
		 * Update raw item status
		 */
		async updateRawItemStatus(id: string, status: string) {
			await db
				.update(rawItems)
				.set({
					status,
					updated_at: sql`now()`,
				})
				.where(eq(rawItems.id, id));
		},
	};
}
