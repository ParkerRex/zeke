import {
  getAdminFlag,
  getRecentPipelineActivityQuery,
} from '@zeke/supabase/queries';
import { createClient } from '@zeke/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(): Promise<Response> {
  const { isAdmin } = await getAdminFlag();
  if (!isAdmin) {
    const HTTP_FORBIDDEN = 403;
    return NextResponse.json(
      { ok: false, error: 'forbidden' },
      { status: HTTP_FORBIDDEN }
    );
  }
  try {
    const LIMIT_RECENT = 25;
    const supabase = createClient({ admin: true });
    const { rawItems, contents, stories } =
      await getRecentPipelineActivityQuery(supabase, {
        limit: LIMIT_RECENT,
      });

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
      { status: HTTP_INTERNAL_SERVER_ERROR }
    );
  }
}
