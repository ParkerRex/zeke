import { eq, sql } from "drizzle-orm";
import type { Database } from "@db/client";
import { jobMetrics, platformQuota } from "@db/schema";

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

		/**
		 * Upsert job metrics
		 */
		async upsertJobMetrics(
			rows: Array<{ name: string; state: string; count: number }>,
		) {
			if (!rows.length) {
				return;
			}

			// Use Drizzle's batch insert with onConflictDoUpdate
			const values = rows.map((r) => ({
				name: r.name,
				state: r.state,
				count: r.count,
				updated_at: sql`now()`,
			}));

			await db
				.insert(jobMetrics)
				.values(values)
				.onConflictDoUpdate({
					target: [jobMetrics.name, jobMetrics.state],
					set: {
						count: sql`excluded.count`,
						updated_at: sql`now()`,
					},
				});
		},

		/**
		 * Get job metrics by name pattern
		 */
		async getJobMetricsByPattern(namePattern: string) {
			return await db
				.select()
				.from(jobMetrics)
				.where(sql`${jobMetrics.name} like ${namePattern}`);
		},
	};
}
