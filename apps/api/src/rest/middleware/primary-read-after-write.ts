import { teamPermissionsCache } from "@zeke/cache/team-permissions-cache";
import { getUserTeamId } from "@zeke/db/queries";
import { logger } from "@zeke/logger";
import type { MiddlewareHandler } from "hono";

/**
 * Middleware that keeps the request context in sync with the active team.
 * For now all traffic goes to the primary database; once replicas are added we
 * can reintroduce the read-after-write safeguards here.
 */
export const withPrimaryReadAfterWrite: MiddlewareHandler = async (c, next) => {
  const session = c.get("session");
  const db = c.get("db");

  let teamId: string | null = null;

  // For OAuth sessions, use the token's team, not the user's current team
  if (session?.oauth) {
    teamId = session.teamId || null;
  }
  // For non-OAuth sessions, get user's current team
  else if (session?.user?.id) {
    const cacheKey = `user:${session.user.id}:team`;
    teamId = (await teamPermissionsCache.get(cacheKey)) || null;

    if (!teamId && session.user.id) {
      try {
        const userTeamId = await getUserTeamId(db, session.user.id);

        if (userTeamId) {
          teamId = userTeamId;
          await teamPermissionsCache.set(cacheKey, userTeamId);
        }
      } catch (error) {
        logger.warn({
          msg: "Failed to fetch user team",
          userId: session.user.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  c.set("db", db);
  c.set("session", session);
  c.set("teamId", teamId);

  await next();
};
