/**
 * Job Orchestrator - Central hub for triggering all jobs consistently
 *
 * This module eliminates the confusion between HTTP endpoints and queue jobs
 * by providing a single, consistent way to trigger any job in the system.
 *
 * Key principles:
 * - All jobs are triggered through this orchestrator
 * - HTTP endpoints only call orchestrator methods
 * - Scheduled jobs only call orchestrator methods
 * - No business logic duplication
 */

import type PgBoss from "pg-boss";
import { log } from "../log.js";

export interface JobOrchestrator {
  // RSS Operations
  triggerRssIngest(): Promise<void>;
  triggerRssSourceIngest(sourceId: string): Promise<void>;

  // YouTube Operations
  triggerYouTubeIngest(): Promise<void>;
  triggerYouTubeSourceIngest(sourceId: string): Promise<void>;

  // Content Processing
  triggerContentExtraction(rawItemIds: string[]): Promise<void>;
  triggerYouTubeContentExtraction(data: YouTubeExtractionData): Promise<void>;

  // Analysis
  triggerStoryAnalysis(storyId: string): Promise<void>;

  // One-off Operations
  triggerOneOffIngest(urls: string[]): Promise<OneOffIngestResult[]>;
}

export interface YouTubeExtractionData {
  rawItemIds: string[];
  videoId: string;
  sourceKind: string;
}

export interface OneOffIngestResult {
  url: string;
  ok: boolean;
  raw_item_id?: string;
  error?: string;
  type: "youtube" | "article";
}

/**
 * Creates a job orchestrator that provides consistent job triggering
 */
export function createJobOrchestrator(boss: PgBoss): JobOrchestrator {
  return {
    async triggerRssIngest(): Promise<void> {
      log("orchestrator_trigger", { job: "rss_ingest", trigger: "manual" });
      await boss.send("ingest:pull", { source: "rss" });
    },

    async triggerRssSourceIngest(sourceId: string): Promise<void> {
      log("orchestrator_trigger", {
        job: "rss_source_ingest",
        sourceId,
        trigger: "manual",
      });
      await boss.send("ingest:source", { sourceId, kind: "rss" });
    },

    async triggerYouTubeIngest(): Promise<void> {
      log(
        "orchestrator_trigger_skipped",
        { job: "youtube_ingest", trigger: "manual", reason: "youtube_disabled" },
        "warn",
      );
    },

    async triggerYouTubeSourceIngest(sourceId: string): Promise<void> {
      log(
        "orchestrator_trigger_skipped",
        {
          job: "youtube_source_ingest",
          sourceId,
          trigger: "manual",
          reason: "youtube_disabled",
        },
        "warn",
      );
    },

    async triggerContentExtraction(rawItemIds: string[]): Promise<void> {
      log("orchestrator_trigger", {
        job: "content_extraction",
        count: rawItemIds.length,
      });
      await boss.send("ingest:fetch-content", { rawItemIds });
    },

    async triggerYouTubeContentExtraction(
      data: YouTubeExtractionData,
    ): Promise<void> {
      log(
        "orchestrator_trigger_skipped",
        {
          job: "youtube_content_extraction",
          videoId: data.videoId,
          reason: "youtube_disabled",
        },
        "warn",
      );
    },

    async triggerStoryAnalysis(storyId: string): Promise<void> {
      log("orchestrator_trigger", { job: "story_analysis", storyId });
      await boss.send("analyze:llm", { storyId });
    },

    async triggerOneOffIngest(urls: string[]): Promise<OneOffIngestResult[]> {
      log("orchestrator_trigger", { job: "oneoff_ingest", count: urls.length });

      const results: OneOffIngestResult[] = [];

      for (const url of urls) {
        const kind = classifyUrl(url);
        if (kind === "youtube") {
          results.push(await processYouTubeUrl(url, boss));
        } else {
          results.push(await processArticleUrl(url, boss));
        }
      }

      return results;
    },
  };
}

// Helper functions (moved from engine.ts)
function classifyUrl(url: string): "youtube" | "article" {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname || "";
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      return "youtube";
    }
    return "article";
  } catch {
    return "article";
  }
}

function extractYouTubeVideoId(url: string): string {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.replace("/", "");
    }
    if (parsedUrl.pathname.startsWith("/shorts/")) {
      return parsedUrl.pathname.split("/")[2] || "";
    }
    return parsedUrl.searchParams.get("v") || "";
  } catch {
    return "";
  }
}

async function processYouTubeUrl(
  url: string,
  _boss: PgBoss,
): Promise<OneOffIngestResult> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    return { url, ok: false, error: "no_video_id", type: "youtube" };
  }

  log(
    "youtube_manual_ingest_disabled",
    { url, videoId, reason: "google_cloud_integration_removed" },
    "warn",
  );

  return {
    url,
    ok: false,
    error: "youtube_ingest_disabled",
    type: "youtube",
  };
}

async function processArticleUrl(
  url: string,
  boss: PgBoss,
): Promise<OneOffIngestResult> {
  const { getOrCreateManualSource, upsertDiscovery } = await import("../db.js");

  let domain: string | null = null;
  try {
    domain = new URL(url).hostname || null;
  } catch {
    domain = null;
  }

  const sourceId = await getOrCreateManualSource(
    "manual",
    domain,
    domain,
    null,
  );

  const rawItemId = await upsertDiscovery({
    source_id: sourceId,
    external_id: url,
    url,
    title: null,
    kind: "article",
    metadata: { src: "manual" },
  });

  if (rawItemId) {
    await boss.send("ingest:fetch-content", { rawItemIds: [rawItemId] });
    return { url, ok: true, raw_item_id: rawItemId, type: "article" };
  }

  return { url, ok: false, error: "duplicate", type: "article" };
}
