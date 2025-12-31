import "server-only";
import { auth } from "../config";
import { headers } from "next/headers";
import type { Session, User } from "../types";

export async function getSession(): Promise<Session | null> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });
    return session as Session | null;
  } catch (error) {
    console.error("Failed to get session:", error);
    return null;
  }
}

export async function getUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized: No session found");
  }
  return session;
}

export async function requireUser(): Promise<User> {
  const session = await requireSession();
  return session.user;
}

// For server actions and API routes
export async function getSessionFromHeaders(
  requestHeaders: Headers,
): Promise<Session | null> {
  try {
    const session = await auth.api.getSession({
      headers: requestHeaders,
    });
    return session as Session | null;
  } catch (error) {
    console.error("Failed to get session from headers:", error);
    return null;
  }
}
