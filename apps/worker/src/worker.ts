import "dotenv/config";
import type { ConnectionOptions as TlsConnectionOptions } from "node:tls";
import express from "express";
import PgBoss from "pg-boss";
import { analyzeStory } from "./actions/analyze-story.js";
import { extractArticle } from "./actions/extract-article.js";
import { extractYouTubeContent } from "./actions/extract-youtube-content.js";
// YouTube ingestion uses actions directly below
import { log } from "./log.js";

const DATABASE_URL: string = process.env.DATABASE_URL ?? "";
const BOSS_SCHEMA = process.env.BOSS_SCHEMA || "pgboss";
const CRON_TZ = process.env.BOSS_CRON_TZ || "UTC";
const BOSS_MIGRATE = process.env.BOSS_MIGRATE !== "false";
// Numeric tuning knobs
const WORKER_MAX_CLIENTS = 2;
const HEARTBEAT_BATCH = 10;
const INGEST_PULL_BATCH = 5;
const CONTENT_FETCH_BATCH = 5;
const YT_FETCH_BATCH = 2;
const DEFAULT_PREVIEW_LIMIT = 10;
const MAX_PREVIEW_LIMIT = 50;
const RETRY_DELAY_MS = 10_000;
const METRICS_INTERVAL_MS = 3000;
const DEFAULT_PORT = 8080;
// HTTP status codes
const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_SERVICE_UNAVAILABLE = 503;
// Use SSL only for non-local connections (local Supabase Postgres does not support TLS)
const USE_SSL = !(
  DATABASE_URL.includes("127.0.0.1") ||
  DATABASE_URL.includes("localhost") ||
  DATABASE_URL.includes("host.docker.internal")
);

if (!DATABASE_URL) {
  log("missing_env", { key: "DATABASE_URL" }, "error");
  process.exit(1);
}

// logging provided by ./log

let bossRef: PgBoss | null = null;

type FetchContentJobData = { rawItemIds: string[] };
type AnalyzeJobData = { storyId?: string };

// Discriminated results for one-off ingest endpoint
type YouTubeIngestResult =
  | { url: string; ok: true; raw_item_id: string; type: "youtube" }
  | { url: string; ok: false; error: string; type: "youtube" };

type ArticleIngestResult =
  | { url: string; ok: true; raw_item_id: string; type: "article" }
  | { url: string; ok: false; error: string; type: "article" };

// Helper: handle one ingest:pull job (reduces route complexity)
async function processIngestPullJob(
  boss: PgBoss,
  job: { id: string; data?: unknown }
) {
  const { source } = (job.data || {}) as { source?: string };
  log("ingest_pull_start", { jobId: job.id, source });
  if (source === "rss") {
    await handleRssIngest(boss);
  }
  if (source === "youtube") {
    await handleYouTubeIngest(boss);
  }
  await boss.complete("ingest:pull", job.id);
  log("ingest_pull_done", { jobId: job.id, source });
}

async function handleRssIngest(boss: PgBoss) {
  const { getRssSources } = await import("./db.js");
  const { ingestRssSource } = await import("./actions/ingest-rss-source.js");
  const sources = await getRssSources();
  for (const src of sources) {
    if (!src.url) {
      continue;
    }
    await ingestRssSource(boss, { id: src.id, url: src.url });
  }
}

function computeQuotaResetAt(now: Date, resetHour: number): Date {
  const resetAt = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    resetHour,
    0,
    0,
    0
  );
  if (resetAt.getTime() < now.getTime()) {
    resetAt.setDate(resetAt.getDate() + 1);
  }
  return resetAt;
}

