/**
 * HTTP Routes - All worker HTTP endpoints in one place
 *
 * This module handles all HTTP endpoints for the worker service.
 * All endpoints delegate to the job orchestrator for consistency.
 *
 * Route Categories:
 * - Health: service health checks
 * - Debug: development and admin tools
 * - Preview: source preview functionality
 */

import type express from "express";
import type { JobOrchestrator } from "../core/job-orchestrator.js";
import { log } from "../log.js";

// HTTP status codes
const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_SERVICE_UNAVAILABLE = 503;

// Configuration
const DEFAULT_PREVIEW_LIMIT = 10;
const MAX_PREVIEW_LIMIT = 50;

/**
 * Sets up all HTTP routes for the worker service
 */
export function setupRoutes(
  app: express.Express,
  orchestrator: JobOrchestrator,
): void {
  // Health check
  setupHealthRoutes(app);

  // Debug routes for development and admin
  setupDebugRoutes(app, orchestrator);

  // Preview routes for source testing
  setupPreviewRoutes(app);

  log("http_routes_setup", { routes: "health, debug, preview" });
}

/**
 * Health check routes
 */
function setupHealthRoutes(app: express.Express): void {
  app.get("/healthz", (_req, res) => {
    res.status(HTTP_OK).send("ok");
  });

  app.get("/debug/status", async (_req, res) => {
    try {
      const pg = (await import("../db.js")).default;
      const [
        { rows: sources },
        { rows: rawItemCounts },
        { rows: contentCounts },
        { rows: jobStats },
      ] = await Promise.all([
        pg.query(
          "select count(*)::int as sources_rss from public.sources where type = 'rss' and url is not null",
        ),
        pg.query(
          "select count(*)::int as raw_items_total, count(*) filter (where created_at > now() - interval '24 hours')::int as raw_items_24h from public.raw_items",
        ),
        pg.query("select count(*)::int as contents_total from public.contents"),
        pg.query(
          "select name, state, count(*)::int as count from pgboss.job group by 1,2 order by 1,2",
        ),
      ]);

      res.json({
        ok: true,
        sources: sources[0],
        raw_items: rawItemCounts[0],
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

/**
 * Debug routes for manual job triggering
 */
function setupDebugRoutes(
  app: express.Express,
  orchestrator: JobOrchestrator,
): void {
  // Trigger RSS ingest
  app.post("/debug/ingest-now", async (_req, res) => {
    try {
      await orchestrator.triggerRssIngest();
      res.json({ ok: true });
    } catch (e: unknown) {
      res
        .status(HTTP_SERVICE_UNAVAILABLE)
        .json({ ok: false, error: String(e) });
    }
  });

  // Trigger YouTube ingest
  app.post("/debug/ingest-youtube", async (_req, res) => {
    try {
      await orchestrator.triggerYouTubeIngest();
      res.json({ ok: true });
    } catch (e: unknown) {
      res
        .status(HTTP_SERVICE_UNAVAILABLE)
        .json({ ok: false, error: String(e) });
    }
  });

  // Trigger specific source ingest
  app.post("/debug/ingest-source", async (req, res) => {
    try {
      const sourceId =
        (req.query.sourceId as string) || (req.body?.sourceId as string) || "";
      if (!sourceId) {
        return res
          .status(HTTP_BAD_REQUEST)
          .json({ ok: false, error: "missing_sourceId" });
      }

      // Determine source type and trigger appropriate ingest
      const pg = (await import("../db.js")).default;
      const { rows } = await pg.query(
        "select type from public.sources where id = $1",
        [sourceId],
      );
      const source = rows[0];

      const sourceKind = source?.type as string | undefined;

      if (!source) {
        return res
          .status(HTTP_NOT_FOUND)
          .json({ ok: false, error: "not_found" });
      }

      if (sourceKind === "rss" || sourceKind === "podcast") {
        await orchestrator.triggerRssSourceIngest(sourceId);
      } else if (
        sourceKind === "youtube_channel" ||
        sourceKind === "youtube_search"
      ) {
        await orchestrator.triggerYouTubeSourceIngest(sourceId);
      } else {
        return res
          .status(HTTP_BAD_REQUEST)
          .json({ ok: false, error: "unsupported_kind" });
      }

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

  // One-off URL ingestion
  app.post("/debug/ingest-oneoff", async (req, res) => {
    try {
      const body = (req.body || {}) as { urls?: string[] };
      const urls = Array.isArray(body.urls) ? body.urls.filter(Boolean) : [];

      if (urls.length === 0) {
        return res
          .status(HTTP_BAD_REQUEST)
          .json({ ok: false, error: "no_urls" });
      }

      const results = await orchestrator.triggerOneOffIngest(urls);
      res.json({ ok: true, results });
    } catch (e: unknown) {
      res
        .status(HTTP_SERVICE_UNAVAILABLE)
        .json({ ok: false, error: String(e) });
    }
  });

  // Legacy scheduling endpoints (kept for compatibility)
  app.post("/debug/schedule-rss", async (_req, res) => {
    res.json({
      ok: true,
      message:
        "RSS scheduling is automatic. Use /debug/ingest-now for manual trigger.",
    });
  });

  app.post("/debug/schedule-youtube", async (_req, res) => {
    res.json({
      ok: true,
      message:
        "YouTube scheduling is automatic. Use /debug/ingest-youtube for manual trigger.",
    });
  });
}

/**
 * Preview routes for testing sources
 */
function setupPreviewRoutes(app: express.Express): void {
  app.get("/debug/preview-source", async (req, res) => {
    try {
      const sourceId = (req.query.sourceId as string) || "";
      const rawLimit = Number.parseInt(
        String(req.query.limit ?? DEFAULT_PREVIEW_LIMIT),
        10,
      );
      const limit = Math.min(
        Number.isNaN(rawLimit) ? DEFAULT_PREVIEW_LIMIT : rawLimit,
        MAX_PREVIEW_LIMIT,
      );

      if (!sourceId) {
        return res
          .status(HTTP_BAD_REQUEST)
          .json({ ok: false, error: "missing sourceId" });
      }

      const pg = (await import("../db.js")).default;
      const { rows } = await pg.query(
        "select id, kind, url, name, domain, metadata from public.sources where id = $1",
        [sourceId],
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
  });
}

/**
 * Helper function to compute preview results for different source types
 */
async function computePreviewResultForSource(
  src: { id: string; url?: string; kind: string },
  limit: number,
): Promise<unknown> {
  if (src.kind === "rss" || src.kind === "podcast") {
    const { previewRssSourceAction } = await import(
      "../tasks/preview-rss-source.js"
    );
    return previewRssSourceAction({ id: src.id, url: src.url ?? "" }, limit);
  }

  if (src.kind === "youtube_channel" || src.kind === "youtube_search") {
    const { previewYouTubeSourceAction } = await import(
      "../tasks/preview-youtube-source.js"
    );
    return previewYouTubeSourceAction(src, limit);
  }

  throw new Error("unsupported_kind");
}
