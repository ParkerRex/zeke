import { getAdminFlag } from '@zeke/supabase/queries';
import { NextResponse } from 'next/server';

type WorkerPreviewResponse = { ok: boolean; [key: string]: unknown };

async function fetchWorkerPreview(
  sourceId: string,
  limit: number
): Promise<WorkerPreviewResponse> {
  const DEFAULT_LOCAL_PORTS = ['8082', '8081', '8080'] as const;
  const ports = [
    process.env.WORKER_PORT,
    process.env.WORKER_HTTP_PORT,
    ...DEFAULT_LOCAL_PORTS,
  ].filter(Boolean) as string[];

  for (const port of ports) {
    try {
      const ac = new AbortController();
      const TIMEOUT_MS = 2000;
      const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
      const url = new URL(`http://127.0.0.1:${port}/debug/preview-source`);
      url.searchParams.set('sourceId', sourceId);
      url.searchParams.set('limit', String(limit));
      const res = await fetch(url, { signal: ac.signal });
      clearTimeout(t);
      if (!res.ok) {
        continue;
      }
      const json = await res.json();
      if (json?.ok) {
        return json as WorkerPreviewResponse;
      }
    } catch {
      // try next
    }
  }
  return { ok: false };
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const { isAdmin } = await getAdminFlag();
  if (!isAdmin) {
    const HTTP_FORBIDDEN = 403;
    return NextResponse.json(
      { ok: false, error: 'forbidden' },
      { status: HTTP_FORBIDDEN }
    );
  }
  const url = new URL(req.url);
  const DEFAULT_LIMIT = 10;
  const MAX_LIMIT = 50;
  const limit = Math.min(
    Number(url.searchParams.get('limit') || DEFAULT_LIMIT),
    MAX_LIMIT
  );
  try {
    const result = await fetchWorkerPreview(params.id, limit);
    const HTTP_OK = 200;
    const HTTP_SERVICE_UNAVAILABLE = 503;
    return NextResponse.json(result, {
      status: result.ok ? HTTP_OK : HTTP_SERVICE_UNAVAILABLE,
    });
  } catch (e: unknown) {
    const HTTP_INTERNAL_SERVER_ERROR = 500;
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: HTTP_INTERNAL_SERVER_ERROR }
    );
  }
}