async function handleYouTubeIngest(boss: PgBoss) {
  if (!process.env.YOUTUBE_API_KEY) {
    log("ingest_youtube_skipped", { reason: "missing_api_key" }, "warn");
    return;
  }
  const { getYouTubeSources, upsertPlatformQuota } = await import("./db.js");
  const { ingestYouTubeSource } = await import(
    "./actions/ingest-youtube-source.js"
  );
  const { quotaTracker } = await import("./utils/quota-tracker.js");
  const sources = await getYouTubeSources();
  log("ingest_youtube_start", {
    comp: "ingest",
    sourceCount: sources.length,
    quotaStatus: quotaTracker.checkQuotaStatus(),
  });
  for (const src of sources) {
    await ingestYouTubeSource(boss, src);
  }
  const status = quotaTracker.checkQuotaStatus();
  log("ingest_youtube_complete", {
    comp: "ingest",
    sourcesProcessed: sources.length,
    quotaUsed: status.used,
    quotaRemaining: status.remaining,
  });
  try {
    const resetHour = Number(process.env.YOUTUBE_QUOTA_RESET_HOUR || "0") || 0;
    const now = new Date();
    const resetAt = computeQuotaResetAt(now, resetHour);
    await upsertPlatformQuota("youtube", {
      limit: Number(process.env.YOUTUBE_QUOTA_LIMIT || "10000"),
      used: status.used,
      remaining: status.remaining,
      reset_at: resetAt.toISOString(),
    });
  } catch (e) {
    log("platform_quota_update_error", { error: String(e) }, "debug");
  }
}

async function initBoss() {
  const boss = new PgBoss({
    connectionString: DATABASE_URL,
    schema: BOSS_SCHEMA,
    ssl: USE_SSL
      ? ({ rejectUnauthorized: false } as TlsConnectionOptions)
      : false,
    application_name: "zeke-worker",
    max: WORKER_MAX_CLIENTS,
    migrate: BOSS_MIGRATE,
  });
  boss.on("error", (err) => log("boss_error", { err: String(err) }));

  await boss.start();
  log("boss_started", { schema: BOSS_SCHEMA, tz: CRON_TZ });

  await Promise.all([
    boss.createQueue("system:heartbeat"),
    boss.createQueue("ingest:pull"),
    boss.createQueue("ingest:fetch-content"),
    boss.createQueue("ingest:fetch-youtube-content"),
    boss.createQueue("analyze:llm"),
  ]);

  await boss.schedule(
    "system:heartbeat",
    "*/5 * * * *",
    { ping: "ok" },
    { tz: CRON_TZ }
  );
  await boss.schedule(
    "ingest:pull",
    "*/5 * * * *",
    { source: "rss" },
    { tz: CRON_TZ }
  );
  await boss.schedule(
    "ingest:pull",
    "*/15 * * * *",
    { source: "youtube" },
    { tz: CRON_TZ }
  );

  // Kick off an immediate run on startup for faster local feedback
  try {
    await boss.send("ingest:pull", { source: "rss" });
    await boss.send("ingest:pull", { source: "youtube" });
    log("ingest_bootstrap_queued", { when: "startup" });
  } catch (e) {
    log("ingest_bootstrap_error", { err: String(e) }, "warn");
  }

  await boss.work(
    "system:heartbeat",
    { batchSize: HEARTBEAT_BATCH },
    async (jobs) => {
      for (const job of jobs) {
        log("heartbeat", { jobId: job.id, data: job.data });
        // Explicitly complete to avoid stuck scheduled jobs
        await boss.complete("system:heartbeat", job.id);
      }
    }
  );

  await boss.work(
    "ingest:pull",
    { batchSize: INGEST_PULL_BATCH },
    async (jobs) => {
      for (const job of jobs) {
        await processIngestPullJob(boss, job);
      }
    }
  );

  await boss.work(
    "ingest:fetch-content",
    { batchSize: CONTENT_FETCH_BATCH },
    async (jobs) => {
      for (const job of jobs) {
        log("fetch_content_start", { jobId: job.id });
        try {
          await extractArticle(job.data as FetchContentJobData, boss);
          await boss.complete("ingest:fetch-content", job.id);
        } catch (err) {
          await boss.fail("ingest:fetch-content", job.id, {
            error: String(err),
          });
        }
        log("fetch_content_done", { jobId: job.id });
      }
    }
  );

  await boss.work(
    "ingest:fetch-youtube-content",
    { batchSize: YT_FETCH_BATCH },
    async (jobs) => {
      for (const job of jobs) {
        log("fetch_youtube_content_start", { jobId: job.id });
        try {
          await extractYouTubeContent(
            job.data as unknown as import("./actions/extract-youtube-content.js").YouTubeExtractionJobData,
            boss
          );
          await boss.complete("ingest:fetch-youtube-content", job.id);
        } catch (err) {
          await boss.fail("ingest:fetch-youtube-content", job.id, {
            error: String(err),
          });
        }
        log("fetch_youtube_content_done", { jobId: job.id });
      }
    }
  );

  await boss.work(
    "analyze:llm",
    { batchSize: CONTENT_FETCH_BATCH },
    async (jobs) => {
      for (const job of jobs) {
        const { storyId } = (job.data as AnalyzeJobData) || {};
        log("analyze_llm_start", { jobId: job.id, storyId });
        try {
          if (!storyId) {
            throw new Error("Missing storyId in job data");
          }
          await analyzeStory(storyId);
          await boss.complete("analyze:llm", job.id);
        } catch (err) {
          await boss.fail("analyze:llm", job.id, { error: String(err) });
        }
        log("analyze_llm_done", { jobId: job.id, storyId });
      }
    }
  );

  bossRef = boss;
}

