import { getAdminFlag } from "@db/queries/account/get-admin-flag";
import { NextResponse } from "next/server";

export async function GET(): Promise<Response> {
  try {
    const { isAdmin } = await getAdminFlag();
    return NextResponse.json({ ok: true, isAdmin: !!isAdmin });
  } catch (_e: unknown) {
    return NextResponse.json({ ok: true, isAdmin: false });
  }
}
