import { NextResponse } from 'next/server';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

async function fetchWorkerStatus(): Promise<any | null> {
  const ports = [
    process.env.WORKER_PORT,
    process.env.WORKER_HTTP_PORT,
    '8082',
    '8081',
    '8080',
  ].filter(Boolean) as string[];

  // De-duplicate ports
  const seen = new Set<string>();
  const tryPorts = ports.filter((p) => (seen.has(p) ? false : (seen.add(p), true)));

  for (const port of tryPorts) {
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), 1500);
      const res = await fetch(`http://127.0.0.1:${port}/debug/status`, {
        signal: ac.signal,
        cache: 'no-store',
      });
      clearTimeout(t);
      if (!res.ok) continue;
      const json = await res.json();
      return { port, ...json };
    } catch {
      // try next port
    }
  }
  return null;
}

export async function GET() {
  try {
    const [worker, rawItems, contents, stories] = await Promise.all([
      fetchWorkerStatus(),
      supabaseAdminClient.from('raw_items').select('id', { count: 'exact', head: true }),
      supabaseAdminClient.from('contents').select('id', { count: 'exact', head: true }),
      supabaseAdminClient.from('stories').select('id', { count: 'exact', head: true }),
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
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

