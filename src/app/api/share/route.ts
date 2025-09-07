import { getShareSnapshot } from "@db/queries/stories/get-share-snapshot";
import { getStoryById } from "@db/queries/stories/get-story-by-id";
import { NextResponse } from "next/server";

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    const HTTP_BAD_REQUEST = 400;
    return NextResponse.json(
      { error: "Missing id" },
      { status: HTTP_BAD_REQUEST }
    );
  }
  const snapshot = (await getShareSnapshot(id)) || (await getStoryById(id));
  if (!snapshot) {
    const HTTP_NOT_FOUND = 404;
    return NextResponse.json(
      { error: "Not found" },
      { status: HTTP_NOT_FOUND }
    );
  }
  return NextResponse.json(snapshot);
}

export function POST(_req: Request): Response {
  // Prototype: ignore payload and return a fake share id
  const RADIX = 36;
  const ID_PREFIX = 'shr_';
  const START_INDEX = 2; // skip '0.' from Math.random().toString(36)
  const ID_LENGTH = 6;
  const rand = Math.random().toString(RADIX).slice(START_INDEX, START_INDEX + ID_LENGTH);
  const id = `${ID_PREFIX}${rand}`;
  return NextResponse.json({ id, url: `/share/${id}` });
}
