import { ingestPull } from "@zeke/jobs/tasks";
import { getSession } from "@zeke/auth/server";
import { db } from "@zeke/db/client";
import { getAdminStatus } from "@zeke/db/queries";
import { NextResponse } from "next/server";

export async function POST(req: Request): Promise<Response> {
  // Check if user is authenticated and has admin role
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  // Check if user has admin privileges
  const { isAdmin } = await getAdminStatus(db, session.user.id);
  if (!isAdmin) {
    return NextResponse.json(
      { ok: false, error: "forbidden - admin access required" },
      { status: 403 },
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
