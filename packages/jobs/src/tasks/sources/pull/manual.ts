import type { z } from "zod";

import { getDb } from "@jobs/init";
import { logger, schemaTask } from "@jobs/schema-task";
import { oneOffIngestSchema } from "@jobs/schema";
import { createRawItemQueries, createSourceQueries } from "@zeke/db/queries";

import { canonicalizeUrl } from "../../../utils/url/canonicalizeUrl";
import { fetchContent } from "../enrich/fetch-content";

export const ingestOneOff = schemaTask({
  id: "ingest-oneoff",
  schema: oneOffIngestSchema,
  queue: {
    concurrencyLimit: 2,
  },
  run: async (
    { url, requestedBy }: z.infer<typeof oneOffIngestSchema>,
    { logger, run },
  ) => {
    const db = getDb();
    const sourceQueries = createSourceQueries(db);
    const rawItemQueries = createRawItemQueries(db);

    const normalizedUrl = canonicalizeUrl(url);
    const domain = safeHostname(normalizedUrl);
    const sourceId = await sourceQueries.getOrCreateManualSource(
      "manual",
      domain,
      normalizedUrl,
    );

    const rawItemId = await rawItemQueries.upsertRawItem({
      source_id: sourceId,
      external_id: normalizedUrl,
      url: normalizedUrl,
      kind: "article",
      metadata: {
        src: "manual",
        requestedBy,
      },
    });

    if (!rawItemId) {
      logger.info("ingest_oneoff_duplicate", {
        url: normalizedUrl,
        requestedBy,
        runId: run.id,
      });
      return;
    }

    await fetchContent.trigger({ rawItemIds: [rawItemId] });

    logger.info("ingest_oneoff_enqueued", {
      url: normalizedUrl,
      requestedBy,
      rawItemId,
      runId: run.id,
    });
  },
});

function safeHostname(input: string): string | null {
  try {
    return new URL(input).hostname;
  } catch {
    return null;
  }
}
