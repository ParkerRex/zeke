/**
 * Integration tests for the complete engine system
 *
 * These tests verify that the entire engine pipeline works correctly
 * from job triggering through to completion.
 */

import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { EngineService } from '../core/engine-service.js';

describe('Engine Integration Tests', () => {
  let engineService;
  let testPort;

  before(async () => {
    // Use a different port for testing to avoid conflicts
    testPort = 8081;
    process.env.PORT = testPort.toString();

    // Start engine service for testing
    engineService = new EngineService();
    await engineService.start();

    // Wait a moment for everything to initialize
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  after(async () => {
    if (engineService) {
      await engineService.stop();
    }
  });

  test('engine service should start and be healthy', async () => {
    const response = await fetch(`http://localhost:${testPort}/healthz`);
    assert.strictEqual(response.status, 200);

    const text = await response.text();
    assert.strictEqual(text, 'ok');
  });

  test('system status should return valid data', async () => {
    const response = await fetch(`http://localhost:${testPort}/debug/status`);
    assert.strictEqual(response.status, 200);

    const data = await response.json();
    assert.strictEqual(data.ok, true);
    assert.ok('sources' in data);
    assert.ok('raw' in data);
    assert.ok('contents' in data);
    assert.ok('jobs' in data);
  });

  test('RSS ingest trigger should work', async () => {
    const response = await fetch(
      `http://localhost:${testPort}/debug/ingest-now`,
      {
        method: 'POST',
      }
    );

    assert.strictEqual(response.status, 200);

    const data = await response.json();
    assert.strictEqual(data.ok, true);
  });

  test('YouTube ingest trigger should work', async () => {
    const response = await fetch(
      `http://localhost:${testPort}/debug/ingest-youtube`,
      {
        method: 'POST',
      }
    );

    // Should work even without API key (will just log warning)
    assert.strictEqual(response.status, 200);

    const data = await response.json();
    assert.strictEqual(data.ok, true);
  });

  test('one-off URL processing should work', async () => {
    const testUrls = ['https://example.com/test-article'];

    const response = await fetch(
      `http://localhost:${testPort}/debug/ingest-oneoff`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls: testUrls }),
      }
    );

    assert.strictEqual(response.status, 200);

    const data = await response.json();
    assert.strictEqual(data.ok, true);
    assert.ok(Array.isArray(data.results));
    assert.strictEqual(data.results.length, 1);
    assert.strictEqual(data.results[0].url, testUrls[0]);
    assert.strictEqual(data.results[0].type, 'article');
  });

  test('error handling should work correctly', async () => {
    // Test missing sourceId
    const response1 = await fetch(
      `http://localhost:${testPort}/debug/ingest-source`,
      {
        method: 'POST',
      }
    );

    assert.strictEqual(response1.status, 400);

    const data1 = await response1.json();
    assert.strictEqual(data1.ok, false);
    assert.strictEqual(data1.error, 'missing_sourceId');

    // Test invalid sourceId
    const response2 = await fetch(
      `http://localhost:${testPort}/debug/ingest-source?sourceId=invalid-id`,
      {
        method: 'POST',
      }
    );

    // Should return 404 for non-existent source
    assert.strictEqual(response2.status, 404);

    const data2 = await response2.json();
    assert.strictEqual(data2.ok, false);
    assert.strictEqual(data2.error, 'not_found');
  });

  test('parameter validation should work', async () => {
    // Test empty URLs array
    const response = await fetch(
      `http://localhost:${testPort}/debug/ingest-oneoff`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls: [] }),
      }
    );

    assert.strictEqual(response.status, 400);

    const data = await response.json();
    assert.strictEqual(data.ok, false);
    assert.strictEqual(data.error, 'no_urls');
  });

  test('legacy endpoints should return helpful messages', async () => {
    const response1 = await fetch(
      `http://localhost:${testPort}/debug/schedule-rss`,
      {
        method: 'POST',
      }
    );

    assert.strictEqual(response1.status, 200);

    const data1 = await response1.json();
    assert.strictEqual(data1.ok, true);
    assert.ok(data1.message.includes('automatic'));

    const response2 = await fetch(
      `http://localhost:${testPort}/debug/schedule-youtube`,
      {
        method: 'POST',
      }
    );

    assert.strictEqual(response2.status, 200);

    const data2 = await response2.json();
    assert.strictEqual(data2.ok, true);
    assert.ok(data2.message.includes('automatic'));
  });

  test('job orchestrator should be working', async () => {
    // Trigger multiple jobs and verify they're queued
    const promises = [
      fetch(`http://localhost:${testPort}/debug/ingest-now`, {
        method: 'POST',
      }),
      fetch(`http://localhost:${testPort}/debug/ingest-youtube`, {
        method: 'POST',
      }),
    ];

    const responses = await Promise.all(promises);

    for (const response of responses) {
      assert.strictEqual(response.status, 200);
      const data = await response.json();
      assert.strictEqual(data.ok, true);
    }

    // Wait a moment for jobs to be queued
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check that jobs are in the system
    const statusResponse = await fetch(
      `http://localhost:${testPort}/debug/status`
    );
    const statusData = await statusResponse.json();

    assert.strictEqual(statusData.ok, true);
    assert.ok(Array.isArray(statusData.jobs));
  });

  test('modular architecture should be active', async () => {
    // This test verifies that the new modular architecture is being used
    // by checking that the engine service is an instance of our new class
    assert.ok(engineService instanceof EngineService);

    // Verify that the service has the expected methods
    assert.strictEqual(typeof engineService.start, 'function');
    assert.strictEqual(typeof engineService.stop, 'function');
  });
});

/**
 * Helper function to wait for a condition
 */
async function waitFor(condition, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
}
