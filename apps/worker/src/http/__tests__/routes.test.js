/**
 * Unit tests for HTTP Routes
 *
 * Tests the HTTP endpoint system to ensure all routes work correctly
 * and properly delegate to the job orchestrator.
 */

import assert from 'node:assert/strict';
import { describe, mock, test } from 'node:test';
import express from 'express';
import { setupRoutes } from '../routes.js';

describe('HTTP Routes', () => {
  test('should set up health routes', async () => {
    const { app, orchestrator } = createTestApp();

    // Test basic health check
    const healthResponse = await makeRequest(app, 'GET', '/healthz');
    assert.strictEqual(healthResponse.status, 200);
    assert.strictEqual(healthResponse.text, 'ok');
  });

  test('should set up debug status route', async () => {
    const { app, orchestrator } = createTestApp();

    // Mock the database import
    mockDatabaseImport();

    const statusResponse = await makeRequest(app, 'GET', '/debug/status');
    assert.strictEqual(statusResponse.status, 200);

    const statusData = JSON.parse(statusResponse.text);
    assert.strictEqual(statusData.ok, true);
    assert.ok('sources' in statusData);
    assert.ok('raw' in statusData);
    assert.ok('contents' in statusData);
    assert.ok('jobs' in statusData);
  });

  test('POST /debug/ingest-now should trigger RSS ingest', async () => {
    const { app, orchestrator } = createTestApp();

    const response = await makeRequest(app, 'POST', '/debug/ingest-now');
    assert.strictEqual(response.status, 200);

    const data = JSON.parse(response.text);
    assert.strictEqual(data.ok, true);

    // Verify orchestrator was called
    assert.strictEqual(orchestrator.triggerRssIngest.mock.callCount(), 1);
  });

  test('POST /debug/ingest-youtube should trigger YouTube ingest', async () => {
    const { app, orchestrator } = createTestApp();

    const response = await makeRequest(app, 'POST', '/debug/ingest-youtube');
    assert.strictEqual(response.status, 200);

    const data = JSON.parse(response.text);
    assert.strictEqual(data.ok, true);

    // Verify orchestrator was called
    assert.strictEqual(orchestrator.triggerYouTubeIngest.mock.callCount(), 1);
  });

  test('POST /debug/ingest-source should trigger specific source ingest', async () => {
    const { app, orchestrator } = createTestApp();

    // Mock database query for source type
    mockDatabaseImport({
      queryResult: [{ kind: 'rss' }],
    });

    const response = await makeRequest(
      app,
      'POST',
      '/debug/ingest-source?sourceId=test-source'
    );
    assert.strictEqual(response.status, 200);

    const data = JSON.parse(response.text);
    assert.strictEqual(data.ok, true);

    // Verify orchestrator was called with correct source ID
    assert.strictEqual(orchestrator.triggerRssSourceIngest.mock.callCount(), 1);
    assert.deepStrictEqual(
      orchestrator.triggerRssSourceIngest.mock.calls[0].arguments,
      ['test-source']
    );
  });

  test('POST /debug/ingest-source should handle YouTube sources', async () => {
    const { app, orchestrator } = createTestApp();

    // Mock database query for YouTube source
    mockDatabaseImport({
      queryResult: [{ kind: 'youtube_channel' }],
    });

    const response = await makeRequest(
      app,
      'POST',
      '/debug/ingest-source?sourceId=yt-source'
    );
    assert.strictEqual(response.status, 200);

    // Verify YouTube orchestrator was called
    assert.strictEqual(
      orchestrator.triggerYouTubeSourceIngest.mock.callCount(),
      1
    );
    assert.deepStrictEqual(
      orchestrator.triggerYouTubeSourceIngest.mock.calls[0].arguments,
      ['yt-source']
    );
  });

  test('POST /debug/ingest-source should return 404 for missing source', async () => {
    const { app, orchestrator } = createTestApp();

    // Mock database query with no results
    mockDatabaseImport({
      queryResult: [],
    });

    const response = await makeRequest(
      app,
      'POST',
      '/debug/ingest-source?sourceId=missing'
    );
    assert.strictEqual(response.status, 404);

    const data = JSON.parse(response.text);
    assert.strictEqual(data.ok, false);
    assert.strictEqual(data.error, 'not_found');
  });

  test('POST /debug/ingest-source should return 400 for missing sourceId', async () => {
    const { app, orchestrator } = createTestApp();

    const response = await makeRequest(app, 'POST', '/debug/ingest-source');
    assert.strictEqual(response.status, 400);

    const data = JSON.parse(response.text);
    assert.strictEqual(data.ok, false);
    assert.strictEqual(data.error, 'missing_sourceId');
  });

  test('POST /debug/ingest-oneoff should process URLs', async () => {
    const { app, orchestrator } = createTestApp();

    const urls = [
      'https://example.com/article',
      'https://youtube.com/watch?v=abc',
    ];
    const mockResults = [
      { url: urls[0], ok: true, raw_item_id: 'item1', type: 'article' },
      { url: urls[1], ok: true, raw_item_id: 'item2', type: 'youtube' },
    ];

    orchestrator.triggerOneOffIngest.mock.mockImplementation(
      async () => mockResults
    );

    const response = await makeRequest(app, 'POST', '/debug/ingest-oneoff', {
      urls,
    });
    assert.strictEqual(response.status, 200);

    const data = JSON.parse(response.text);
    assert.strictEqual(data.ok, true);
    assert.deepStrictEqual(data.results, mockResults);

    // Verify orchestrator was called with URLs
    assert.strictEqual(orchestrator.triggerOneOffIngest.mock.callCount(), 1);
    assert.deepStrictEqual(
      orchestrator.triggerOneOffIngest.mock.calls[0].arguments,
      [urls]
    );
  });

  test('POST /debug/ingest-oneoff should return 400 for no URLs', async () => {
    const { app, orchestrator } = createTestApp();

    const response = await makeRequest(app, 'POST', '/debug/ingest-oneoff', {
      urls: [],
    });
    assert.strictEqual(response.status, 400);

    const data = JSON.parse(response.text);
    assert.strictEqual(data.ok, false);
    assert.strictEqual(data.error, 'no_urls');
  });

  test('should handle orchestrator errors gracefully', async () => {
    const { app, orchestrator } = createTestApp();

    // Make orchestrator throw an error
    orchestrator.triggerRssIngest.mock.mockImplementation(async () => {
      throw new Error('Mock orchestrator error');
    });

    const response = await makeRequest(app, 'POST', '/debug/ingest-now');
    assert.strictEqual(response.status, 503);

    const data = JSON.parse(response.text);
    assert.strictEqual(data.ok, false);
    assert.ok(data.error.includes('Mock orchestrator error'));
  });

  test('legacy scheduling endpoints should return helpful messages', async () => {
    const { app, orchestrator } = createTestApp();

    const rssResponse = await makeRequest(app, 'POST', '/debug/schedule-rss');
    assert.strictEqual(rssResponse.status, 200);

    const rssData = JSON.parse(rssResponse.text);
    assert.strictEqual(rssData.ok, true);
    assert.ok(rssData.message.includes('automatic'));

    const youtubeResponse = await makeRequest(
      app,
      'POST',
      '/debug/schedule-youtube'
    );
    assert.strictEqual(youtubeResponse.status, 200);

    const youtubeData = JSON.parse(youtubeResponse.text);
    assert.strictEqual(youtubeData.ok, true);
    assert.ok(youtubeData.message.includes('automatic'));
  });
});

