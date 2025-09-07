import { Pool } from "pg";
import { log } from "./log.js";

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
  const { rows } = await pool.query(
    `select id, kind, url, name
		 from public.sources
		 where kind = 'rss'
		   and url is not null
		   and coalesce(active, true)`
  );
  return rows;
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
  const { rows } = await pool.query(
    `select id, kind, url, name, metadata from public.sources
     where kind in ('youtube_channel', 'youtube_search')
       and (url is not null or kind = 'youtube_search')
       and coalesce(active, true)`
  );
  return rows;
}

export async function getSourceById(
  sourceId: string
): Promise<SourceRowFull | null> {
  const { rows } = await pool.query(
    "select id, kind, url, name, metadata, domain from public.sources where id = $1",
    [sourceId]
  );
  return rows[0] ?? null;
}

export async function getOrCreateManualSource(
  kind: string,
  domain: string | null,
  name?: string | null,
  url?: string | null
): Promise<string> {
  // Try find an existing manual source by kind+domain+url (nullable)
  const { rows: found } = await pool.query(
    `select id from public.sources where kind = $1 and coalesce(domain,'') = coalesce($2,'') and coalesce(url,'') = coalesce($3,'') limit 1`,
    [kind, domain ?? null, url ?? null]
  );
  if (found[0]?.id) {
    return found[0].id as string;
  }
  const { rows } = await pool.query(
    `insert into public.sources (kind, name, url, domain, active, created_at, updated_at)
     values ($1,$2,$3,$4,true, now(), now())
     returning id`,
    [kind, name ?? null, url ?? null, domain ?? null]
  );
  return rows[0].id as string;
}

export async function updateSourceMetadata(
  sourceId: string,
  patch: Record<string, unknown>
): Promise<void> {
  // Merge JSONB metadata with a shallow patch
  await pool.query(
    `update public.sources
       set metadata = coalesce(metadata, '{}'::jsonb) || $2::jsonb,
           updated_at = now()
     where id = $1`,
    [sourceId, JSON.stringify(patch)]
  );
}

