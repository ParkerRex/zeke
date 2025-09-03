import { NextResponse } from 'next/server';

import { listStories } from '@/server/stories';

export async function GET() {
  const clusters = listStories();
  return NextResponse.json({ clusters });
}