function registerHealth(app: express.Express) {
  app.get("/healthz", (_req, res) => {
    res.status(HTTP_OK).send("ok");
  });
}

function registerPreviewSource(app: express.Express) {
  // Small helper to isolate kind branching and reduce handler complexity
  async function computePreviewResultForSource(
    src: { id: string; url?: string; kind: string },
    limit: number
  ): Promise<unknown> {
    if (src.kind === "rss" || src.kind === "podcast") {
      const { previewRssSourceAction } = await import(
        "./actions/preview-rss-source.js"
      );
      return previewRssSourceAction({ id: src.id, url: src.url ?? "" }, limit);
    }
    if (src.kind === "youtube_channel" || src.kind === "youtube_search") {
      const { previewYouTubeSourceAction } = await import(
        "./actions/preview-youtube-source.js"
      );
      return previewYouTubeSourceAction(src, limit);
    }
    throw new Error("unsupported_kind");
  }

  // Extracted handler to reduce route cognitive complexity
  async function handlePreviewSource(
    req: express.Request,
    res: express.Response
  ) {
    try {
      const sourceId = (req.query.sourceId as string) || "";
      const rawLimit = Number.parseInt(
        String(req.query.limit ?? DEFAULT_PREVIEW_LIMIT),
        10
      );
      const limit = Math.min(
        Number.isNaN(rawLimit) ? DEFAULT_PREVIEW_LIMIT : rawLimit,
        MAX_PREVIEW_LIMIT
      );
      if (!sourceId) {
        return res
          .status(HTTP_BAD_REQUEST)
          .json({ ok: false, error: "missing sourceId" });
      }
      const pg = (await import("./db.js")).default;
      const { rows } = await pg.query(
        "select id, kind, url, name, domain, metadata from public.sources where id = $1",
        [sourceId]
      );
      const src = rows[0];
      if (!src) {
        return res
          .status(HTTP_NOT_FOUND)
          .json({ ok: false, error: "not_found" });
      }
      let result: unknown = null;
      try {
        result = await computePreviewResultForSource(src, limit);
      } catch (err) {
        return res
          .status(HTTP_BAD_REQUEST)
          .json({ ok: false, error: String(err) });
      }
      return res.json({ ok: true, ...(result as object) });
    } catch (e: unknown) {
      return res
        .status(HTTP_SERVICE_UNAVAILABLE)
        .json({ ok: false, error: String(e) });
    }
  }
  app.get("/debug/preview-source", handlePreviewSource);
}

function registerIngestNow(app: express.Express) {
  app.post("/debug/ingest-now", async (_req, res) => {
    try {
      if (!bossRef) {
        throw new Error("boss_not_ready");
      }
      await bossRef.createQueue("ingest:pull");
      const { getRssSources } = await import("./db.js");
      const { ingestRssSource } = await import(
        "./actions/ingest-rss-source.js"
      );
      const sources = await getRssSources();
      for (const src of sources) {
        if (!src.url) {
          continue;
        }
        await ingestRssSource(bossRef, { id: src.id, url: src.url });
      }
      res.json({ ok: true });
    } catch (e: unknown) {
      res
        .status(HTTP_SERVICE_UNAVAILABLE)
        .json({ ok: false, error: String(e) });
    }
  });
}

