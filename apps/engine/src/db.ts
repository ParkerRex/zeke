import { Pool } from "pg";
import { log } from "./log.js";
import { queries } from "./data/db.js";

const cnn = process.env.DATABASE_URL || "";
// Use SSL only for non-local connections. Supabase local Postgres on 127.0.0.1:54322 does not support TLS.
const useSsl = !(
  cnn.includes("127.0.0.1") ||
  cnn.includes("localhost") ||
  cnn.includes("host.docker.internal")
);

const pool = new Pool({
  connectionString: cnn,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  keepAlive: true,
  max: 3,
  idleTimeoutMillis: 30_000, // Increased from 10s to 30s
  query_timeout: 30_000,
  statement_timeout: 30_000,
});

// Prevent process crashes from idle client errors (e.g., Supabase pooler resets)
// See: https://node-postgres.com/features/connecting#idle-clients
pool.on("error", (err) => {
  log("pg_pool_error", { err: String(err) }, "warn");
});

export type SourceRow = {
  id: string;
  kind: string;
  url: string | null;
  name: string | null;
  domain?: string | null;
};

export async function getRssSources(): Promise<SourceRow[]> {
  const sources = await queries.sources.getRssSources();
  return sources.map((s) => ({
    id: s.id,
    kind: s.type, // Map 'type' to 'kind'
    url: s.url,
    name: s.name,
  }));
}

export type YouTubeSourceRow = {
  id: string;
  kind: string;
  url: string | null;
  name: string | null;
  metadata: Record<string, unknown>;
};

export type SourceRowFull = {
  id: string;
  kind: string;
  url: string | null;
  name: string | null;
  domain?: string | null;
  metadata: Record<string, unknown>;
};

export async function getYouTubeSources(): Promise<YouTubeSourceRow[]> {
  const sources = await queries.sources.getYouTubeSources();
  return sources.map((s) => ({
    id: s.id,
    kind: s.type, // Map 'type' to 'kind'
    url: s.url,
    name: s.name,
    metadata: (s.metadata as Record<string, unknown>) ?? {},
  }));
}

export async function getSourceById(
  sourceId: string,
): Promise<SourceRowFull | null> {
  const source = await queries.sources.getSourceById(sourceId);
  if (!source) return null;

  return {
    id: source.id,
    kind: source.type, // Map 'type' to 'kind'
    url: source.url,
    name: source.name,
    domain: null, // domain field not in new schema
    metadata: (source.metadata as Record<string, unknown>) ?? {},
  };
}

export async function getOrCreateManualSource(
  kind: string,
  domain: string | null,
  name?: string | null,
  url?: string | null,
): Promise<string> {
  // Note: domain field not in new schema, storing in metadata
  return await queries.sources.getOrCreateManualSource(
    kind, // Maps to 'type' in new schema
    name,
    url,
  );
}

export async function updateSourceMetadata(
  sourceId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  await queries.sources.updateSourceMetadata(sourceId, patch);
}

export async function upsertDiscovery(params: {
  source_id: string;
  external_id: string;
  url: string;
  title?: string | null;
  kind?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<string | null> {
  // Use shared Drizzle query - note: 'kind' maps to 'status' in new schema
  return await queries.rawItems.upsertRawItem({
    source_id: params.source_id,
    external_id: params.external_id,
    url: params.url,
    title: params.title,
    kind: params.kind ?? undefined,
    status: "pending",
    metadata: params.metadata,
  });
}

export async function findDiscoveriesByIds(ids: string[]): Promise<
  Array<{
    id: string;
    url: string;
    title: string | null;
    kind: string | null;
    metadata: Record<string, unknown> | null;
  }>
> {
  // Use shared Drizzle query
  const results = await queries.rawItems.findRawItemsByIds(ids);
  return results.map((r) => ({
    id: r.id,
    url: r.url ?? "",
    title: r.title,
    kind: r.kind ?? null,
    metadata: (r.metadata as Record<string, unknown>) ?? null,
  }));
}

export async function insertContents(params: {
  raw_item_id: string;
  text: string;
  html_url?: string | null;
  pdf_url?: string | null;
  audio_url?: string | null;
  lang?: string | null;
  content_hash: string;
  transcript_url?: string | null;
  transcript_vtt?: string | null;
  duration_seconds?: number | null;
  view_count?: number | null;
}): Promise<string> {
  // Map params to new schema
  return await queries.contents.insertContent({
    raw_item_id: params.raw_item_id,
    text_body: params.text,
    html_url: params.html_url,
    pdf_url: params.pdf_url,
    audio_url: params.audio_url,
    content_hash: params.content_hash,
    content_type: params.transcript_url ? "transcript" : "text",
    language_code: params.lang,
    transcript_url: params.transcript_url,
    transcript_vtt: params.transcript_vtt,
    duration_seconds: params.duration_seconds,
    view_count: params.view_count ?? undefined,
  });
}

export async function findStoryIdByContentHash(
  hash: string,
): Promise<string | null> {
  return await queries.stories.findStoryIdByContentHash(hash);
}

export async function insertStory(params: {
  content_id: string;
  title?: string | null;
  canonical_url?: string | null;
  primary_url?: string | null;
  kind?: string | null;
  published_at?: string | null;
}): Promise<string> {
  // Note: canonical_url is not in new schema, using primary_url for both
  return await queries.stories.insertStory({
    content_id: params.content_id,
    title: params.title,
    primary_url: params.primary_url ?? params.canonical_url,
    kind: params.kind,
    published_at: params.published_at,
  });
}

export async function getStoryWithContent(storyId: string): Promise<{
  id: string;
  title: string | null;
  canonical_url: string | null;
  text: string;
  content_hash: string;
} | null> {
  const result = await queries.stories.getStoryWithContent(storyId);
  if (!result) return null;

  return {
    id: result.id,
    title: result.title,
    canonical_url: result.primary_url, // Map primary_url to canonical_url
    text: result.text_body ?? "",
    content_hash: result.content_hash ?? "",
  };
}

export async function upsertStoryOverlay(params: {
  story_id: string;
  why_it_matters?: string | null;
  chili?: number | null;
  confidence?: number | null;
  citations?: Record<string, unknown>;
  model_version?: string | null;
}): Promise<void> {
  // Note: 'chili' field doesn't exist in new schema, storing in citations metadata
  const citationsWithChili = params.chili
    ? { ...params.citations, chili: params.chili }
    : params.citations;

  await queries.stories.upsertStoryOverlay({
    story_id: params.story_id,
    why_it_matters: params.why_it_matters,
    confidence: params.confidence,
    citations: citationsWithChili,
    analysis_state: params.model_version ? "completed" : "pending",
  });
}

export async function upsertStoryEmbedding(params: {
  story_id: string;
  embedding: number[];
  model_version?: string | null;
}): Promise<void> {
  await queries.stories.upsertStoryEmbedding(params);
}

export default pool;

// Admin instrumentation helpers
export async function upsertPlatformQuota(
  provider: string,
  snapshot: {
    limit?: number | null;
    used?: number | null;
    remaining?: number | null;
    reset_at?: string | null;
  },
) {
  await queries.platform.upsertPlatformQuota(provider, snapshot);
}

export async function upsertSourceHealth(
  sourceId: string,
  status: "ok" | "warn" | "error",
  message?: string | null,
) {
  await queries.sources.upsertSourceHealth(sourceId, status, message);
}

export async function upsertJobMetrics(
  rows: Array<{ name: string; state: string; count: number }>,
) {
  await queries.platform.upsertJobMetrics(rows);
}
