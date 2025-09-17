import { getAdminFlag } from '@zeke/supabase/queries';
import { createClient } from '@zeke/supabase/server';
import { updateSource } from '@zeke/supabase/mutations';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const { isAdmin } = await getAdminFlag();
  if (!isAdmin) {
    const HTTP_FORBIDDEN = 403;
    return NextResponse.json(
      { ok: false, error: 'forbidden' },
      { status: HTTP_FORBIDDEN }
    );
  }
  try {
    const { id } = params;
    const DEFAULT_BACKFILL_DAYS = 30;
    const { days } = (await req
      .json()
      .catch(() => ({ days: DEFAULT_BACKFILL_DAYS }))) as {
      days?: unknown;
    };
    const d =
      typeof days === 'number' ? days : Number(days) || DEFAULT_BACKFILL_DAYS;
    const MS_PER_DAY = 86_400_000; // 24 * 60 * 60 * 1000
    const after = new Date(Date.now() - d * MS_PER_DAY).toISOString();
    // Store backfill hint in metadata; fetchers should honor published_after
    const supabase = createClient({ admin: true });
    await updateSource(supabase, {
      id,
      metadata: { published_after: after },
    });
    return NextResponse.json({ ok: true, published_after: after });
  } catch (e: unknown) {
    const HTTP_INTERNAL_SERVER_ERROR = 500;
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: HTTP_INTERNAL_SERVER_ERROR }
    );
  }
}
