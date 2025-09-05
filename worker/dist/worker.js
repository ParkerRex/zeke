import "dotenv/config";
import express from "express";
import PgBoss from "pg-boss";
import { runAnalyzeStory } from "./analyze/llm.js";
import { runFetchAndExtract } from "./extract/article.js";
import { runYouTubeFetchAndExtract } from "./extract/youtube.js";
import { runIngestRss } from "./ingest/rss.js";
import { runIngestYouTube } from "./ingest/youtube.js";
import { log } from "./log.js";
const DATABASE_URL = process.env.DATABASE_URL;
const BOSS_SCHEMA = process.env.BOSS_SCHEMA || "pgboss";
const CRON_TZ = process.env.BOSS_CRON_TZ || "UTC";
const BOSS_MIGRATE = process.env.BOSS_MIGRATE !== "false";
if (!DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.error("Missing DATABASE_URL env var");
    process.exit(1);
}
// logging provided by ./log
let bossRef = null;
async function initBoss() {
    const boss = new PgBoss({
        connectionString: DATABASE_URL,
        schema: BOSS_SCHEMA,
        ssl: { rejectUnauthorized: false },
        application_name: "zeke-worker",
        max: 2,
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
    await boss.work("system:heartbeat", async (jobs) => {
        for (const job of jobs)
            log("heartbeat", { jobId: job.id, data: job.data });
    });
    await boss.work("ingest:pull", async (jobs) => {
        for (const job of jobs) {
            const { source } = (job.data || {});
            log("ingest_pull_start", { jobId: job.id, source });
            if (source === "rss")
                await runIngestRss(boss);
            if (source === "youtube")
                await runIngestYouTube(boss);
            await boss.complete("ingest:pull", job.id);
            log("ingest_pull_done", { jobId: job.id, source });
        }
    });
    await boss.work("ingest:fetch-content", async (jobs) => {
        for (const job of jobs) {
            log("fetch_content_start", { jobId: job.id });
            try {
                await runFetchAndExtract(job.data, boss);
                await boss.complete("ingest:fetch-content", job.id);
            }
            catch (err) {
                await boss.fail("ingest:fetch-content", job.id, { error: String(err) });
            }
            log("fetch_content_done", { jobId: job.id });
        }
    });
    await boss.work("ingest:fetch-youtube-content", async (jobs) => {
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
    await boss.work("analyze:llm", async (jobs) => {
        for (const job of jobs) {
            const { storyId } = job.data || {};
            log("analyze_llm_start", { jobId: job.id, storyId });
            try {
                if (!storyId)
                    throw new Error("Missing storyId in job data");
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
async function main() {
    // Global guards to avoid process crash on unhandled errors
    process.on("uncaughtException", (err) => log("uncaught_exception", { err: String(err) }));
    process.on("unhandledRejection", (reason) => log("unhandled_rejection", { reason: String(reason) }));
    // Start HTTP early to satisfy Cloud Run health checks
    const app = express();
    app.use(express.json());
    app.get("/healthz", (_req, res) => res.status(200).send("ok"));
    app.post("/debug/ingest-now", async (_req, res) => {
        try {
            if (!bossRef)
                throw new Error("boss_not_ready");
            await bossRef.createQueue("ingest:pull");
            await runIngestRss(bossRef);
            res.json({ ok: true });
        }
        catch (e) {
            res.status(503).json({ ok: false, error: String(e) });
        }
    });
    app.post("/debug/schedule-rss", async (_req, res) => {
        try {
            if (!bossRef)
                throw new Error("boss_not_ready");
            await bossRef.createQueue("ingest:pull");
            await bossRef.schedule("ingest:pull", "*/5 * * * *", { source: "rss" }, { tz: CRON_TZ });
            res.json({ ok: true });
        }
        catch (e) {
            res.status(503).json({ ok: false, error: String(e) });
        }
    });
    app.post("/debug/ingest-youtube", async (_req, res) => {
        try {
            if (!bossRef)
                throw new Error("boss_not_ready");
            await bossRef.createQueue("ingest:pull");
            await runIngestYouTube(bossRef);
            res.json({ ok: true });
        }
        catch (e) {
            res.status(503).json({ ok: false, error: String(e) });
        }
    });
    app.post("/debug/schedule-youtube", async (_req, res) => {
        try {
            if (!bossRef)
                throw new Error("boss_not_ready");
            await bossRef.createQueue("ingest:pull");
            await bossRef.schedule("ingest:pull", "*/15 * * * *", { source: "youtube" }, { tz: CRON_TZ });
            res.json({ ok: true });
        }
        catch (e) {
            res.status(503).json({ ok: false, error: String(e) });
        }
    });
    // Simple status snapshot for quick observability
    app.get("/debug/status", async (_req, res) => {
        try {
            const pg = (await import("./db.js")).default;
            const [{ rows: sources }, { rows: rawCounts }, { rows: contentCounts }, { rows: jobStats },] = await Promise.all([
                pg.query('select count(*)::int as sources_rss from public.sources where kind = "rss" and url is not null'),
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
            res.status(503).json({ ok: false, error: String(e) });
        }
    });
    const port = Number(process.env.PORT || 8080);
    app.listen(port, () => log("http_listen", { port }));
    // Boss init with retry loop (no process exit)
    const attempt = async () => {
        try {
            await initBoss();
        }
        catch (err) {
            log("boss_start_error", { err: String(err) });
            setTimeout(() => {
                void attempt();
            }, 10_000);
        }
    };
    void attempt();
    // Graceful shutdown
    const shutdown = async (sig) => {
        try {
            log("shutdown_signal", { sig });
            if (bossRef)
                await bossRef.stop({ graceful: true });
        }
        finally {
            process.exit(0);
        }
    };
    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
}
void main();
