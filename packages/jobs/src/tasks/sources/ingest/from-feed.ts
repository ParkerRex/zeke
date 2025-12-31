import type { z } from "zod";

import { getDb } from "@jobs/init";
import { logger, schemaTask } from "@jobs/schema-task";
import { ingestSourceSchema } from "@jobs/schema";
import { createRawItemQueries, createSourceQueries } from "@zeke/db/queries";

import { chunk } from "../../../utils/array/chunk";
import { fetchWithTimeout } from "../../../utils/http/fetchWithTimeout";
import { buildDiscoveryArticle } from "../../../utils/rss/buildDiscoveryArticle";
import { normalizeRssItem } from "../../../utils/rss/normalizeRssItem";
import { parseRssFeed } from "../../../utils/rss/parseRssFeed";
import { fetchContent } from "../enrich/fetch-content";

const FETCH_TIMEOUT_MS = 15_000;

export const ingestSource = schemaTask({
  id: "ingest-source",
  schema: ingestSourceSchema,
  queue: {
    concurrencyLimit: 5,
  },
  run: async (
    { sourceId, reason }: z.infer<typeof ingestSourceSchema>,
    { logger, run },
  ) => {
    const db = getDb();
    const sourcesQueries = createSourceQueries(db);
    const rawItemQueries = createRawItemQueries(db);

    const source = await sourcesQueries.getSourceById(sourceId);
    if (!source) {
      logger.warn("ingest_source_missing", {
        sourceId,
        reason,
        runId: run.id,
      });
      return;
    }

    if (source.type !== "rss") {
      logger.info("ingest_source_skipped", {
        sourceId,
        reason,
        type: source.type,
        message: "Only RSS sources are supported",
        runId: run.id,
      });
      return;
    }

    if (!source.url) {
      logger.warn("ingest_source_no_url", {
        sourceId,
        reason,
        runId: run.id,
      });
      return;
    }

    let seen = 0;
    let inserted = 0;
    const newRawItemIds: string[] = [];

    try {
      const response = await fetchWithTimeout(
        source.url,
        { redirect: "follow" },
        FETCH_TIMEOUT_MS,
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const xml = await response.text();
      const items = parseRssFeed(xml);

      for (const item of items) {
        const normalized = normalizeRssItem(item as Record<string, unknown>);
        if (!normalized) {
          continue;
        }
        seen += 1;

        const discovery = buildDiscoveryArticle(normalized, sourceId);
        const newId = await rawItemQueries.upsertRawItem(discovery);
        if (newId) {
          inserted += 1;
          newRawItemIds.push(newId);
        }
      }

      if (newRawItemIds.length) {
        for (const batch of chunk(newRawItemIds, 20)) {
          await fetchContent.trigger({ rawItemIds: batch });
        }
      }

      await sourcesQueries.upsertSourceHealth(sourceId, "ok", null);

      logger.info("ingest_source_success", {
        sourceId,
        reason,
        itemsSeen: seen,
        itemsInserted: inserted,
        runId: run.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await sourcesQueries.upsertSourceHealth(
        sourceId,
        "error",
        message.slice(0, 512),
      );
      logger.error("ingest_source_error", {
        sourceId,
        reason,
        error,
        runId: run.id,
      });
      throw error;
    }
  },
});