/**
 * Create a test Express app with mocked orchestrator
 */
function createTestApp() {
  const app = express();
  app.use(express.json());

  const orchestrator = {
    triggerRssIngest: mock.fn(async () => {}),
    triggerYouTubeIngest: mock.fn(async () => {}),
    triggerRssSourceIngest: mock.fn(async () => {}),
    triggerYouTubeSourceIngest: mock.fn(async () => {}),
    triggerOneOffIngest: mock.fn(async () => []),
  };

  setupRoutes(app, orchestrator);

  return { app, orchestrator };
}

/**
 * Make a request to the Express app
 */
async function makeRequest(app, method, path, body = null) {
  return new Promise((resolve) => {
    const req = {
      method,
      url: path,
      headers: { 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      query: {},
      params: {},
    };

    // Parse query string
    if (path.includes('?')) {
      const [pathname, queryString] = path.split('?');
      req.url = pathname;
      const params = new URLSearchParams(queryString);
      for (const [key, value] of params) {
        req.query[key] = value;
      }
    }

    // Parse body if present
    if (req.body) {
      try {
        req.body = JSON.parse(req.body);
      } catch {
        // Keep as string if not JSON
      }
    }

    const res = {
      text: '',
      headers: {},

      status(code) {
        this.status = code;
        return this;
      },

      send(data) {
        this.text = data;
        resolve(this);
        return this;
      },

      json(data) {
        this.text = JSON.stringify(data);
        resolve(this);
        return this;
      },
    };

    // Find matching route and call handler
    const routes = app._router?.stack || [];
    for (const layer of routes) {
      if (
        layer.route &&
        layer.route.path === req.url &&
        layer.route.methods[method.toLowerCase()]
      ) {
        try {
          layer.route.stack[0].handle(req, res);
        } catch (error) {
          res.status(500).json({ ok: false, error: error.message });
        }
        return;
      }
    }

    // No route found
    res.status(404).send('Not Found');
  });
}

/**
 * Mock the database import for testing
 */
function mockDatabaseImport(options = {}) {
  const { queryResult = [{ sources_rss: 5 }] } = options;

  const originalImport = global.import;
  global.import = mock.fn(async (path) => {
    if (path === '../db.js') {
      return {
        default: {
          query: mock.fn(async () => ({ rows: queryResult })),
        },
      };
    }
    return originalImport(path);
  });
}
