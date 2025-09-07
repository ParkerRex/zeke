import { getAdminFlag } from "@db/queries/account/get-admin-flag";
import { NextResponse } from "next/server";

type WorkerOneOffResponse = {
  ok: boolean;
  [key: string]: unknown;
};

async function postWorkerOneOff(urls: string[]): Promise<WorkerOneOffResponse> {
  const DEFAULT_LOCAL_PORTS = ["8082", "8081", "8080"] as const;
  const ports = [
    process.env.WORKER_PORT,
    process.env.WORKER_HTTP_PORT,
    ...DEFAULT_LOCAL_PORTS,
  ].filter(Boolean) as string[];

  for (const port of ports) {
    try {
      const ac = new AbortController();
      const TIMEOUT_MS = 5000;
      const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
      const res = await fetch(`http://127.0.0.1:${port}/debug/ingest-oneoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
        signal: ac.signal,
      });
      clearTimeout(t);
      if (!res.ok) {
        continue;
      }
      const json = await res.json();
      if (json?.ok) {
        return json as WorkerOneOffResponse;
      }
    } catch {
      // try next port
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
    const body = (await req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const rawUrls = body?.urls as unknown;
    const urls = Array.isArray(rawUrls)
      ? rawUrls.filter(
          (x): x is string => typeof x === "string" && x.trim().length > 0
        )
      : [];
    if (urls.length === 0) {
      const HTTP_BAD_REQUEST = 400;
      return NextResponse.json(
        { ok: false, error: "no_urls" },
        { status: HTTP_BAD_REQUEST }
      );
    }
    const result = await postWorkerOneOff(urls);
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
