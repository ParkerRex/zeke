/**
 * Job Definitions - All pg-boss job configurations in one place
 *
 * This module defines all queues, workers, and scheduled jobs.
 * Each job follows a consistent pattern for easy understanding.
 *
 * Job Types:
 * - System jobs: heartbeat, monitoring
 * - Ingest jobs: RSS and YouTube source processing
 * - Content jobs: article and video content extraction
 * - Analysis jobs: LLM processing and embeddings
 */

import type PgBoss from 'pg-boss';
import { log } from '../log.js';
import type { JobOrchestrator } from './job-orchestrator.js';

// Job configuration constants
export const JOB_CONFIG = {
  HEARTBEAT_BATCH: 10,
  INGEST_PULL_BATCH: 5,
  CONTENT_FETCH_BATCH: 5,
  YT_FETCH_BATCH: 2,
  CRON_TZ: process.env.BOSS_CRON_TZ || 'UTC',
} as const;

// Queue names for type safety
export const QUEUES = {
  SYSTEM_HEARTBEAT: 'system:heartbeat',
  INGEST_PULL: 'ingest:pull',
  INGEST_SOURCE: 'ingest:source',
  INGEST_FETCH_CONTENT: 'ingest:fetch-content',
  INGEST_FETCH_YOUTUBE_CONTENT: 'ingest:fetch-youtube-content',
  ANALYZE_LLM: 'analyze:llm',
} as const;

// Job data types
export interface IngestPullJobData {
  source: 'rss' | 'youtube';
}

export interface IngestSourceJobData {
  sourceId: string;
  kind: 'rss' | 'youtube';
}

export interface FetchContentJobData {
  rawItemIds: string[];
}

export interface YouTubeExtractionJobData {
  rawItemIds: string[];
  videoId: string;
  sourceKind: string;
}

export interface AnalyzeJobData {
  storyId: string;
}

/**
 * Sets up all job queues
 */
export async function createJobQueues(boss: PgBoss): Promise<void> {
  log('job_queues_creating', { count: Object.keys(QUEUES).length });

  await Promise.all([
    boss.createQueue(QUEUES.SYSTEM_HEARTBEAT),
    boss.createQueue(QUEUES.INGEST_PULL),
    boss.createQueue(QUEUES.INGEST_SOURCE),
    boss.createQueue(QUEUES.INGEST_FETCH_CONTENT),
    boss.createQueue(QUEUES.INGEST_FETCH_YOUTUBE_CONTENT),
    boss.createQueue(QUEUES.ANALYZE_LLM),
  ]);

  log('job_queues_created', { queues: Object.values(QUEUES) });
}

/**
 * Sets up scheduled jobs (cron-based)
 */
export async function scheduleRecurringJobs(boss: PgBoss): Promise<void> {
  log('scheduled_jobs_creating', {});

  // System heartbeat every 5 minutes
  await boss.schedule(
    QUEUES.SYSTEM_HEARTBEAT,
    '*/5 * * * *',
    { ping: 'ok' },
    { tz: JOB_CONFIG.CRON_TZ }
  );

  // RSS ingest every 5 minutes
  await boss.schedule(
    QUEUES.INGEST_PULL,
    '*/5 * * * *',
    { source: 'rss' } as IngestPullJobData,
    { tz: JOB_CONFIG.CRON_TZ }
  );

  // YouTube ingest every 15 minutes
  await boss.schedule(
    QUEUES.INGEST_PULL,
    '*/15 * * * *',
    { source: 'youtube' } as IngestPullJobData,
    { tz: JOB_CONFIG.CRON_TZ }
  );

  log('scheduled_jobs_created', { timezone: JOB_CONFIG.CRON_TZ });
}

/**
 * Triggers initial jobs on startup for faster feedback
 */
export async function triggerStartupJobs(boss: PgBoss): Promise<void> {
  try {
    await boss.send(QUEUES.INGEST_PULL, { source: 'rss' } as IngestPullJobData);
    await boss.send(QUEUES.INGEST_PULL, {
      source: 'youtube',
    } as IngestPullJobData);
    log('startup_jobs_queued', { when: 'startup' });
  } catch (e) {
    log('startup_jobs_error', { err: String(e) }, 'warn');
  }
}

/**
 * Sets up all job workers
 */
