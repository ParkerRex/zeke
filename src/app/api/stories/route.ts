import { listStories } from "@db/queries/stories/list-stories";
import { NextResponse } from "next/server";

export async function GET(): Promise<Response> {
  const clusters = await listStories();
  return NextResponse.json({ clusters });
}