function registerScheduleRss(app: express.Express) {
  app.post("/debug/schedule-rss", async (_req, res) => {
    try {
      if (!bossRef) {
        throw new Error("boss_not_ready");
      }
      await bossRef.createQueue("ingest:pull");
      await bossRef.schedule(
        "ingest:pull",
        "*/5 * * * *",
        { source: "rss" },
        { tz: CRON_TZ }
      );
      res.json({ ok: true });
    } catch (e: unknown) {
      res
        .status(HTTP_SERVICE_UNAVAILABLE)
        .json({ ok: false, error: String(e) });
    }
  });
}

function registerIngestYouTubeNow(app: express.Express) {
  app.post("/debug/ingest-youtube", async (_req, res) => {
    try {
      if (!bossRef) {
        throw new Error("boss_not_ready");
      }
      await bossRef.createQueue("ingest:pull");
      if (!process.env.YOUTUBE_API_KEY) {
        throw new Error("missing_api_key");
      }
      const { getYouTubeSources, upsertPlatformQuota } = await import(
        "./db.js"
      );
      const { ingestYouTubeSource } = await import(
        "./actions/ingest-youtube-source.js"
      );
      const { quotaTracker } = await import("./utils/quota-tracker.js");
      const sources = await getYouTubeSources();
      for (const src of sources) {
        await ingestYouTubeSource(bossRef, src);
      }
      const status = quotaTracker.checkQuotaStatus();
      try {
        const resetHour =
          Number(process.env.YOUTUBE_QUOTA_RESET_HOUR || "0") || 0;
        const now = new Date();
        const resetAt = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          resetHour,
          0,
          0,
          0
        );
        if (resetAt.getTime() < now.getTime()) {
          resetAt.setDate(resetAt.getDate() + 1);
        }
        await upsertPlatformQuota("youtube", {
          limit: Number(process.env.YOUTUBE_QUOTA_LIMIT || "10000"),
          used: status.used,
          remaining: status.remaining,
          reset_at: resetAt.toISOString(),
        });
      } catch (e) {
        log("platform_quota_update_error", { error: String(e) }, "debug");
      }
      res.json({ ok: true });
    } catch (e: unknown) {
      res
        .status(HTTP_SERVICE_UNAVAILABLE)
        .json({ ok: false, error: String(e) });
    }
  });
}

function registerIngestSource(app: express.Express) {
  app.post("/debug/ingest-source", async (req, res) => {
    try {
      if (!bossRef) {
        throw new Error("boss_not_ready");
      }
      const sourceId =
        (req.query.sourceId as string) || (req.body?.sourceId as string) || "";
      if (!sourceId) {
        throw new Error("missing_sourceId");
      }
      await ingestSourceById(bossRef, sourceId);
      res.json({ ok: true });
    } catch (e: unknown) {
      const msg = String(e);
      if (msg.includes("not_found")) {
        return res
          .status(HTTP_NOT_FOUND)
          .json({ ok: false, error: "not_found" });
      }
      if (msg.includes("unsupported_kind")) {
        return res
          .status(HTTP_BAD_REQUEST)
          .json({ ok: false, error: "unsupported_kind" });
      }
      res.status(HTTP_SERVICE_UNAVAILABLE).json({ ok: false, error: msg });
    }
  });
}

