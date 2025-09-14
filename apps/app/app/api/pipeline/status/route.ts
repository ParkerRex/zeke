import { supabaseAdminClient } from '@zeke/supabase/admin';
import { getAdminFlag } from '@zeke/supabase/queries';
import { NextResponse } from 'next/server';

type WorkerStatus = Record<string, unknown> & { port?: string };

async function fetchWorkerStatus(): Promise<WorkerStatus | null> {
  const DEFAULT_LOCAL_PORTS = ['8082', '8081', '8080'] as const;
  const ports = [
    process.env.WORKER_PORT,
    process.env.WORKER_HTTP_PORT,
    ...DEFAULT_LOCAL_PORTS,
  ].filter(Boolean) as string[];

  // De-duplicate ports
  const seen = new Set<string>();
  const tryPorts = ports.filter((p) => {
    if (seen.has(p)) {
      return false;
    }
    seen.add(p);
    return true;
  });

  for (const port of tryPorts) {
    try {
      const ac = new AbortController();
      const TIMEOUT_MS = 1500;
      const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
      const res = await fetch(`http://127.0.0.1:${port}/debug/status`, {
        signal: ac.signal,
        cache: 'no-store',
      });
      clearTimeout(t);
      if (!res.ok) {
        continue;
      }
      const json = (await res.json()) as Record<string, unknown>;
      return { port, ...json } satisfies WorkerStatus;
    } catch {
      // try next port
    }
  }
  return null;
}

export async function GET(): Promise<Response> {
  const { isAdmin } = await getAdminFlag();
  if (!isAdmin) {
    const HTTP_FORBIDDEN = 403;
    return NextResponse.json(
      { ok: false, error: 'forbidden' },
      { status: HTTP_FORBIDDEN }
    );
  }
  try {
    const [worker, rawItems, contents, stories] = await Promise.all([
      fetchWorkerStatus(),
      supabaseAdminClient
        .from('raw_items')
        .select('id', { count: 'exact', head: true }),
      supabaseAdminClient
        .from('contents')
        .select('id', { count: 'exact', head: true }),
      supabaseAdminClient
        .from('stories')
        .select('id', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      ok: true,
      worker,
      counts: {
        raw_items: rawItems.count ?? null,
        contents: contents.count ?? null,
        stories: stories.count ?? null,
      },
      ts: new Date().toISOString(),
    });
  } catch (e: unknown) {
    const HTTP_INTERNAL_SERVER_ERROR = 500;
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: HTTP_INTERNAL_SERVER_ERROR }
    );
  }
}
