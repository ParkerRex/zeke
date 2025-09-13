import { getAdminFlag } from "@zeke/supabase/queries";
import { NextResponse } from "next/server";

type WorkerIngestResponse = { ok: boolean; port?: string };

async function postWorkerIngest(
  sourceId: string
): Promise<WorkerIngestResponse> {
  const DEFAULT_LOCAL_PORTS = ["8082", "8081", "8080"] as const;
  const ports = [
    process.env.WORKER_PORT,
    process.env.WORKER_HTTP_PORT,
    ...DEFAULT_LOCAL_PORTS,
  ].filter(Boolean) as string[];

  for (const port of ports) {
    try {
      const ac = new AbortController();
      const TIMEOUT_MS = 3000;
      const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
      const url = new URL(`http://127.0.0.1:${port}/debug/ingest-source`);
      url.searchParams.set("sourceId", sourceId);
      const res = await fetch(url, { method: "POST", signal: ac.signal });
      clearTimeout(t);
      if (res.ok) {
        return { ok: true, port } as WorkerIngestResponse;
      }
    } catch {
      // try next
    }
  }
  return { ok: false };
}

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const { isAdmin } = await getAdminFlag();
  if (!isAdmin) {
    const HTTP_FORBIDDEN = 403;
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: HTTP_FORBIDDEN }
    );
  }
  try {
    const result = await postWorkerIngest(params.id);
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
