import { NextResponse } from 'next/server';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

export async function GET() {
  try {
    const [rawItems, contents, stories] = await Promise.all([
      supabaseAdminClient
        .from('raw_items')
        .select('id,url,title,discovered_at,kind')
        .order('discovered_at', { ascending: false })
        .limit(25),
      supabaseAdminClient
        .from('contents')
        .select('id,raw_item_id,html_url,extracted_at,lang')
        .order('extracted_at', { ascending: false, nullsFirst: false })
        .limit(25),
      supabaseAdminClient
        .from('stories')
        .select('id,title,canonical_url,primary_url,created_at,kind')
        .order('created_at', { ascending: false })
        .limit(25),
    ]);

    // Normalize contents to expose created_at for UI
    const normalizedContents = (contents.data ?? []).map((c: any) => ({
      id: c.id,
      raw_item_id: c.raw_item_id,
      html_url: c.html_url,
      created_at: c.extracted_at ?? null,
      lang: c.lang ?? null,
    }));

    return NextResponse.json({
      ok: true,
      raw_items: rawItems.data ?? [],
      contents: normalizedContents,
      stories: stories.data ?? [],
      ts: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
