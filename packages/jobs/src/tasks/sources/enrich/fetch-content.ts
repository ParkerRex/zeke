import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import type { z } from "zod";

import { getDb } from "@jobs/init";
import { logger, schemaTask } from "@jobs/schema-task";
import { fetchContentSchema } from "@jobs/schema";
import {
  createContentQueries,
  createRawItemQueries,
  createStoryQueries,
} from "@zeke/db/queries";

import { fetchWithTimeout } from "../../../utils/http/fetchWithTimeout";
import { canonicalizeUrl } from "../../../utils/url/canonicalizeUrl";
import { hashText } from "../../../utils/url/hashText";
import { analyzeStory } from "../../insights/generate";

const FETCH_TIMEOUT_MS = 15_000;

export const fetchContent = schemaTask({
  id: "fetch-content",
  schema: fetchContentSchema,
  queue: {
    concurrencyLimit: 3,
  },
  run: async (
    { rawItemIds }: z.infer<typeof fetchContentSchema>,
    { logger, run },
  ) => {
    const db = getDb();
    const rawItemQueries = createRawItemQueries(db);
    const contentQueries = createContentQueries(db);
    const storyQueries = createStoryQueries(db);

    const rows = await rawItemQueries.findRawItemsByIds(rawItemIds);
    if (!rows.length) {
      logger.info("fetch_content_no_rows", { rawItemIds, runId: run.id });
      return;
    }

    for (const row of rows) {
      if (!row.url) {
        logger.warn("fetch_content_missing_url", { rawItemId: row.id });
        continue;
      }

      const startedAt = Date.now();
      try {
        const response = await fetchWithTimeout(
          row.url,
          { redirect: "follow" },
          FETCH_TIMEOUT_MS,
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const finalUrl = canonicalizeUrl(response.url || row.url);
        const html = await response.text();
        const dom = new JSDOM(html, { url: finalUrl });
        const reader = new Readability(dom.window.document);
        const parsed = reader.parse();
        const text = parsed?.textContent?.trim();
        if (!text) {
          throw new Error("no_text_extracted");
        }

        const contentHash = hashText(text);
        const contentId = await contentQueries.insertContent({
          raw_item_id: row.id,
          text_body: text,
          html_url: finalUrl,
          content_hash: contentHash,
        });

        const metadata = (row.metadata ?? null) as Record<
          string,
          unknown
        > | null;
        const publishedAt =
          typeof metadata?.pubDate === "string" ? metadata.pubDate : undefined;

        const existingStoryId =
          await storyQueries.findStoryIdByContentHash(contentHash);
        const storyId =
          existingStoryId ??
          (await storyQueries.insertStory({
            content_id: contentId,
            title: parsed?.title ?? row.title ?? null,
            primary_url: finalUrl,
            kind: row.kind ?? "article",
            published_at: publishedAt,
          }));

        await analyzeStory.trigger({ storyId, trigger: "auto" });

        await rawItemQueries.updateRawItemStatus(row.id, "processed");

        logger.info("fetch_content_success", {
          rawItemId: row.id,
          storyId,
          contentId,
          elapsedMs: Date.now() - startedAt,
        });
      } catch (error) {
        logger.error("fetch_content_error", {
          rawItemId: row.id,
          error,
        });
      }
    }
  },
});
