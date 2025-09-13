import { getStoryById } from "@zeke/supabase/queries";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await ctx.params;
  const cluster = await getStoryById(id);
  if (!cluster) {
    const HTTP_NOT_FOUND = 404;
    return NextResponse.json(
      { error: "Not found" },
      { status: HTTP_NOT_FOUND }
    );
  }
  return NextResponse.json(cluster);
}