export async function setupJobWorkers(
  boss: PgBoss,
  _orchestrator: JobOrchestrator
): Promise<void> {
  log('job_workers_setting_up', {});

  // System heartbeat worker
  await boss.work(
    QUEUES.SYSTEM_HEARTBEAT,
    { batchSize: JOB_CONFIG.HEARTBEAT_BATCH },
    async (jobs) => {
      for (const job of jobs) {
        log('heartbeat', { jobId: job.id, data: job.data });
        await boss.complete(QUEUES.SYSTEM_HEARTBEAT, job.id);
      }
    }
  );

  // Ingest pull worker (handles scheduled RSS/YouTube ingests)
  await boss.work(
    QUEUES.INGEST_PULL,
    { batchSize: JOB_CONFIG.INGEST_PULL_BATCH },
    async (jobs) => {
      for (const job of jobs) {
        await processIngestPullJob(boss, job);
      }
    }
  );

  // Individual source ingest worker
  await boss.work(
    QUEUES.INGEST_SOURCE,
    { batchSize: JOB_CONFIG.INGEST_PULL_BATCH },
    async (jobs) => {
      for (const job of jobs) {
        await processIngestSourceJob(boss, job);
      }
    }
  );

  // Content extraction worker
  await boss.work(
    QUEUES.INGEST_FETCH_CONTENT,
    { batchSize: JOB_CONFIG.CONTENT_FETCH_BATCH },
    async (jobs) => {
      for (const job of jobs) {
        await processContentExtractionJob(boss, job);
      }
    }
  );

  // YouTube content extraction worker
  await boss.work(
    QUEUES.INGEST_FETCH_YOUTUBE_CONTENT,
    { batchSize: JOB_CONFIG.YT_FETCH_BATCH },
    async (jobs) => {
      for (const job of jobs) {
        await processYouTubeExtractionJob(boss, job);
      }
    }
  );

  // Story analysis worker
  await boss.work(
    QUEUES.ANALYZE_LLM,
    { batchSize: JOB_CONFIG.CONTENT_FETCH_BATCH },
    async (jobs) => {
      for (const job of jobs) {
        await processAnalysisJob(boss, job);
      }
    }
  );

  log('job_workers_ready', { workers: Object.keys(QUEUES).length });
}

// Job processing functions (extracted from worker.ts for clarity)

async function processIngestPullJob(
  boss: PgBoss,
  job: { id: string; data?: unknown }
): Promise<void> {
  const { source } = (job.data || {}) as IngestPullJobData;
  log('ingest_pull_start', { jobId: job.id, source });

  if (source === 'rss') {
    await handleRssIngest(boss);
  } else if (source === 'youtube') {
    await handleYouTubeIngest(boss);
  }

  await boss.complete(QUEUES.INGEST_PULL, job.id);
  log('ingest_pull_done', { jobId: job.id, source });
}

async function processIngestSourceJob(
  boss: PgBoss,
  job: { id: string; data?: unknown }
): Promise<void> {
  const { sourceId, kind } = (job.data || {}) as IngestSourceJobData;
  log('ingest_source_start', { jobId: job.id, sourceId, kind });

  try {
    await ingestSourceById(boss, sourceId);
    await boss.complete(QUEUES.INGEST_SOURCE, job.id);
  } catch (err) {
    await boss.fail(QUEUES.INGEST_SOURCE, job.id, { error: String(err) });
  }

  log('ingest_source_done', { jobId: job.id, sourceId });
}

async function processContentExtractionJob(
  boss: PgBoss,
  job: { id: string; data?: unknown }
): Promise<void> {
  log('fetch_content_start', { jobId: job.id });
  try {
    const { extractArticle } = await import('../tasks/extract-article.js');
    await extractArticle(job.data as FetchContentJobData, boss);
    await boss.complete(QUEUES.INGEST_FETCH_CONTENT, job.id);
  } catch (err) {
    await boss.fail(QUEUES.INGEST_FETCH_CONTENT, job.id, {
      error: String(err),
    });
  }
  log('fetch_content_done', { jobId: job.id });
}

