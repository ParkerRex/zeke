import { getAdminFlag } from "@db/queries/account/get-admin-flag";
import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@/lib/supabase/supabase-admin";
import type { Json } from "@/lib/supabase/types";

type SourceUpsert = {
  id?: string | null;
  kind: string;
  name?: string | null;
  url?: string | null;
  domain?: string | null;
  metadata?: Json | null;
  active?: boolean;
};

export async function GET(): Promise<Response> {
  const { isAdmin } = await getAdminFlag();
  if (!isAdmin) {
    const HTTP_FORBIDDEN = 403;
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: HTTP_FORBIDDEN }
    );
  }
  try {
    const MAX_SOURCES = 200;
    const { data, error } = await supabaseAdminClient
      .from("sources")
      .select(
        "id, kind, name, url, domain, active, last_checked, metadata, source_metrics:source_metrics(*), source_health:source_health(*)"
      )
      .order("updated_at", { ascending: false, nullsFirst: true })
      .limit(MAX_SOURCES);
    if (error) {
      throw error;
    }
    return NextResponse.json({ ok: true, sources: data ?? [] });
  } catch (e: unknown) {
    const HTTP_INTERNAL_SERVER_ERROR = 500;
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: HTTP_INTERNAL_SERVER_ERROR }
    );
  }
}

export async function POST(req: Request): Promise<Response> {
  const { isAdmin } = await getAdminFlag();
  if (!isAdmin) {
    const HTTP_FORBIDDEN = 403;
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: HTTP_FORBIDDEN }
    );
  }
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<SourceUpsert>;
    const {
      id = null,
      kind,
      name = null,
      url = null,
      domain = null,
      metadata = null as Json | null,
      active = true,
    } = body || {};
    if (!kind) {
      const HTTP_BAD_REQUEST = 400;
      return NextResponse.json(
        { ok: false, error: "missing kind" },
        { status: HTTP_BAD_REQUEST }
      );
    }

    const payload = {
      kind,
      name,
      url,
      domain,
      metadata,
      active: !!active,
    } satisfies Omit<SourceUpsert, "id">;
    let newId: string | null = id ?? null;
    if (id) {
      const { data: upd, error } = await supabaseAdminClient
        .from("sources")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("id")
        .maybeSingle();
      if (error) {
        throw error;
      }
      newId = upd?.id ?? id;
    } else {
      const { data: ins, error } = await supabaseAdminClient
        .from("sources")
        .insert([payload])
        .select("id")
        .maybeSingle();
      if (error) {
        throw error;
      }
      newId = ins?.id ?? null;
    }

    // Optional: enqueue ingest pull via existing trigger API. Defer to UI for now.
    return NextResponse.json({ ok: true, id: newId });
  } catch (e: unknown) {
    const HTTP_INTERNAL_SERVER_ERROR = 500;
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: HTTP_INTERNAL_SERVER_ERROR }
    );
  }
}
