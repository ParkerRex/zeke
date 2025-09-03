import { NextResponse } from 'next/server';

import { getStoryById } from '@/features/stories';

type Awaitable<T> = T | Promise<T>;

export async function GET(_req: Request, ctx: { params: Awaitable<{ id: string }> }) {
  const { id } = await ctx.params;
  const cluster = getStoryById(id);
  if (!cluster) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(cluster);
}
