import { type JWTPayload, jwtVerify } from "jose";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@zeke/db/client";
import { authSession } from "@zeke/db/schema";

export type Session = {
  user: {
    id: string;
    email?: string;
    full_name?: string;
  };
  teamId?: string;
};

type BetterAuthJWTPayload = JWTPayload & {
  email?: string;
  name?: string;
  [key: string]: unknown;
};

export async function verifyAccessToken(
  accessToken?: string,
): Promise<Session | null> {
  if (!accessToken) return null;

  const isJwt = accessToken.split(".").length === 3;
  if (isJwt) {
    try {
      const authSecret = process.env.AUTH_SECRET;
      if (!authSecret) {
        throw new Error("AUTH_SECRET environment variable is required");
      }

      const { payload } = await jwtVerify(
        accessToken,
        new TextEncoder().encode(authSecret),
      );

      const authPayload = payload as BetterAuthJWTPayload;

      return {
        user: {
          id: authPayload.sub!,
          email: authPayload.email,
          full_name: authPayload.name,
        },
      };
    } catch {
      // Fall through to session lookup
    }
  }

  const session = await db.query.authSession.findFirst({
    where: and(
      eq(authSession.token, accessToken),
      gt(authSession.expiresAt, new Date()),
    ),
    with: {
      user: true,
    },
  });

  if (!session?.user) return null;

  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? undefined,
      full_name: session.user.fullName ?? session.user.name ?? undefined,
    },
    teamId: session.user.teamId ?? undefined,
  };
}
