import { getAdminFlag } from "@db/queries/account/get-admin-flag";
import { NextResponse } from "next/server";

type WorkerTriggerResponse = { ok: boolean; port?: string };

async function postWorker(path: string): Promise<WorkerTriggerResponse> {
  const DEFAULT_LOCAL_PORTS = ["8082", "8081", "8080"] as const;
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
      const res = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: "POST",
        signal: ac.signal,
      });
      clearTimeout(t);
      if (res.ok) {
        return { ok: true, port } as WorkerTriggerResponse;
      }
    } catch {
      // try next
    }
  }
  return { ok: false };
}

export async function POST(req: Request): Promise<Response> {
  const { isAdmin } = await getAdminFlag();
  if (!isAdmin) {
    const HTTP_FORBIDDEN = 403;
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: HTTP_FORBIDDEN }
    );
  }
  try {
    const { kind } = (await req.json().catch(() => ({ kind: "rss" }))) as {
      kind?: unknown;
    };
    const path =
      kind === "youtube" ? "/debug/ingest-youtube" : "/debug/ingest-now";
    const result = await postWorker(path);
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
