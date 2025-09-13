import { listStories } from "@zeke/supabase/queries";
import { NextResponse } from "next/server";

export async function GET(): Promise<Response> {
  const clusters = await listStories();
  return NextResponse.json({ clusters });
}