async function processYouTubeExtractionJob(
  boss: PgBoss,
  job: { id: string; data?: unknown }
): Promise<void> {
  log('fetch_youtube_content_start', { jobId: job.id });
  try {
    const { extractYouTubeContent } = await import(
      '../tasks/extract-youtube-content.js'
    );
    await extractYouTubeContent(job.data as YouTubeExtractionJobData, boss);
    await boss.complete(QUEUES.INGEST_FETCH_YOUTUBE_CONTENT, job.id);
  } catch (err) {
    await boss.fail(QUEUES.INGEST_FETCH_YOUTUBE_CONTENT, job.id, {
      error: String(err),
    });
  }
  log('fetch_youtube_content_done', { jobId: job.id });
}

async function processAnalysisJob(
  boss: PgBoss,
  job: { id: string; data?: unknown }
): Promise<void> {
  const { storyId } = (job.data as AnalyzeJobData) || {};
  log('analyze_llm_start', { jobId: job.id, storyId });
  try {
    if (!storyId) {
      throw new Error('Missing storyId in job data');
    }
    const { analyzeStory } = await import('../tasks/analyze-story.js');
    await analyzeStory(storyId);
    await boss.complete(QUEUES.ANALYZE_LLM, job.id);
  } catch (err) {
    await boss.fail(QUEUES.ANALYZE_LLM, job.id, { error: String(err) });
  }
  log('analyze_llm_done', { jobId: job.id, storyId });
}

// Helper functions (moved from worker.ts)

async function handleRssIngest(boss: PgBoss): Promise<void> {
  const { getRssSources } = await import('../db.js');
  const { ingestRssSource } = await import('../tasks/ingest-rss-source.js');

  const sources = await getRssSources();
  for (const src of sources) {
    if (!src.url) {
      continue;
    }
    await ingestRssSource(boss, { id: src.id, url: src.url });
  }
}

async function handleYouTubeIngest(boss: PgBoss): Promise<void> {
  if (!process.env.YOUTUBE_API_KEY) {
    log('ingest_youtube_skipped', { reason: 'missing_api_key' }, 'warn');
    return;
  }

  const { getYouTubeSources, upsertPlatformQuota } = await import('../db.js');
  const { ingestYouTubeSource } = await import(
    '../tasks/ingest-youtube-source.js'
  );
  const { quotaTracker } = await import('../utils/quota-tracker.js');

  const sources = await getYouTubeSources();
  log('ingest_youtube_start', { sourceCount: sources.length });

  for (const src of sources) {
    await ingestYouTubeSource(boss, src);
  }

  // Update quota tracking
  const status = quotaTracker.checkQuotaStatus();
  try {
    const resetHour = Number(process.env.YOUTUBE_QUOTA_RESET_HOUR || '0') || 0;
    const now = new Date();
    const resetAt = computeQuotaResetAt(now, resetHour);
    await upsertPlatformQuota('youtube', {
      limit: Number(process.env.YOUTUBE_QUOTA_LIMIT || '10000'),
      used: status.used,
      remaining: status.remaining,
      reset_at: resetAt.toISOString(),
    });
  } catch (e) {
    log('platform_quota_update_error', { error: String(e) }, 'debug');
  }

  log('ingest_youtube_complete', { sourcesProcessed: sources.length });
}

async function ingestSourceById(boss: PgBoss, sourceId: string): Promise<void> {
  const pg = (await import('../db.js')).default;
  const { rows } = await pg.query(
    'select id, kind from public.sources where id = $1',
    [sourceId]
  );
  const row = rows[0];

  if (!row) {
    throw new Error('not_found');
  }

  if (row.kind === 'rss' || row.kind === 'podcast') {
    const { ingestRssSource } = await import('../tasks/ingest-rss-source.js');
    const { getSourceById } = await import('../db.js');
    const srcFull = await getSourceById(sourceId);
    if (!srcFull?.url) {
      throw new Error('no_url_for_source');
    }
    await ingestRssSource(boss, { id: sourceId, url: srcFull.url });
    return;
  }

  if (row.kind === 'youtube_channel' || row.kind === 'youtube_search') {
    const { ingestYouTubeSource } = await import(
      '../tasks/ingest-youtube-source.js'
    );
    const { getSourceById } = await import('../db.js');
    const srcFull = await getSourceById(sourceId);
    if (!srcFull) {
      throw new Error('not_found');
    }
    await ingestYouTubeSource(boss, srcFull);
    return;
  }

  throw new Error('unsupported_kind');
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
