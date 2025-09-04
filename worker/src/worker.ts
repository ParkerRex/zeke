import 'dotenv/config';
import PgBoss from 'pg-boss';
import express from 'express';

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

async function main() {
  const boss = new PgBoss({
    connectionString: DATABASE_URL,
    schema: BOSS_SCHEMA,
    // Supabase requires SSL; for self-signed chains, allow insecure
    ssl: { rejectUnauthorized: false } as any,
    migrate: BOSS_MIGRATE,
  });

  boss.on('error', (err) => log('boss_error', { err: String(err) }));

  await boss.start();
  log('boss_started', { schema: BOSS_SCHEMA, tz: CRON_TZ });

  // Ensure queues exist before scheduling/working
  await Promise.all([
    boss.createQueue('system:heartbeat'),
    boss.createQueue('ingest:pull'),
    boss.createQueue('ingest:fetch-content'),
    boss.createQueue('analyze:llm'),
  ]);

  // --- Scheduling (cron) ---
  // Heartbeat job: proves scheduling and processing end-to-end
  await boss.schedule('system:heartbeat', '*/5 * * * *', { ping: 'ok' }, { tz: CRON_TZ });

  // Example: source pulls (disable until connectors are ready)
  // await boss.schedule('ingest:pull', '*/10 * * * *', { source: 'rss' });

  // --- Workers ---
  await boss.work('system:heartbeat', async (jobs) => {
    for (const job of jobs) {
      log('heartbeat', { jobId: job.id, data: job.data });
    }
  });

  await boss.work('ingest:pull', async (jobs) => {
    for (const job of jobs) {
      const { source } = (job.data || {}) as { source?: string };
      log('ingest_pull_start', { jobId: job.id, source });
      // TODO: fetch RSS/HN/arXiv by cursor; upsert raw_items; enqueue fetch-content
      await boss.send('ingest:fetch-content', { rawItemIds: [] });
      log('ingest_pull_done', { jobId: job.id, source });
    }
  });

  await boss.work('ingest:fetch-content', async (jobs) => {
    for (const job of jobs) {
      log('fetch_content_start', { jobId: job.id });
      // TODO: fetch HTML/audio/pdf, extract/transcribe, write contents/stories, enqueue analyze
      await boss.send('analyze:llm', { storyId: null });
      log('fetch_content_done', { jobId: job.id });
    }
  });

  await boss.work('analyze:llm', async (jobs) => {
    for (const job of jobs) {
      log('analyze_llm_start', { jobId: job.id, storyId: (job.data as any)?.storyId });
      // TODO: build prompt, call LLM, persist overlays + embeddings
      log('analyze_llm_done', { jobId: job.id });
    }
  });

  // Cloud Run expects an HTTP server to consider the container healthy
  const app = express();
  app.get('/healthz', (_req, res) => res.status(200).send('ok'));
  const port = Number(process.env.PORT || 8080);
  app.listen(port, () => log('http_listen', { port }));

  // Graceful shutdown
  const shutdown = async (sig: string) => {
    try {
      log('shutdown_signal', { sig });
      await boss.stop({ graceful: true });
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
