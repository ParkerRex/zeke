import { userCache } from "@zeke/cache/user-cache";
import type { Database } from "@zeke/db/client";
import { getTeamById, getUserById } from "@zeke/db/queries";
import { logger } from "@zeke/logger";
import { HTTPException } from "hono/http-exception";
import type { ChatUserContext } from "../context";

interface GetUserContextParams {
  db: Database;
  userId: string;
  teamId: string;
  country?: string;
  city?: string;
  timezone?: string;
}

/**
 * Gets user context for chat operations, with caching support
 * Fetches team and user data if not cached, then caches the result
 */
export async function getUserContext({
  db,
  userId,
  teamId,
  country,
  city,
  timezone,
}: GetUserContextParams): Promise<ChatUserContext> {
  // Try to get cached context first
  const cacheKey = `${userId}:${teamId}`;
  const cached = await userCache.get(cacheKey);
  if (cached) {
    return cached as ChatUserContext;
  }

  // If not cached, fetch team and user data in parallel
  const [team, user] = await Promise.all([
    getTeamById(db, teamId),
    getUserById(db, userId),
  ]);

  if (!team || !user) {
    throw new HTTPException(404, {
      message: "User or team not found",
    });
  }

  const context: ChatUserContext = {
    id: userId,
    email: user.email,
    fullName: user.fullName,
    teamId,
    role: "member", // TODO: Get actual role from team membership
    plan: team.plan,
  };

  // Cache for future requests (non-blocking)
  userCache.set(cacheKey, context).catch((err) => {
    logger.warn({
      msg: "Failed to cache user context",
      userId,
      teamId,
      error: err.message,
    });
  });

  return context;
}