export async function upsertRawItem(params: {
  source_id: string;
  external_id: string;
  url: string;
  title?: string | null;
  kind?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<string | null> {
  const { source_id, external_id, url, title, kind, metadata } = params;
  const { rows } = await pool.query(
    `insert into public.raw_items (source_id, external_id, url, title, kind, metadata)
     values ($1,$2,$3,$4,$5,$6)
     on conflict (source_id, external_id) do nothing
     returning id`,
    [
      source_id,
      external_id,
      url,
      title ?? null,
      kind ?? "article",
      metadata ?? null,
    ]
  );
  return rows[0]?.id ?? null;
}

export async function findRawItemsByIds(
  ids: string[]
): Promise<Array<{ id: string; url: string; title: string | null }>> {
  if (!ids.length) {
    return [];
  }
  const { rows } = await pool.query(
    "select id, url, title from public.raw_items where id = any($1::uuid[])",
    [ids]
  );
  return rows;
}

export async function insertContents(params: {
  raw_item_id: string;
  text: string;
  html_url?: string | null;
  lang?: string | null;
  content_hash: string;
  transcript_url?: string | null;
  transcript_vtt?: string | null;
}): Promise<string> {
  const {
    raw_item_id,
    text,
    html_url,
    lang,
    content_hash,
    transcript_url,
    transcript_vtt,
  } = params;
  const { rows } = await pool.query(
    `insert into public.contents (raw_item_id, text, html_url, lang, content_hash, transcript_url, transcript_vtt)
     values ($1,$2,$3,$4,$5,$6,$7)
     returning id`,
    [
      raw_item_id,
      text,
      html_url ?? null,
      lang ?? null,
      content_hash,
      transcript_url ?? null,
      transcript_vtt ?? null,
    ]
  );
  return rows[0].id as string;
}

export async function findStoryIdByContentHash(
  hash: string
): Promise<string | null> {
  const { rows } = await pool.query(
    `select s.id
       from public.stories s
       join public.contents c on c.id = s.content_id
      where c.content_hash = $1
      limit 1`,
    [hash]
  );
  return rows[0]?.id ?? null;
}

export async function insertStory(params: {
  content_id: string;
  title?: string | null;
  canonical_url?: string | null;
  primary_url?: string | null;
  kind?: string | null;
  published_at?: string | null;
}): Promise<string> {
  const { content_id, title, canonical_url, primary_url, kind, published_at } =
    params;
  const { rows } = await pool.query(
    `insert into public.stories (content_id, title, canonical_url, primary_url, kind, published_at)
     values ($1,$2,$3,$4,$5,$6)
     returning id`,
    [
      content_id,
      title ?? null,
      canonical_url ?? null,
      primary_url ?? null,
      kind ?? "article",
      published_at ?? null,
    ]
  );
  return rows[0].id as string;
}

export async function getStoryWithContent(storyId: string): Promise<{
  id: string;
  title: string | null;
  canonical_url: string | null;
  text: string;
  content_hash: string;
} | null> {
  const { rows } = await pool.query(
    `select s.id, s.title, s.canonical_url, c.text, c.content_hash
     from public.stories s
     join public.contents c on c.id = s.content_id
     where s.id = $1`,
    [storyId]
  );
  return rows[0] ?? null;
}

export async function upsertStoryOverlay(params: {
  story_id: string;
  why_it_matters?: string | null;
  chili?: number | null;
  confidence?: number | null;
  citations?: Record<string, unknown>;
  model_version?: string | null;
}): Promise<void> {
  const {
    story_id,
    why_it_matters,
    chili,
    confidence,
    citations,
    model_version,
  } = params;
  await pool.query(
    `insert into public.story_overlays (story_id, why_it_matters, chili, confidence, citations, model_version, analyzed_at)
     values ($1, $2, $3, $4, $5, $6, now())
     on conflict (story_id) do update set
       why_it_matters = excluded.why_it_matters,
       chili = excluded.chili,
       confidence = excluded.confidence,
       citations = excluded.citations,
       model_version = excluded.model_version,
       analyzed_at = excluded.analyzed_at`,
    [
      story_id,
      why_it_matters ?? null,
      chili ?? null,
      confidence ?? null,
      citations ?? null,
      model_version ?? null,
    ]
  );
}

export async function upsertStoryEmbedding(params: {
  story_id: string;
  embedding: number[];
  model_version?: string | null;
}): Promise<void> {
  const { story_id, embedding, model_version } = params;
  await pool.query(
    `insert into public.story_embeddings (story_id, embedding, model_version)
     values ($1, $2, $3)
     on conflict (story_id) do update set
       embedding = excluded.embedding,
       model_version = excluded.model_version`,
    [story_id, JSON.stringify(embedding), model_version ?? null]
  );
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
  }
) {
  await pool.query(
    `insert into public.platform_quota (provider, quota_limit, used, remaining, reset_at, updated_at)
     values ($1,$2,$3,$4,$5, now())
     on conflict (provider) do update set
       quota_limit = excluded.quota_limit,
       used = excluded.used,
       remaining = excluded.remaining,
       reset_at = excluded.reset_at,
       updated_at = excluded.updated_at`,
    [
      provider,
      snapshot.limit ?? null,
      snapshot.used ?? null,
      snapshot.remaining ?? null,
      snapshot.reset_at ?? null,
    ]
  );
}

export async function upsertSourceHealth(
  sourceId: string,
  status: "ok" | "warn" | "error",
  message?: string | null
) {
  await pool.query(
    `insert into public.source_health (source_id, status, last_success_at, last_error_at, message, updated_at)
     values ($1, $2, case when $2='ok' then now() else null end, case when $2='error' then now() else null end, $3, now())
     on conflict (source_id) do update set
       status = excluded.status,
       last_success_at = coalesce(excluded.last_success_at, public.source_health.last_success_at),
       last_error_at = coalesce(excluded.last_error_at, public.source_health.last_error_at),
       message = excluded.message,
       updated_at = excluded.updated_at`,
    [sourceId, status, message ?? null]
  );
}

export async function upsertJobMetrics(
  rows: Array<{ name: string; state: string; count: number }>
) {
  if (!rows.length) {
    return;
  }
  const PARAMS_PER_ROW = 3;
  const values = rows
    .map(
      (_, i) =>
        `($${i * PARAMS_PER_ROW + 1}, $${i * PARAMS_PER_ROW + 2}, $${i * PARAMS_PER_ROW + PARAMS_PER_ROW}, now())`
    )
    .join(",");
  const params: Array<string | number> = [];
  for (const r of rows) {
    params.push(r.name, r.state, r.count);
  }
  await pool.query(
    `insert into public.job_metrics (name, state, count, updated_at)
     values ${values}
     on conflict (name,state) do update set count = excluded.count, updated_at = excluded.updated_at`,
    params
  );
}
