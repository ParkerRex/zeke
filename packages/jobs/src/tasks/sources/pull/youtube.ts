import { logger, schedules, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

import { getDb } from "@jobs/init";
import type { ingestSourceSchema } from "@jobs/schema";
import { createSourceQueries } from "@zeke/db/queries";
import { createEngineClient } from "@zeke/engine-client";

import { chunk } from "../../../utils/array/chunk";
import { ingestYouTubeChannel } from "../ingest/from-youtube";

const ingestPullYouTubeSchema = z.object({
  reason: z.enum(["schedule", "manual"]).default("schedule"),
});

type IngestPullYouTubePayload = z.infer<typeof ingestPullYouTubeSchema>;

/**
 * Main job to pull from all YouTube channel sources
 * Runs on a schedule (every 6 hours) to check for new videos
 */
export const ingestPullYouTube = schemaTask({
  id: "ingest-pull-youtube",
  schema: ingestPullYouTubeSchema,
  queue: {
    concurrencyLimit: 1,
  },
  run: async ({ reason }: IngestPullYouTubePayload, { ctx }) => {
    const db = getDb();
    const sourcesQueries = createSourceQueries(db);

    // Get all YouTube channel sources that are active
    const sources = await sourcesQueries.getYouTubeSources();
    type YouTubeSource = (typeof sources)[number];

    if (!sources.length) {
      logger.info("ingest_pull_youtube_no_sources", { reason, runId: ctx.run.id });
      return;
    }

    logger.info("ingest_pull_youtube_start", {
      reason,
      runId: ctx.run.id,
      sourceCount: sources.length,
    });

    // Process in batches of 5 to avoid rate limits
    for (const batch of chunk<YouTubeSource>(sources, 5)) {
      await Promise.all(
        batch.map((source) =>
          ingestYouTubeChannel.trigger({
            sourceId: source.id,
            reason,
          } satisfies z.infer<typeof ingestSourceSchema>),
        ),
      );
    }

    logger.info("ingest_pull_youtube_enqueued", {
      reason,
      runId: ctx.run.id,
      sourceCount: sources.length,
    });
  },
});

/**
 * Ensure the YouTube pull schedule is registered
 * Runs every 6 hours (4x/day) for high-priority channels
 */
export async function ensureYouTubePullSchedule() {
  const scheduleKey = "ingest-pull-youtube-6h";
  await schedules.create({
    task: ingestPullYouTube.id,
    cron: "0 */6 * * *", // Every 6 hours
    timezone: process.env.JOBS_CRON_TZ || "UTC",
    deduplicationKey: scheduleKey,
    externalId: scheduleKey,
  });
  logger.info("ingest_pull_youtube_schedule_ensured", { scheduleKey });
}
