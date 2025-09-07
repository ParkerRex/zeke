import type PgBoss from "pg-boss";
import { upsertRawItem, upsertSourceHealth } from "../db.js";
import { buildRawItemYouTube } from "../extract/build-raw-item-youtube.js";
import type { YouTubeVideo } from "../lib/youtube/types.js";
import { log } from "../log.js";
import { fetchYouTubeChannelVideos } from "./fetch-youtube-channel-videos.js";
import { fetchYouTubeSearchVideos } from "./fetch-youtube-search-videos.js";
import { resolveYouTubeUploadsId } from "./resolve-youtube-uploads-id.js";
import type { SourceBase } from "../types/sources.js";

const DEFAULT_MAX_VIDEOS = 10;
const DAYS_LOOKBACK = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function ingestYouTubeSource(boss: PgBoss, src: SourceBase) {
  const metadata = src.metadata || {};
  let videos: YouTubeVideo[] = [];
  let seen = 0;
  let newCount = 0;
  const t0 = Date.now();
  log("ingest_source_start", {
    comp: "ingest",
    kind: src.kind,
    source_id: src.id,
    url: src.url,
    name: src.name,
  });

  try {
    if (src.kind === "youtube_channel") {
      const uploadsPlaylistId = await resolveYouTubeUploadsId({
        sourceId: src.id,
        url: src.url || undefined,
        name: src.name || undefined,
        currentUploadsPlaylistId:
          (metadata.upload_playlist_id as string | undefined) || undefined,
      });
      const maxResults = metadata.max_videos_per_run || DEFAULT_MAX_VIDEOS;
      const publishedAfter = new Date(
        Date.now() - DAYS_LOOKBACK * MS_PER_DAY
      ).toISOString();
      videos = await fetchYouTubeChannelVideos({
        uploadsPlaylistId,
        maxResults,
        publishedAfter,
      });
    } else if (src.kind === "youtube_search") {
      const maxResults = metadata.max_results || DEFAULT_MAX_VIDEOS;
      const publishedAfter =
        metadata.published_after ||
        new Date(Date.now() - DAYS_LOOKBACK * MS_PER_DAY).toISOString();
      const order = (metadata.order as any) || "relevance";
      const duration = (metadata.duration as any) || undefined;
      const query = metadata.query as string;
      if (!query) throw new Error("No query in metadata");
      videos = await fetchYouTubeSearchVideos({
        query,
        maxResults,
        publishedAfter,
        order,
        duration,
      });
    } else {
      throw new Error(`unsupported_kind: ${src.kind}`);
    }

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

    await upsertSourceHealth(src.id, "ok", null);
    log("ingest_source_done", {
      comp: "ingest",
      kind: src.kind,
      source_id: src.id,
      videos_seen: seen,
      videos_new: newCount,
      duration_ms: Date.now() - t0,
    });
  } catch (err) {
    log(
      "ingest_source_error",
      {
        comp: "ingest",
        kind: src.kind,
        source_id: src.id,
        url: src.url,
        err: String(err),
      },
      "error"
    );
    try {
      await upsertSourceHealth(src.id, "error", String(err));
    } catch {}
  }
}