async function ingestSourceById(boss: PgBoss, sourceId: string) {
  const pg = (await import("./db.js")).default;
  const { rows } = await pg.query(
    "select id, kind from public.sources where id = $1",
    [sourceId]
  );
  const row = rows[0];
  if (!row) {
    throw new Error("not_found");
  }
  if (row.kind === "rss" || row.kind === "podcast") {
    const { ingestRssSource } = await import("./actions/ingest-rss-source.js");
    const { getSourceById } = await import("./db.js");
    const srcFull = await getSourceById(sourceId);
    if (!srcFull?.url) {
      throw new Error("no_url_for_source");
    }
    await ingestRssSource(boss, { id: sourceId, url: srcFull.url });
    return;
  }
  if (row.kind === "youtube_channel" || row.kind === "youtube_search") {
    const { ingestYouTubeSource } = await import(
      "./actions/ingest-youtube-source.js"
    );
    const { getSourceById } = await import("./db.js");
    const srcFull = await getSourceById(sourceId);
    if (!srcFull) {
      throw new Error("not_found");
    }
    await ingestYouTubeSource(boss, srcFull);
    return;
  }
  throw new Error("unsupported_kind");
}

function registerScheduleYouTube(app: express.Express) {
  app.post("/debug/schedule-youtube", async (_req, res) => {
    try {
      if (!bossRef) {
        throw new Error("boss_not_ready");
      }
      await bossRef.createQueue("ingest:pull");
      await bossRef.schedule(
        "ingest:pull",
        "*/15 * * * *",
        { source: "youtube" },
        { tz: CRON_TZ }
      );
      res.json({ ok: true });
    } catch (e: unknown) {
      res
        .status(HTTP_SERVICE_UNAVAILABLE)
        .json({ ok: false, error: String(e) });
    }
  });
}

function classifyUrl(u: string): "youtube" | "article" {
  try {
    const x = new URL(u);
    const h = x.hostname || "";
    if (h.includes("youtube.com") || h.includes("youtu.be")) {
      return "youtube";
    }
    return "article";
  } catch {
    return "article";
  }
}

function extractYouTubeVideoId(u: string): string {
  try {
    const xu = new URL(u);
    if (xu.hostname.includes("youtu.be")) {
      return xu.pathname.replace("/", "");
    }
    if (xu.pathname.startsWith("/shorts/")) {
      return xu.pathname.split("/")[2] || "";
    }
    return xu.searchParams.get("v") || "";
  } catch {
    return "";
  }
}

async function processYoutubeUrl(
  u: string,
  boss: PgBoss
): Promise<YouTubeIngestResult> {
  const { getOrCreateManualSource, upsertRawItem } = await import("./db.js");
  const videoId = extractYouTubeVideoId(u);
  if (!videoId) {
    return { url: u, ok: false, error: "no_video_id", type: "youtube" };
  }
  const sourceId = await getOrCreateManualSource(
    "youtube_manual",
    "youtube.com",
    "YouTube Manual",
    null
  );
  const rawId = await upsertRawItem({
    source_id: sourceId,
    external_id: videoId,
    url: u,
    title: null,
    kind: "youtube",
    metadata: { src: "manual" },
  });
  if (rawId) {
    await boss.send("ingest:fetch-youtube-content", {
      rawItemIds: [rawId],
      videoId,
      sourceKind: "youtube_manual",
    });
    return { url: u, ok: true, raw_item_id: rawId, type: "youtube" };
  }
  return { url: u, ok: false, error: "duplicate", type: "youtube" };
}

async function processArticleUrl(
  u: string,
  boss: PgBoss
): Promise<ArticleIngestResult> {
  const { getOrCreateManualSource, upsertRawItem } = await import("./db.js");
  let domain: string | null = null;
  try {
    domain = new URL(u).hostname || null;
  } catch {
    domain = null;
  }
  const sourceId = await getOrCreateManualSource(
    "manual",
    domain,
    domain,
    null
  );
  const rawId = await upsertRawItem({
    source_id: sourceId,
    external_id: u,
    url: u,
    title: null,
    kind: "article",
    metadata: { src: "manual" },
  });
  if (rawId) {
    await boss.send("ingest:fetch-content", { rawItemIds: [rawId] });
    return { url: u, ok: true, raw_item_id: rawId, type: "article" };
  }
  return { url: u, ok: false, error: "duplicate", type: "article" };
}

