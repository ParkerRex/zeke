import 'dotenv/config';
import PgBoss from 'pg-boss';
import express from 'express';
import { runIngestRss } from './ingest/rss.js';
import { runFetchAndExtract } from './extract/article.js';

const DATABASE_URL = process.env.DATABASE_URL;
const BOSS_SCHEMA = process.env.BOSS_SCHEMA || 'pgboss';
const CRON_TZ = process.env.BOSS_CRON_TZ || 'UTC';
const BOSS_MIGRATE = process.env.BOSS_MIGRATE !== 'false';

if (!DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.error('Missing DATABASE_URL env var');
  process.exit(1);
}

function log(msg: string, extra?: Record<string, unknown>) {
  // minimal structured logging
  const entry = { ts: new Date().toISOString(), msg, ...extra };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
}

let bossRef: PgBoss | null = null;

async function initBoss() {
  const boss = new PgBoss({
    connectionString: DATABASE_URL,
    schema: BOSS_SCHEMA,
    ssl: { rejectUnauthorized: false } as any,
    application_name: 'zeke-worker',
    max: 2,
    migrate: BOSS_MIGRATE,
  });
  boss.on('error', (err) => log('boss_error', { err: String(err) }));

  await boss.start();
  log('boss_started', { schema: BOSS_SCHEMA, tz: CRON_TZ });

  await Promise.all([
    boss.createQueue('system:heartbeat'),
    boss.createQueue('ingest:pull'),
    boss.createQueue('ingest:fetch-content'),
    boss.createQueue('analyze:llm'),
  ]);

  await boss.schedule('system:heartbeat', '*/5 * * * *', { ping: 'ok' }, { tz: CRON_TZ });
  await boss.schedule('ingest:pull', '*/5 * * * *', { source: 'rss' }, { tz: CRON_TZ });

  await boss.work('system:heartbeat', async (jobs) => {
    for (const job of jobs) log('heartbeat', { jobId: job.id, data: job.data });
  });

  await boss.work('ingest:pull', async (jobs) => {
    for (const job of jobs) {
      const { source } = (job.data || {}) as { source?: string };
      log('ingest_pull_start', { jobId: job.id, source });
      if (source === 'rss') await runIngestRss(boss);
      await boss.complete('ingest:pull', job.id);
      log('ingest_pull_done', { jobId: job.id, source });
    }
  });

  await boss.work('ingest:fetch-content', async (jobs) => {
    for (const job of jobs) {
      log('fetch_content_start', { jobId: job.id });
      try {
        await runFetchAndExtract(job.data as any, boss);
        await boss.complete('ingest:fetch-content', job.id);
      } catch (err) {
        await boss.fail('ingest:fetch-content', job.id, { error: String(err) });
      }
      log('fetch_content_done', { jobId: job.id });
    }
  });

  await boss.work('analyze:llm', async (jobs) => {
    for (const job of jobs) {
      log('analyze_llm_start', { jobId: job.id, storyId: (job.data as any)?.storyId });
      await boss.complete('analyze:llm', job.id);
      log('analyze_llm_done', { jobId: job.id });
    }
  });

  bossRef = boss;
}

async function main() {
  // Global guards to avoid process crash on unhandled errors
  process.on('uncaughtException', (err) => log('uncaught_exception', { err: String(err) }));
  process.on('unhandledRejection', (reason) => log('unhandled_rejection', { reason: String(reason) }));

  // Start HTTP early to satisfy Cloud Run health checks
  const app = express();
  app.use(express.json());
  app.get('/healthz', (_req, res) => res.status(200).send('ok'));
  app.post('/debug/ingest-now', async (_req, res) => {
    try {
      if (!bossRef) throw new Error('boss_not_ready');
      await bossRef.createQueue('ingest:pull');
      await runIngestRss(bossRef);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(503).json({ ok: false, error: String(e) });
    }
  });
  app.post('/debug/schedule-rss', async (_req, res) => {
    try {
      if (!bossRef) throw new Error('boss_not_ready');
      await bossRef.createQueue('ingest:pull');
      await bossRef.schedule('ingest:pull', '*/5 * * * *', { source: 'rss' }, { tz: CRON_TZ });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(503).json({ ok: false, error: String(e) });
    }
  });
  const port = Number(process.env.PORT || 8080);
  app.listen(port, () => log('http_listen', { port }));

  // Boss init with retry loop (no process exit)
  const attempt = async () => {
    try {
      await initBoss();
    } catch (err) {
      log('boss_start_error', { err: String(err) });
      setTimeout(() => {
        void attempt();
      }, 10_000);
    }
  };
  void attempt();

  // Graceful shutdown
  const shutdown = async (sig: string) => {
    try {
      log('shutdown_signal', { sig });
      if (bossRef) await bossRef.stop({ graceful: true });
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void main();
