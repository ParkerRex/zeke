import { auth } from "../config";
import type { NextRequest } from "next/server";
import type { Session } from "../types";

export async function validateSession(
  request: NextRequest,
): Promise<Session | null> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    return session as Session | null;
  } catch (error) {
    console.error("Middleware session validation failed:", error);
    return null;
  }
}

export async function validateSessionFromHeaders(
  headers: Headers,
): Promise<Session | null> {
  try {
    const session = await auth.api.getSession({
      headers,
    });
    return session as Session | null;
  } catch (error) {
    console.error("Session validation from headers failed:", error);
    return null;
  }
}
