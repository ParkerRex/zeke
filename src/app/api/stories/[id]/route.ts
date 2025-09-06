import { NextResponse } from 'next/server';

import { getStoryById } from '@db/queries/stories/get-story-by-id';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const cluster = await getStoryById(id);
  if (!cluster) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(cluster);
}
