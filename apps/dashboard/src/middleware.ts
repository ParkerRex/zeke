import { updateSession } from "@zeke/supabase/middleware";
import { createClient } from "@zeke/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const supabase = createClient();
  const nextUrl = request.nextUrl;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect to login if not authenticated
  if (!session && nextUrl.pathname !== "/login") {
    const encodedSearchParams = `${nextUrl.pathname.substring(1)}${
      nextUrl.search
    }`;

    const url = new URL("/login", nextUrl.origin);

    if (encodedSearchParams) {
      url.searchParams.append("return_to", encodedSearchParams);
    }

    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|monitoring).*)"],
};
