import { logger, schemaTask } from "@trigger.dev/sdk";
import type { z } from "zod";

import { getDb } from "@jobs/init";
import { ingestSourceSchema } from "@jobs/schema";
import { createRawItemQueries, createSourceQueries } from "@zeke/db/queries";
import { createEngineClient } from "@zeke/engine-client";

import { chunk } from "../../../utils/array/chunk";
import { fetchContent } from "../enrich/fetch-content";

/**
 * Ingests videos from a YouTube channel source
 * Uses the Engine API to fetch channel info and latest videos
 */
export const ingestYouTubeChannel = schemaTask({
  id: "ingest-youtube-channel",
  schema: ingestSourceSchema,
  queue: {
    concurrencyLimit: 3, // Respect YouTube API quotas
  },
  run: async (
    { sourceId, reason }: z.infer<typeof ingestSourceSchema>,
    { ctx },
  ) => {
    const db = getDb();
    const sourcesQueries = createSourceQueries(db);
    const rawItemQueries = createRawItemQueries(db);
    const engineClient = createEngineClient();

    const source = await sourcesQueries.getSourceById(sourceId);
    if (!source) {
      logger.warn("ingest_youtube_source_missing", {
        sourceId,
        reason,
        runId: ctx.run.id,
      });
      return;
    }

    if (source.type !== "youtube_channel") {
      logger.info("ingest_youtube_source_skipped", {
        sourceId,
        reason,
        type: source.type,
        message: "Only YouTube channel sources are supported",
        runId: ctx.run.id,
      });
      return;
    }

    if (!source.url) {
      logger.warn("ingest_youtube_source_no_url", {
        sourceId,
        reason,
        runId: ctx.run.id,
      });
      return;
    }

    let seen = 0;
    let inserted = 0;
    const newRawItemIds: string[] = [];

    try {
      // Get channel info from Engine
      const channelInfo = await engineClient.getSourceInfo(source.url);

      // For now, we'll fetch the channel's latest uploads via search
      // In a real implementation, you'd parse the uploads playlist from metadata
      const recentVideos = channelInfo.metadata.recentVideos || [];

      if (!Array.isArray(recentVideos) || recentVideos.length === 0) {
        logger.info("ingest_youtube_no_videos", {
          sourceId,
          channelName: channelInfo.name,
          runId: ctx.run.id,
        });
        return;
      }

      for (const videoUrl of recentVideos) {
        try {
          // Ingest each video via Engine
          const videoData = await engineClient.ingestContent(videoUrl);

          seen += 1;

          // Create rawItem entry
          const rawItemData = {
            source_id: sourceId,
            external_id: videoData.id,
            kind: "video" as const,
            title: videoData.title,
            url: videoData.url,
            status: "pending" as const,
            published_at: videoData.publishedAt.toISOString(),
            metadata: {
              duration: videoData.duration,
              sourceType: videoData.sourceType,
              contentType: videoData.contentType,
              author: videoData.author,
              ...videoData.metadata,
            },
          };

          const newId = await rawItemQueries.upsertRawItem(rawItemData);
          if (newId) {
            inserted += 1;
            newRawItemIds.push(newId);
          }
        } catch (videoError) {
          logger.warn("ingest_youtube_video_failed", {
            sourceId,
            videoUrl,
            error: videoError instanceof Error ? videoError.message : String(videoError),
            runId: ctx.run.id,
          });
          // Continue with next video
        }
      }

      // Trigger content enrichment for new items
      if (newRawItemIds.length) {
        for (const batch of chunk(newRawItemIds, 10)) {
          await fetchContent.trigger({ rawItemIds: batch });
        }
      }

      // Update source health
      await sourcesQueries.upsertSourceHealth(sourceId, "ok", null);

      logger.info("ingest_youtube_success", {
        sourceId,
        channelName: channelInfo.name,
        reason,
        runId: ctx.run.id,
        seen,
        inserted,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await sourcesQueries.upsertSourceHealth(sourceId, "error", errorMessage);

      logger.error("ingest_youtube_error", {
        sourceId,
        reason,
        runId: ctx.run.id,
        error: errorMessage,
      });

      throw error;
    }
  },
});