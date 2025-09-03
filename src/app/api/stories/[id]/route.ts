import { NextResponse } from 'next/server';

import { getStoryById } from '@/features/stories';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const cluster = getStoryById(params.id);
  if (!cluster) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(cluster);
}
