import { NextResponse } from 'next/server';

import { getShareSnapshot } from '@db/queries/stories/get-share-snapshot';
import { getStoryById } from '@db/queries/stories/get-story-by-id';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const snapshot = (await getShareSnapshot(id)) || (await getStoryById(id));
  if (!snapshot) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(snapshot);
}

export async function POST(req: Request) {
  const body = await req.text();
  // Prototype: ignore payload and return a fake share id
  const rand = Math.random().toString(36).slice(2, 8);
  const id = `shr_${rand}`;
  return NextResponse.json({ id, url: `/share/${id}` });
}
