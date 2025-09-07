import "dotenv/config";
import express from "express";
import PgBoss from "pg-boss";
import { runAnalyzeStory } from "./analyze/llm.js";
import { runFetchAndExtract } from "./extract/article.js";
import { runYouTubeFetchAndExtract } from "./extract/youtube.js";
import { runIngestRss } from "./ingest/rss.js";
import { runIngestYouTube } from "./ingest/youtube.js";
import { log } from "./log.js";
const DATABASE_URL = process.env.DATABASE_URL ?? "";
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
const USE_SSL = !(DATABASE_URL.includes("127.0.0.1") ||
    DATABASE_URL.includes("localhost") ||
    DATABASE_URL.includes("host.docker.internal"));
if (!DATABASE_URL) {
    log("missing_env", { key: "DATABASE_URL" }, "error");
    process.exit(1);
}
// logging provided by ./log
let bossRef = null;
async function initBoss() {
    const boss = new PgBoss({
        connectionString: DATABASE_URL,
        schema: BOSS_SCHEMA,
        ssl: USE_SSL
            ? { rejectUnauthorized: false }
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
    await boss.schedule("system:heartbeat", "*/5 * * * *", { ping: "ok" }, { tz: CRON_TZ });
    await boss.schedule("ingest:pull", "*/5 * * * *", { source: "rss" }, { tz: CRON_TZ });
    await boss.schedule("ingest:pull", "*/15 * * * *", { source: "youtube" }, { tz: CRON_TZ });
    // Kick off an immediate run on startup for faster local feedback
    try {
        await boss.send("ingest:pull", { source: "rss" });
        await boss.send("ingest:pull", { source: "youtube" });
        log("ingest_bootstrap_queued", { when: "startup" });
    }
    catch (e) {
        log("ingest_bootstrap_error", { err: String(e) }, "warn");
    }
    await boss.work("system:heartbeat", { batchSize: HEARTBEAT_BATCH }, async (jobs) => {
        for (const job of jobs) {
            log("heartbeat", { jobId: job.id, data: job.data });
            // Explicitly complete to avoid stuck scheduled jobs
            await boss.complete("system:heartbeat", job.id);
        }
    });
    await boss.work("ingest:pull", { batchSize: INGEST_PULL_BATCH }, async (jobs) => {
        for (const job of jobs) {
            const { source } = (job.data || {});
            log("ingest_pull_start", { jobId: job.id, source });
            if (source === "rss") {
                await runIngestRss(boss);
            }
            if (source === "youtube") {
                await runIngestYouTube(boss);
            }
            await boss.complete("ingest:pull", job.id);
            log("ingest_pull_done", { jobId: job.id, source });
        }
    });
    await boss.work("ingest:fetch-content", { batchSize: CONTENT_FETCH_BATCH }, async (jobs) => {
        for (const job of jobs) {
            log("fetch_content_start", { jobId: job.id });
            try {
                await runFetchAndExtract(job.data, boss);
                await boss.complete("ingest:fetch-content", job.id);
            }
            catch (err) {
                await boss.fail("ingest:fetch-content", job.id, {
                    error: String(err),
                });
            }
            log("fetch_content_done", { jobId: job.id });
        }
    });
    await boss.work("ingest:fetch-youtube-content", { batchSize: YT_FETCH_BATCH }, async (jobs) => {
        for (const job of jobs) {
            log("fetch_youtube_content_start", { jobId: job.id });
            try {
                await runYouTubeFetchAndExtract(job.data, boss);
                await boss.complete("ingest:fetch-youtube-content", job.id);
            }
            catch (err) {
                await boss.fail("ingest:fetch-youtube-content", job.id, {
                    error: String(err),
                });
            }
            log("fetch_youtube_content_done", { jobId: job.id });
        }
    });
    await boss.work("analyze:llm", { batchSize: CONTENT_FETCH_BATCH }, async (jobs) => {
        for (const job of jobs) {
            const { storyId } = job.data || {};
            log("analyze_llm_start", { jobId: job.id, storyId });
            try {
                if (!storyId) {
                    throw new Error("Missing storyId in job data");
                }
                await runAnalyzeStory(storyId);
                await boss.complete("analyze:llm", job.id);
            }
            catch (err) {
                await boss.fail("analyze:llm", job.id, { error: String(err) });
            }
            log("analyze_llm_done", { jobId: job.id, storyId });
        }
    });
    bossRef = boss;
}
function registerHealth(app) {
    app.get("/healthz", (_req, res) => {
        res.status(HTTP_OK).send("ok");
    });
}
function registerPreviewSource(app) {
    // Small helper to isolate kind branching and reduce handler complexity
    async function computePreviewResultForSource(src, limit) {
        if (src.kind === "rss" || src.kind === "podcast") {
            const { previewRssSource } = await import("./ingest/rss.js");
            return previewRssSource({ id: src.id, url: src.url ?? null }, limit);
        }
        if (src.kind === "youtube_channel" || src.kind === "youtube_search") {
            const { previewYouTubeSource } = await import("./ingest/youtube.js");
            return previewYouTubeSource(src, limit);
        }
        throw new Error("unsupported_kind");
    }
    // Extracted handler to reduce route cognitive complexity
    async function handlePreviewSource(req, res) {
        try {
            const sourceId = req.query.sourceId || "";
            const rawLimit = Number.parseInt(String(req.query.limit ?? DEFAULT_PREVIEW_LIMIT), 10);
            const limit = Math.min(Number.isNaN(rawLimit) ? DEFAULT_PREVIEW_LIMIT : rawLimit, MAX_PREVIEW_LIMIT);
            if (!sourceId) {
                return res
                    .status(HTTP_BAD_REQUEST)
                    .json({ ok: false, error: "missing sourceId" });
            }
            const pg = (await import("./db.js")).default;
            const { rows } = await pg.query("select id, kind, url, name, domain, metadata from public.sources where id = $1", [sourceId]);
            const src = rows[0];
            if (!src) {
                return res
                    .status(HTTP_NOT_FOUND)
                    .json({ ok: false, error: "not_found" });
            }
            let result = null;
            try {
                result = await computePreviewResultForSource(src, limit);
            }
            catch (err) {
                return res
                    .status(HTTP_BAD_REQUEST)
                    .json({ ok: false, error: String(err) });
            }
            return res.json({ ok: true, ...result });
        }
        catch (e) {
            return res
                .status(HTTP_SERVICE_UNAVAILABLE)
                .json({ ok: false, error: String(e) });
        }
    }
    app.get("/debug/preview-source", handlePreviewSource);
}
function registerIngestNow(app) {
    app.post("/debug/ingest-now", async (_req, res) => {
        try {
            if (!bossRef) {
                throw new Error("boss_not_ready");
            }
            await bossRef.createQueue("ingest:pull");
            await runIngestRss(bossRef);
            res.json({ ok: true });
        }
        catch (e) {
            res
                .status(HTTP_SERVICE_UNAVAILABLE)
                .json({ ok: false, error: String(e) });
        }
    });
}
function registerScheduleRss(app) {
    app.post("/debug/schedule-rss", async (_req, res) => {
        try {
            if (!bossRef) {
                throw new Error("boss_not_ready");
            }
            await bossRef.createQueue("ingest:pull");
            await bossRef.schedule("ingest:pull", "*/5 * * * *", { source: "rss" }, { tz: CRON_TZ });
            res.json({ ok: true });
        }
        catch (e) {
            res
                .status(HTTP_SERVICE_UNAVAILABLE)
                .json({ ok: false, error: String(e) });
        }
    });
}
function registerIngestYouTubeNow(app) {
    app.post("/debug/ingest-youtube", async (_req, res) => {
        try {
            if (!bossRef) {
                throw new Error("boss_not_ready");
            }
            await bossRef.createQueue("ingest:pull");
            await runIngestYouTube(bossRef);
            res.json({ ok: true });
        }
        catch (e) {
            res
                .status(HTTP_SERVICE_UNAVAILABLE)
                .json({ ok: false, error: String(e) });
        }
    });
}
function registerIngestSource(app) {
    app.post("/debug/ingest-source", async (req, res) => {
        try {
            if (!bossRef) {
                throw new Error("boss_not_ready");
            }
            const sourceId = req.query.sourceId || req.body?.sourceId || "";
            if (!sourceId) {
                throw new Error("missing_sourceId");
            }
            const pg = (await import("./db.js")).default;
            const { rows } = await pg.query("select id, kind from public.sources where id = $1", [sourceId]);
            const row = rows[0];
            if (!row) {
                return res
                    .status(HTTP_NOT_FOUND)
                    .json({ ok: false, error: "not_found" });
            }
            if (row.kind === "rss" || row.kind === "podcast") {
                const { runIngestRssForSource } = await import("./ingest/rss.js");
                await runIngestRssForSource(bossRef, sourceId);
            }
            else if (row.kind === "youtube_channel" ||
                row.kind === "youtube_search") {
                const { runIngestYouTubeForSource } = await import("./ingest/youtube.js");
                await runIngestYouTubeForSource(bossRef, sourceId);
            }
            else {
                return res
                    .status(HTTP_BAD_REQUEST)
                    .json({ ok: false, error: "unsupported_kind" });
            }
            res.json({ ok: true });
        }
        catch (e) {
            res
                .status(HTTP_SERVICE_UNAVAILABLE)
                .json({ ok: false, error: String(e) });
        }
    });
}
function registerScheduleYouTube(app) {
    app.post("/debug/schedule-youtube", async (_req, res) => {
        try {
            if (!bossRef) {
                throw new Error("boss_not_ready");
            }
            await bossRef.createQueue("ingest:pull");
            await bossRef.schedule("ingest:pull", "*/15 * * * *", { source: "youtube" }, { tz: CRON_TZ });
            res.json({ ok: true });
        }
        catch (e) {
            res
                .status(HTTP_SERVICE_UNAVAILABLE)
                .json({ ok: false, error: String(e) });
        }
    });
}
function classifyUrl(u) {
    try {
        const x = new URL(u);
        const h = x.hostname || "";
        if (h.includes("youtube.com") || h.includes("youtu.be")) {
            return "youtube";
        }
        return "article";
    }
    catch {
        return "article";
    }
}
function extractYouTubeVideoId(u) {
    try {
        const xu = new URL(u);
        if (xu.hostname.includes("youtu.be")) {
            return xu.pathname.replace("/", "");
        }
        if (xu.pathname.startsWith("/shorts/")) {
            return xu.pathname.split("/")[2] || "";
        }
        return xu.searchParams.get("v") || "";
    }
    catch {
        return "";
    }
}
async function processYoutubeUrl(u, boss) {
    const { getOrCreateManualSource, upsertRawItem } = await import("./db.js");
    const videoId = extractYouTubeVideoId(u);
    if (!videoId) {
        return { url: u, ok: false, error: "no_video_id", type: "youtube" };
    }
    const sourceId = await getOrCreateManualSource("youtube_manual", "youtube.com", "YouTube Manual", null);
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
async function processArticleUrl(u, boss) {
    const { getOrCreateManualSource, upsertRawItem } = await import("./db.js");
    let domain = null;
    try {
        domain = new URL(u).hostname || null;
    }
    catch {
        domain = null;
    }
    const sourceId = await getOrCreateManualSource("manual", domain, domain, null);
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
function registerIngestOneoff(app) {
    app.post("/debug/ingest-oneoff", async (req, res) => {
        try {
            if (!bossRef) {
                throw new Error("boss_not_ready");
            }
            const body = (req.body || {});
            const urls = Array.isArray(body.urls) ? body.urls.filter(Boolean) : [];
            if (urls.length === 0) {
                return res
                    .status(HTTP_BAD_REQUEST)
                    .json({ ok: false, error: "no_urls" });
            }
            const results = [];
            for (const u of urls) {
                const kind = classifyUrl(u);
                if (kind === "youtube") {
                    results.push(await processYoutubeUrl(u, bossRef));
                }
                else {
                    results.push(await processArticleUrl(u, bossRef));
                }
            }
            res.json({ ok: true, results });
        }
        catch (e) {
            res
                .status(HTTP_SERVICE_UNAVAILABLE)
                .json({ ok: false, error: String(e) });
        }
    });
}
function registerDebugStatus(app) {
    // Simple status snapshot for quick observability
    app.get("/debug/status", async (_req, res) => {
        try {
            const pg = (await import("./db.js")).default;
            const [{ rows: sources }, { rows: rawCounts }, { rows: contentCounts }, { rows: jobStats },] = await Promise.all([
                pg.query("select count(*)::int as sources_rss from public.sources where kind = 'rss' and url is not null"),
                pg.query("select count(*)::int as raw_total, count(*) filter (where discovered_at > now() - interval '24 hours')::int as raw_24h from public.raw_items"),
                pg.query("select count(*)::int as contents_total from public.contents"),
                pg.query("select name, state, count(*)::int as count from pgboss.job group by 1,2 order by 1,2"),
            ]);
            res.json({
                ok: true,
                sources: sources[0],
                raw: rawCounts[0],
                contents: contentCounts[0],
                jobs: jobStats,
            });
        }
        catch (e) {
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
        }
        catch (err) {
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
            const { rows: jobStats } = await pg.query("select name, state, count(*)::int as count from pgboss.job group by 1,2 order by 1,2");
            await upsertJobMetrics(jobStats);
        }
        catch {
            null;
        }
    }, METRICS_INTERVAL_MS);
    // Graceful shutdown
    const shutdown = async (sig) => {
        try {
            log("shutdown_signal", { sig });
            if (bossRef) {
                await bossRef.stop({ graceful: true });
            }
        }
        finally {
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