function registerIngestOneoff(app: express.Express) {
  app.post("/debug/ingest-oneoff", async (req, res) => {
    try {
      if (!bossRef) {
        throw new Error("boss_not_ready");
      }
      const body = (req.body || {}) as { urls?: string[] };
      const urls = Array.isArray(body.urls) ? body.urls.filter(Boolean) : [];
      if (urls.length === 0) {
        return res
          .status(HTTP_BAD_REQUEST)
          .json({ ok: false, error: "no_urls" });
      }

      const results: Array<
        | {
            url: string;
            ok: true;
            raw_item_id: string;
            type: "youtube" | "article";
          }
        | { url: string; ok: false; error: string; type: "youtube" | "article" }
      > = [];
      for (const u of urls) {
        const kind = classifyUrl(u);
        if (kind === "youtube") {
          results.push(await processYoutubeUrl(u, bossRef));
        } else {
          results.push(await processArticleUrl(u, bossRef));
        }
      }
      res.json({ ok: true, results });
    } catch (e: unknown) {
      res
        .status(HTTP_SERVICE_UNAVAILABLE)
        .json({ ok: false, error: String(e) });
    }
  });
}

function registerDebugStatus(app: express.Express) {
  // Simple status snapshot for quick observability
  app.get("/debug/status", async (_req, res) => {
    try {
      const pg = (await import("./db.js")).default;
      const [
        { rows: sources },
        { rows: rawCounts },
        { rows: contentCounts },
        { rows: jobStats },
      ] = await Promise.all([
        pg.query(
          "select count(*)::int as sources_rss from public.sources where kind = 'rss' and url is not null"
        ),
        pg.query(
          "select count(*)::int as raw_total, count(*) filter (where discovered_at > now() - interval '24 hours')::int as raw_24h from public.raw_items"
        ),
        pg.query("select count(*)::int as contents_total from public.contents"),
        pg.query(
          "select name, state, count(*)::int as count from pgboss.job group by 1,2 order by 1,2"
        ),
      ]);
      res.json({
        ok: true,
        sources: sources[0],
        raw: rawCounts[0],
        contents: contentCounts[0],
        jobs: jobStats,
      });
    } catch (e: unknown) {
      res
        .status(HTTP_SERVICE_UNAVAILABLE)
        .json({ ok: false, error: String(e) });
    }
  });
}

function main() {
  // Global guards to avoid process crash on unhandled errors
  process.on("uncaughtException", (err) => {
    log("uncaught_exception", { err: String(err) });
  });
  process.on("unhandledRejection", (reason) => {
    log("unhandled_rejection", { reason: String(reason) });
  });

  // Start HTTP early to satisfy Cloud Run health checks
  const app = express();
  app.use(express.json());
  registerHealth(app);
  registerPreviewSource(app);
  registerIngestNow(app);
  registerScheduleRss(app);
  registerIngestYouTubeNow(app);
  registerIngestSource(app);
  registerScheduleYouTube(app);
  registerIngestOneoff(app);
  registerDebugStatus(app);

  const port = Number(process.env.PORT || DEFAULT_PORT);
  app.listen(port, () => log("http_listen", { port }));

  // Boss init with retry loop (no process exit)
  const attempt = async () => {
    try {
      await initBoss();
    } catch (err) {
      log("boss_start_error", { err: String(err) });
      setTimeout(() => {
        attempt();
      }, RETRY_DELAY_MS);
    }
  };
  attempt();

  // Light job metrics mirror (every 3s)
  setInterval(async () => {
    try {
      const pg = (await import("./db.js")).default;
      const { upsertJobMetrics } = await import("./db.js");
      const { rows: jobStats } = await pg.query(
        "select name, state, count(*)::int as count from pgboss.job group by 1,2 order by 1,2"
      );
      await upsertJobMetrics(
        jobStats as Array<{ name: string; state: string; count: number }>
      );
    } catch {
      null;
    }
  }, METRICS_INTERVAL_MS);

  // Graceful shutdown
  const shutdown = async (sig: string) => {
    try {
      log("shutdown_signal", { sig });
      if (bossRef) {
        await bossRef.stop({ graceful: true });
      }
    } finally {
      process.exit(0);
    }
  };
  process.on("SIGINT", () => {
    shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    shutdown("SIGTERM");
  });
}

main();
