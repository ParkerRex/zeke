import { requireAdmin } from "@/utils/admin";
import { ForbiddenError, UnauthorizedError } from "@/utils/errors";
import { fetchRecentPipelineActivity } from "@/utils/pipeline";
import { NextResponse } from "next/server";

export async function GET(): Promise<Response> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 },
    );
  }
  try {
    const LIMIT_RECENT = 25;
    const { rawItems, contents, stories } =
      await fetchRecentPipelineActivity(LIMIT_RECENT);

    return NextResponse.json({
      ok: true,
      raw_items: rawItems,
      contents,
      stories,
      ts: new Date().toISOString(),
    });
  } catch (e: unknown) {
    const HTTP_INTERNAL_SERVER_ERROR = 500;
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: HTTP_INTERNAL_SERVER_ERROR },
    );
  }
}
