import { updateSession } from "@zeke/supabase/middleware";
import { createClient } from "@zeke/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const supabase = await createClient();
  const nextUrl = request.nextUrl;

  const encodedSearchParams = `${nextUrl?.pathname?.substring(1)}${
    nextUrl.search
  }`;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Not authenticated - redirect to login
  if (
    !session &&
    nextUrl.pathname !== "/login" &&
    !nextUrl.pathname.includes("/verify")
  ) {
    const url = new URL("/login", request.url);

    if (encodedSearchParams) {
      url.searchParams.append("return_to", encodedSearchParams);
    }

    return NextResponse.redirect(url);
  }

  // If all checks pass, return the original or updated response
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
