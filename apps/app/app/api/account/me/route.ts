import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@zeke/auth";

export async function GET(): Promise<Response> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    const userId = session?.user?.id ?? null;

    if (!userId) {
      return NextResponse.json({ ok: true, user: null });
    }

    const { data, error } = await supabase
      .from("users")
      .select("full_name, avatar_url, is_admin")
      .eq("id", userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      // Fall back to auth metadata only if table lookup fails
      const meta = (session?.user as any)?.user_metadata ?? {};
      return NextResponse.json({
        ok: true,
        user: {
          id: userId,
          email: session?.user?.email ?? null,
          fullName: meta.full_name ?? null,
          avatarUrl: meta.avatar_url ?? meta.picture ?? null,
          isAdmin: false,
        },
      });
    }

    const meta = (session?.user as any)?.user_metadata ?? {};
    return NextResponse.json({
      ok: true,
      user: {
        id: userId,
        email: session?.user?.email ?? null,
        fullName: data?.full_name ?? meta.full_name ?? null,
        avatarUrl: data?.avatar_url ?? meta.avatar_url ?? meta.picture ?? null,
        isAdmin: !!data?.is_admin,
      },
    });
  } catch (_e: unknown) {
    return NextResponse.json({ ok: false, user: null });
  }
}
