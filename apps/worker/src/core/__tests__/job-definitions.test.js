/**
 * Unit tests for Job Definitions
 *
 * Tests the job configuration system to ensure queues, workers,
 * and schedules are set up correctly.
 */

import assert from 'node:assert/strict';
import { describe, mock, test } from 'node:test';
import {
  JOB_CONFIG,
  QUEUES,
  createJobQueues,
  scheduleRecurringJobs,
  setupJobWorkers,
  triggerStartupJobs,
} from '../job-definitions.js';

describe('Job Definitions', () => {
  test('QUEUES should contain all expected queue names', () => {
    const expectedQueues = [
      'SYSTEM_HEARTBEAT',
      'INGEST_PULL',
      'INGEST_SOURCE',
      'INGEST_FETCH_CONTENT',
      'INGEST_FETCH_YOUTUBE_CONTENT',
      'ANALYZE_LLM',
    ];

    for (const queueKey of expectedQueues) {
      assert.ok(queueKey in QUEUES, `Missing queue: ${queueKey}`);
      assert.strictEqual(
        typeof QUEUES[queueKey],
        'string',
        `Queue ${queueKey} should be string`
      );
    }

    // Verify queue names follow expected pattern
    assert.strictEqual(QUEUES.SYSTEM_HEARTBEAT, 'system:heartbeat');
    assert.strictEqual(QUEUES.INGEST_PULL, 'ingest:pull');
    assert.strictEqual(QUEUES.INGEST_SOURCE, 'ingest:source');
    assert.strictEqual(QUEUES.INGEST_FETCH_CONTENT, 'ingest:fetch-content');
    assert.strictEqual(
      QUEUES.INGEST_FETCH_YOUTUBE_CONTENT,
      'ingest:fetch-youtube-content'
    );
    assert.strictEqual(QUEUES.ANALYZE_LLM, 'analyze:llm');
  });

  test('JOB_CONFIG should contain all expected configuration', () => {
    const expectedConfigs = [
      'HEARTBEAT_BATCH',
      'INGEST_PULL_BATCH',
      'CONTENT_FETCH_BATCH',
      'YT_FETCH_BATCH',
      'CRON_TZ',
    ];

    for (const configKey of expectedConfigs) {
      assert.ok(configKey in JOB_CONFIG, `Missing config: ${configKey}`);
    }

    // Verify types
    assert.strictEqual(typeof JOB_CONFIG.HEARTBEAT_BATCH, 'number');
    assert.strictEqual(typeof JOB_CONFIG.INGEST_PULL_BATCH, 'number');
    assert.strictEqual(typeof JOB_CONFIG.CONTENT_FETCH_BATCH, 'number');
    assert.strictEqual(typeof JOB_CONFIG.YT_FETCH_BATCH, 'number');
    assert.strictEqual(typeof JOB_CONFIG.CRON_TZ, 'string');
  });

  test('createJobQueues should create all queues', async () => {
    const mockBoss = createMockBoss();

    await createJobQueues(mockBoss);

    // Should create all queues
    assert.strictEqual(
      mockBoss.createQueueCalls.length,
      Object.keys(QUEUES).length
    );

    // Verify all queue names were created
    const createdQueues = mockBoss.createQueueCalls.map(
      (call) => call.queueName
    );
    const expectedQueues = Object.values(QUEUES);

    for (const expectedQueue of expectedQueues) {
      assert.ok(
        createdQueues.includes(expectedQueue),
        `Queue not created: ${expectedQueue}`
      );
    }
  });

  test('scheduleRecurringJobs should schedule all recurring jobs', async () => {
    const mockBoss = createMockBoss();

    await scheduleRecurringJobs(mockBoss);

    // Should schedule 3 recurring jobs: heartbeat, rss, youtube
    assert.strictEqual(mockBoss.scheduleCalls.length, 3);

    // Verify heartbeat schedule
    const heartbeatSchedule = mockBoss.scheduleCalls.find(
      (call) => call.queueName === QUEUES.SYSTEM_HEARTBEAT
    );
    assert.ok(heartbeatSchedule, 'Heartbeat schedule not found');
    assert.strictEqual(heartbeatSchedule.cron, '*/5 * * * *');
    assert.deepStrictEqual(heartbeatSchedule.data, { ping: 'ok' });

    // Verify RSS schedule
    const rssSchedule = mockBoss.scheduleCalls.find(
      (call) =>
        call.queueName === QUEUES.INGEST_PULL && call.data.source === 'rss'
    );
    assert.ok(rssSchedule, 'RSS schedule not found');
    assert.strictEqual(rssSchedule.cron, '*/5 * * * *');

    // Verify YouTube schedule
    const youtubeSchedule = mockBoss.scheduleCalls.find(
      (call) =>
        call.queueName === QUEUES.INGEST_PULL && call.data.source === 'youtube'
    );
    assert.ok(youtubeSchedule, 'YouTube schedule not found');
    assert.strictEqual(youtubeSchedule.cron, '*/15 * * * *');
  });

  test('triggerStartupJobs should send initial jobs', async () => {
    const mockBoss = createMockBoss();

    await triggerStartupJobs(mockBoss);

    // Should send 2 startup jobs: rss and youtube
    assert.strictEqual(mockBoss.sendCalls.length, 2);

    // Verify RSS startup job
    const rssJob = mockBoss.sendCalls.find(
      (call) => call.queue === QUEUES.INGEST_PULL && call.data.source === 'rss'
    );
    assert.ok(rssJob, 'RSS startup job not found');

    // Verify YouTube startup job
    const youtubeJob = mockBoss.sendCalls.find(
      (call) =>
        call.queue === QUEUES.INGEST_PULL && call.data.source === 'youtube'
    );
    assert.ok(youtubeJob, 'YouTube startup job not found');
  });

  test('setupJobWorkers should set up all workers', async () => {
    const mockBoss = createMockBoss();
    const mockOrchestrator = createMockOrchestrator();

    await setupJobWorkers(mockBoss, mockOrchestrator);

    // Should set up workers for all queues
    assert.strictEqual(mockBoss.workCalls.length, Object.keys(QUEUES).length);

    // Verify all queue names have workers
    const workerQueues = mockBoss.workCalls.map((call) => call.queueName);
    const expectedQueues = Object.values(QUEUES);

    for (const expectedQueue of expectedQueues) {
      assert.ok(
        workerQueues.includes(expectedQueue),
        `Worker not set up for: ${expectedQueue}`
      );
    }

    // Verify batch sizes are configured
    for (const workCall of mockBoss.workCalls) {
      assert.ok(
        'batchSize' in workCall.options,
        `Batch size not configured for ${workCall.queueName}`
      );
      assert.strictEqual(typeof workCall.options.batchSize, 'number');
    }
  });

  test('should handle errors in startup jobs gracefully', async () => {
    const mockBoss = {
      send: mock.fn(async () => {
        throw new Error('Mock send error');
      }),
    };

    // Should not throw - errors should be caught and logged
    await assert.doesNotReject(() => triggerStartupJobs(mockBoss));
  });
});

/**
 * Create a mock pg-boss instance for testing
 */
function createMockBoss() {
  const createQueueCalls = [];
  const scheduleCalls = [];
  const sendCalls = [];
  const workCalls = [];

  return {
    createQueueCalls,
    scheduleCalls,
    sendCalls,
    workCalls,

    createQueue: mock.fn(async (queueName) => {
      createQueueCalls.push({ queueName });
    }),

    schedule: mock.fn(async (queueName, cron, data, options) => {
      scheduleCalls.push({ queueName, cron, data, options });
    }),

    send: mock.fn(async (queue, data) => {
      sendCalls.push({ queue, data });
      return 'mock-job-id';
    }),

    work: mock.fn(async (queueName, options, handler) => {
      workCalls.push({ queueName, options, handler });
    }),
  };
}

/**
 * Create a mock orchestrator for testing
 */
function createMockOrchestrator() {
  return {
    triggerRssIngest: mock.fn(),
    triggerYouTubeIngest: mock.fn(),
    triggerContentExtraction: mock.fn(),
    triggerStoryAnalysis: mock.fn(),
  };
}
