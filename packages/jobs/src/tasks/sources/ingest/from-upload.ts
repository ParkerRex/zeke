import { randomUUID } from "node:crypto";

import type { z } from "zod";

import { getDb } from "@jobs/init";
import { logger, schemaTask } from "@jobs/schema-task";
import { ingestUploadSchema } from "@jobs/schema";
import {
  createContentQueries,
  createRawItemQueries,
  createSourceQueries,
  createStoryQueries,
} from "@zeke/db/queries";

import { chunk } from "../../../utils/array/chunk";
import { hashText } from "../../../utils/url/hashText";
import { analyzeStory } from "../../insights/generate";
import { fetchContent } from "../enrich/fetch-content";

const UPLOAD_BATCH_SIZE = 20;

export const ingestFromUpload = schemaTask({
  id: "ingest-from-upload",
  schema: ingestUploadSchema,
  queue: {
    concurrencyLimit: 2,
  },
  run: async (
    { sourceId, items, uploadedBy }: z.infer<typeof ingestUploadSchema>,
    { logger, run },
  ) => {
    const db = getDb();
    const sourceQueries = createSourceQueries(db);
    const rawItemQueries = createRawItemQueries(db);
    const contentQueries = createContentQueries(db);
    const storyQueries = createStoryQueries(db);

    const source = await sourceQueries.getSourceById(sourceId);
    if (!source) {
      logger.error("ingest_upload_missing_source", { sourceId });
      throw new Error("Source not found");
    }

    const pendingFetch: string[] = [];
    let processed = 0;
    let createdStories = 0;

    for (const item of items) {
      const externalId = item.externalId || item.url || randomUUID();
      const url = item.url ?? externalId;
      const metadata = {
        ...(item.metadata ?? {}),
        src: "upload",
        uploadedBy,
        uploadedAt: new Date().toISOString(),
      };

      const rawItemId = await rawItemQueries.upsertRawItem({
        source_id: sourceId,
        external_id: externalId,
        url,
        title: item.title ?? undefined,
        metadata,
      });

      if (!rawItemId) {
        logger.info("ingest_upload_duplicate", { sourceId, externalId });
        continue;
      }

      processed += 1;

      if (item.text?.trim()) {
        const contentHash = hashText(item.text);
        const contentId = await contentQueries.insertContent({
          raw_item_id: rawItemId,
          text_body: item.text,
          html_url: item.url ?? undefined,
          content_hash: contentHash,
        });

        const existingStoryId =
          await storyQueries.findStoryIdByContentHash(contentHash);
        const storyId =
          existingStoryId ??
          (await storyQueries.insertStory({
            content_id: contentId,
            title: item.title ?? null,
            primary_url: item.url ?? null,
            kind: source.type ?? "article",
            primary_source_id: sourceId,
          }));

        await analyzeStory.trigger({ storyId, trigger: "auto" });
        await rawItemQueries.updateRawItemStatus(rawItemId, "processed");
        createdStories += existingStoryId ? 0 : 1;
      } else if (item.url) {
        pendingFetch.push(rawItemId);
      }
    }

    for (const batch of chunk(pendingFetch, UPLOAD_BATCH_SIZE)) {
      await fetchContent.trigger({ rawItemIds: batch });
    }

    logger.info("ingest_upload_complete", {
      sourceId,
      processed,
      pendingFetch: pendingFetch.length,
      createdStories,
      runId: run.id,
    });
  },
});
