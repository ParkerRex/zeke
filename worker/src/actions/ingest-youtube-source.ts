import type PgBoss from "pg-boss";
import { upsertRawItem, upsertSourceHealth } from "../db.js";
import { buildRawItemYouTube } from "../extract/build-raw-item-youtube.js";
import type { YouTubeVideo } from "../lib/youtube/types.js";
import { log } from "../log.js";
import type { SourceBase } from "../types/sources.js";
import { fetchYouTubeChannelVideos } from "./fetch-youtube-channel-videos.js";
import { fetchYouTubeSearchVideos } from "./fetch-youtube-search-videos.js";
import { resolveYouTubeUploadsId } from "./resolve-youtube-uploads-id.js";

const DEFAULT_MAX_VIDEOS = 10;
const DAYS_LOOKBACK = 7;
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;
const MS_PER_DAY =
  HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND;

export async function ingestYouTubeSource(boss: PgBoss, src: SourceBase) {
  const t0 = Date.now();
  log("ingest_source_start", {
    comp: "ingest",
    kind: src.kind,
    source_id: src.id,
    url: src.url,
    name: src.name,
  });

  let seen = 0;
  let newCount = 0;
  let errorMessage: string | null = null;

  try {
    const videos = await getVideosForSource(src);
    const result = await processVideos(boss, src, videos);
    seen = result.seen;
    newCount = result.newCount;

    log("ingest_source_done", {
      comp: "ingest",
      kind: src.kind,
      source_id: src.id,
      videos_seen: seen,
      videos_new: newCount,
      duration_ms: Date.now() - t0,
    });
  } catch (err) {
    errorMessage = String(err);
    log(
      "ingest_source_error",
      {
        comp: "ingest",
        kind: src.kind,
        source_id: src.id,
        url: src.url,
        err: errorMessage,
      },
      "error"
    );
  } finally {
    try {
      await upsertSourceHealth(src.id, errorMessage ? "error" : "ok", errorMessage);
    } catch (error) {
      log("source_health_update_error", { error: String(error) }, "error");
    }
  }
}

async function getVideosForSource(src: SourceBase): Promise<YouTubeVideo[]> {
  const metadata = (src.metadata ?? {}) as Record<string, unknown>;
  if (src.kind === "youtube_channel") {
    const uploadsPlaylistId = await resolveYouTubeUploadsId({
      sourceId: src.id,
      url: src.url || undefined,
      name: src.name || undefined,
      currentUploadsPlaylistId:
        (metadata.upload_playlist_id as string | undefined) || undefined,
    });
    const maxResults = parsePositiveInt(
      (metadata as Record<string, unknown>).max_videos_per_run,
      DEFAULT_MAX_VIDEOS
    );
    const publishedAfter = new Date(
      Date.now() - DAYS_LOOKBACK * MS_PER_DAY
    ).toISOString();
    return fetchYouTubeChannelVideos({
      uploadsPlaylistId,
      maxResults,
      publishedAfter,
    });
  }

  if (src.kind === "youtube_search") {
    const maxResults = parsePositiveInt(metadata.max_results, DEFAULT_MAX_VIDEOS);
    const publishedAfter =
      parseOptionalString(metadata.published_after) ||
      new Date(Date.now() - DAYS_LOOKBACK * MS_PER_DAY).toISOString();
    const order = parseOrder(metadata.order);
    const duration = parseDuration(metadata.duration);
    const query = typeof metadata.query === "string" ? metadata.query : "";
    if (!query) {
      throw new Error("No query in metadata");
    }
    return fetchYouTubeSearchVideos({
      query,
      maxResults,
      publishedAfter,
      order,
      duration,
    });
  }

  throw new Error(`unsupported_kind: ${src.kind}`);
}

async function processVideos(
  boss: PgBoss,
  src: SourceBase,
  videos: YouTubeVideo[],
): Promise<{ seen: number; newCount: number }> {
  let seen = 0;
  let newCount = 0;
  for (const v of videos) {
    seen++;
    const id = await upsertRawItem(buildRawItemYouTube(v, src));
    if (id) {
      await boss.send("ingest:fetch-youtube-content", {
        rawItemIds: [id],
        videoId: v.videoId,
        sourceKind: src.kind,
      });
      newCount++;
    }
  }
  return { seen, newCount };
}

type SearchOrder = "date" | "relevance" | "viewCount";
type SearchDuration = "short" | "medium" | "long" | "any" | undefined;

function parseOrder(value: unknown): SearchOrder {
  const allowed: SearchOrder[] = ["date", "relevance", "viewCount"];
  return typeof value === "string" && (allowed as string[]).includes(value)
    ? (value as SearchOrder)
    : "relevance";
}

function parseDuration(value: unknown): SearchDuration {
  const allowed = new Set(["short", "medium", "long", "any"]);
  return typeof value === "string" && allowed.has(value)
    ? (value as SearchDuration)
    : undefined;
}

function parsePositiveInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }
  return fallback;
}

function parseOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}
