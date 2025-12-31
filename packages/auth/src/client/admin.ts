import "server-only";
import { auth } from "../config";

export async function deleteUser(userId: string): Promise<void> {
  await auth.api.deleteUser({
    body: { userId },
  });
}

export async function listSessions(userId: string) {
  return auth.api.listSessions({
    query: { userId },
  });
}

export async function revokeSession(sessionToken: string): Promise<void> {
  await auth.api.revokeSession({
    body: { token: sessionToken },
  });
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await auth.api.revokeSessions({
    body: { userId },
  });
}

// Admin client for service-level operations
export const adminAuth = {
  deleteUser,
  listSessions,
  revokeSession,
  revokeAllSessions,
};
