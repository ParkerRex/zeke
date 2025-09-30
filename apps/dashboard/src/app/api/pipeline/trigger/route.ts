import { ingestPull } from "@zeke/jobs/tasks";
import { getAdminFlag } from "@zeke/supabase/queries";
import { NextResponse } from "next/server";

export async function POST(req: Request): Promise<Response> {
  const { isAdmin } = await getAdminFlag();
  if (!isAdmin) {
    const HTTP_FORBIDDEN = 403;
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: HTTP_FORBIDDEN },
    );
  }

  try {
    const { kind } = (await req.json().catch(() => ({ kind: "rss" }))) as {
      kind?: unknown;
    };

    if (kind === "youtube") {
      const HTTP_BAD_REQUEST = 400;
      return NextResponse.json(
        { ok: false, error: "youtube_ingest_disabled" },
        { status: HTTP_BAD_REQUEST },
      );
    }

    await ingestPull.trigger({ reason: "manual" });

    const HTTP_OK = 200;
    return NextResponse.json({ ok: true }, { status: HTTP_OK });
  } catch (e: unknown) {
    const HTTP_INTERNAL_SERVER_ERROR = 500;
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: HTTP_INTERNAL_SERVER_ERROR },
    );
  }
}
