import { supabaseAdminClient } from '@zeke/supabase/admin';
import { getAdminFlag } from '@zeke/supabase/queries';
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
    const [rawItems, contents, stories] = await Promise.all([
      supabaseAdminClient
        .from('raw_items')
        .select('id,url,title,discovered_at,kind')
        .order('discovered_at', { ascending: false })
        .limit(LIMIT_RECENT),
      supabaseAdminClient
        .from('contents')
        .select('id,raw_item_id,html_url,extracted_at,lang')
        .order('extracted_at', { ascending: false, nullsFirst: false })
        .limit(LIMIT_RECENT),
      supabaseAdminClient
        .from('stories')
        .select('id,title,canonical_url,primary_url,created_at,kind')
        .order('created_at', { ascending: false })
        .limit(LIMIT_RECENT),
    ]);

    // Normalize contents to expose created_at for UI
    const normalizedContents = (contents.data ?? []).map((c) => {
      const row = c as Record<string, unknown>;
      return {
        id: row.id as string,
        raw_item_id: row.raw_item_id as string,
        html_url: (row.html_url as string) ?? null,
        created_at: (row.extracted_at as string | null) ?? null,
        lang: (row.lang as string | null) ?? null,
      };
    });

    return NextResponse.json({
      ok: true,
      raw_items: rawItems.data ?? [],
      contents: normalizedContents,
      stories: stories.data ?? [],
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
