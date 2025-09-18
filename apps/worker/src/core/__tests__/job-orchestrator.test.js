/**
 * Unit tests for Job Orchestrator
 *
 * Tests the central job triggering system to ensure all methods
 * work correctly and consistently trigger the right jobs.
 */

import assert from 'node:assert/strict';
import { describe, mock, test } from 'node:test';
import { createJobOrchestrator } from '../job-orchestrator.js';

describe('Job Orchestrator', () => {
  test('should create orchestrator with all required methods', () => {
    const mockBoss = createMockBoss();
    const orchestrator = createJobOrchestrator(mockBoss);

    // Verify all expected methods exist
    const expectedMethods = [
      'triggerRssIngest',
      'triggerRssSourceIngest',
      'triggerYouTubeIngest',
      'triggerYouTubeSourceIngest',
      'triggerContentExtraction',
      'triggerYouTubeContentExtraction',
      'triggerStoryAnalysis',
      'triggerOneOffIngest',
    ];

    for (const method of expectedMethods) {
      assert.strictEqual(
        typeof orchestrator[method],
        'function',
        `Missing method: ${method}`
      );
    }
  });

  test('triggerRssIngest should send correct job', async () => {
    const mockBoss = createMockBoss();
    const orchestrator = createJobOrchestrator(mockBoss);

    await orchestrator.triggerRssIngest();

    assert.strictEqual(mockBoss.sendCalls.length, 1);
    assert.strictEqual(mockBoss.sendCalls[0].queue, 'ingest:pull');
    assert.deepStrictEqual(mockBoss.sendCalls[0].data, { source: 'rss' });
  });

  test('triggerYouTubeIngest should send correct job', async () => {
    const mockBoss = createMockBoss();
    const orchestrator = createJobOrchestrator(mockBoss);

    await orchestrator.triggerYouTubeIngest();

    assert.strictEqual(mockBoss.sendCalls.length, 1);
    assert.strictEqual(mockBoss.sendCalls[0].queue, 'ingest:pull');
    assert.deepStrictEqual(mockBoss.sendCalls[0].data, { source: 'youtube' });
  });

  test('triggerRssSourceIngest should send correct job', async () => {
    const mockBoss = createMockBoss();
    const orchestrator = createJobOrchestrator(mockBoss);

    await orchestrator.triggerRssSourceIngest('source-123');

    assert.strictEqual(mockBoss.sendCalls.length, 1);
    assert.strictEqual(mockBoss.sendCalls[0].queue, 'ingest:source');
    assert.deepStrictEqual(mockBoss.sendCalls[0].data, {
      sourceId: 'source-123',
      kind: 'rss',
    });
  });

  test('triggerYouTubeSourceIngest should send correct job', async () => {
    const mockBoss = createMockBoss();
    const orchestrator = createJobOrchestrator(mockBoss);

    await orchestrator.triggerYouTubeSourceIngest('yt-source-456');

    assert.strictEqual(mockBoss.sendCalls.length, 1);
    assert.strictEqual(mockBoss.sendCalls[0].queue, 'ingest:source');
    assert.deepStrictEqual(mockBoss.sendCalls[0].data, {
      sourceId: 'yt-source-456',
      kind: 'youtube',
    });
  });

  test('triggerContentExtraction should send correct job', async () => {
    const mockBoss = createMockBoss();
    const orchestrator = createJobOrchestrator(mockBoss);

    const rawItemIds = ['item1', 'item2', 'item3'];
    await orchestrator.triggerContentExtraction(rawItemIds);

    assert.strictEqual(mockBoss.sendCalls.length, 1);
    assert.strictEqual(mockBoss.sendCalls[0].queue, 'ingest:fetch-content');
    assert.deepStrictEqual(mockBoss.sendCalls[0].data, { rawItemIds });
  });

  test('triggerYouTubeContentExtraction should send correct job', async () => {
    const mockBoss = createMockBoss();
    const orchestrator = createJobOrchestrator(mockBoss);

    const data = {
      rawItemIds: ['yt-item1'],
      videoId: 'abc123',
      sourceKind: 'youtube_channel',
    };

    await orchestrator.triggerYouTubeContentExtraction(data);

    assert.strictEqual(mockBoss.sendCalls.length, 1);
    assert.strictEqual(
      mockBoss.sendCalls[0].queue,
      'ingest:fetch-youtube-content'
    );
    assert.deepStrictEqual(mockBoss.sendCalls[0].data, data);
  });

  test('triggerStoryAnalysis should send correct job', async () => {
    const mockBoss = createMockBoss();
    const orchestrator = createJobOrchestrator(mockBoss);

    await orchestrator.triggerStoryAnalysis('story-789');

    assert.strictEqual(mockBoss.sendCalls.length, 1);
    assert.strictEqual(mockBoss.sendCalls[0].queue, 'analyze:llm');
    assert.deepStrictEqual(mockBoss.sendCalls[0].data, {
      storyId: 'story-789',
    });
  });

  test('triggerOneOffIngest should process URLs correctly', async () => {
    // Mock the database functions
    const originalImport = global.import;
    global.import = mock.fn(async (path) => {
      if (path === '../db.js') {
        return {
          getOrCreateManualSource: mock.fn(async () => 'mock-source-id'),
          upsertDiscovery: mock.fn(async () => 'mock-raw-item-id'),
        };
      }
      return originalImport(path);
    });

    const mockBoss = createMockBoss();
    const orchestrator = createJobOrchestrator(mockBoss);

    const urls = [
      'https://example.com/article',
      'https://youtube.com/watch?v=abc123',
    ];

    const results = await orchestrator.triggerOneOffIngest(urls);

    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].type, 'article');
    assert.strictEqual(results[1].type, 'youtube');
    assert.strictEqual(results[0].raw_item_id, 'mock-raw-item-id');
    assert.strictEqual(results[1].raw_item_id, 'mock-raw-item-id');

    // Should have sent jobs for both items
    assert.strictEqual(mockBoss.sendCalls.length, 2);

    // Restore original import
    global.import = originalImport;
  });

  test('should handle errors gracefully', async () => {
    const mockBoss = {
      send: mock.fn(async () => {
        throw new Error('Mock boss error');
      }),
    };

    const orchestrator = createJobOrchestrator(mockBoss);

    // Should propagate errors
    await assert.rejects(
      () => orchestrator.triggerRssIngest(),
      /Mock boss error/
    );
  });
});

/**
 * Create a mock pg-boss instance for testing
 */
function createMockBoss() {
  const sendCalls = [];

  return {
    sendCalls, // Expose for assertions
    send: mock.fn(async (queue, data) => {
      sendCalls.push({ queue, data });
      return 'mock-job-id';
    }),
  };
}
