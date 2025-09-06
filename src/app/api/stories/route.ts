import { NextResponse } from 'next/server';

import { listStories } from '@/supabase/queries/stories/list-stories';

export async function GET() {
  const clusters = await listStories();
  return NextResponse.json({ clusters });
}
