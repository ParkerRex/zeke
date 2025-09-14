import { supabaseAdminClient } from '@zeke/supabase/admin';
import { getAdminFlag } from '@zeke/supabase/queries';
import { NextResponse } from 'next/server';

export async function POST(
  _req: Request,
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
    const { error } = await supabaseAdminClient
      .from('sources')
      .update({ active: true, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const HTTP_INTERNAL_SERVER_ERROR = 500;
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: HTTP_INTERNAL_SERVER_ERROR }
    );
  }
}
