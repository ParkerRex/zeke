import { NextResponse } from 'next/server';

async function postWorker(path: string) {
  const ports = [
    process.env.WORKER_PORT,
    process.env.WORKER_HTTP_PORT,
    '8082',
    '8081',
    '8080',
  ].filter(Boolean) as string[];

  for (const port of ports) {
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), 2000);
      const res = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: 'POST',
        signal: ac.signal,
      });
      clearTimeout(t);
      if (res.ok) return { ok: true, port };
    } catch {
      // try next
    }
  }
  return { ok: false };
}

export async function POST(req: Request) {
  try {
    const { kind } = await req.json().catch(() => ({ kind: 'rss' }));
    const path = kind === 'youtube' ? '/debug/ingest-youtube' : '/debug/ingest-now';
    const result = await postWorker(path);
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

