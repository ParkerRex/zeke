import { logger, schedules, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

import { getDb } from "@jobs/init";
import type { ingestSourceSchema } from "@jobs/schema";
import { createSourceQueries } from "@zeke/db/queries";

import { chunk } from "../../../utils/array/chunk";
import { ingestSource } from "../ingest/from-feed";

const ingestPullInternalSchema = z.object({
  reason: z.enum(["schedule", "manual"]).default("schedule"),
});

type IngestPullInternalPayload = z.infer<typeof ingestPullInternalSchema>;

export const ingestPull = schemaTask({
  id: "ingest-pull",
  schema: ingestPullInternalSchema,
  queue: {
    concurrencyLimit: 1,
  },
  run: async ({ reason }: IngestPullInternalPayload, { ctx }) => {
    const db = getDb();
    const sourcesQueries = createSourceQueries(db);

    const sources = await sourcesQueries.getRssSources();
    type RssSource = (typeof sources)[number];

    if (!sources.length) {
      logger.info("ingest_pull_no_sources", { reason, runId: ctx.run.id });
      return;
    }

    logger.info("ingest_pull_start", {
      reason,
      runId: ctx.run.id,
      sourceCount: sources.length,
    });

    for (const batch of chunk<RssSource>(sources, 10)) {
      await Promise.all(
        batch.map((source) =>
          ingestSource.trigger({
            sourceId: source.id,
            reason,
          } satisfies z.infer<typeof ingestSourceSchema>),
        ),
      );
    }

    logger.info("ingest_pull_enqueued", {
      reason,
      runId: ctx.run.id,
      sourceCount: sources.length,
    });
  },
});

export async function ensureIngestPullSchedule() {
  const scheduleKey = "ingest-pull-5m";
  await schedules.create({
    task: ingestPull.id,
    cron: "*/5 * * * *",
    timezone: process.env.JOBS_CRON_TZ || "UTC",
    deduplicationKey: scheduleKey,
    externalId: scheduleKey,
  });
  logger.info("ingest_pull_schedule_ensured", { scheduleKey });
}
