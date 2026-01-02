import { validateSession } from "@zeke/auth/middleware";
import { createI18nMiddleware } from "next-international/middleware";
import { type NextRequest, NextResponse } from "next/server";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
});

export async function proxy(request: NextRequest) {
  const i18nResponse = I18nMiddleware(request);
  const session = await validateSession(request);
  const url = new URL("/", request.url);
  const nextUrl = request.nextUrl;

  const pathnameLocale = nextUrl.pathname.split("/", 2)?.[1];

  // Remove the locale from the pathname
  const pathnameWithoutLocale = pathnameLocale
    ? nextUrl.pathname.slice(pathnameLocale.length + 1)
    : nextUrl.pathname;

  // Create a new URL without the locale in the pathname
  const newUrl = new URL(pathnameWithoutLocale || "/", request.url);

  const encodedSearchParams = `${newUrl?.pathname?.substring(1)}${
    newUrl.search
  }`;

  if (process.env.NODE_ENV === "development") {
    console.log("[PROXY DEBUG]", {
      pathname: newUrl.pathname,
      pathnameWithoutLocale,
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      sessionEmail: session?.user?.email,
      timestamp: new Date().toISOString(),
    });
  }

  // 1. Not authenticated
  if (
    !session &&
    newUrl.pathname !== "/login" &&
    !newUrl.pathname.includes("/i/") &&
    !newUrl.pathname.includes("/s/") &&
    !newUrl.pathname.includes("/verify") &&
    !newUrl.pathname.includes("/all-done") &&
    !newUrl.pathname.includes("/desktop/search") &&
    !newUrl.pathname.includes("/mfa/setup")
  ) {
    const redirectUrl = new URL("/login", request.url);

    if (encodedSearchParams) {
      redirectUrl.searchParams.append("return_to", encodedSearchParams);
    }

    return NextResponse.redirect(redirectUrl);
  }

  // If authenticated, proceed with other checks
  if (session) {
    if (newUrl.pathname !== "/teams/create" && newUrl.pathname !== "/teams") {
      // Check if the URL contains an invite code
      const inviteCodeMatch = newUrl.pathname.startsWith("/teams/invite/");

      if (inviteCodeMatch) {
        // Allow proceeding to invite page even without setup
        return NextResponse.redirect(
          `${url.origin}${request.nextUrl.pathname}`,
        );
      }
    }

    // 3. Check MFA Verification
    // Better Auth stores two-factor status on the user object
    if (session.user.twoFactorEnabled && newUrl.pathname !== "/mfa/verify") {
      // Check if MFA is verified for this session via cookie
      const mfaVerified = request.cookies.get("mfa_verified")?.value === "true";

      if (!mfaVerified) {
        const mfaUrl = new URL("/mfa/verify", request.url);

        if (encodedSearchParams) {
          mfaUrl.searchParams.append("return_to", encodedSearchParams);
        }

        return NextResponse.redirect(mfaUrl);
      }
    }
  }

  // If all checks pass, return the original or updated response
  return i18nResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
