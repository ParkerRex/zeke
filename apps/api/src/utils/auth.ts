import { type JWTPayload, jwtVerify } from "jose";

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
  } catch (error) {
    return null;
  }
}
