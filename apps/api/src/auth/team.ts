import type { Database } from "@zeke/db/client";
import { teamCache } from "@zeke/cache/team-cache";

export type TeamAccessErrorCode = "USER_NOT_FOUND" | "TEAM_FORBIDDEN";

export class TeamAccessError extends Error {
  code: TeamAccessErrorCode;

  constructor(message: string, code: TeamAccessErrorCode) {
    super(message);
    this.name = "TeamAccessError";
    this.code = code;
  }
}

export async function ensureTeamAccess(
  db: Database,
  userId: string,
): Promise<string | null> {
  const result = await db.query.users.findFirst({
    with: {
      usersOnTeams: {
        columns: {
          teamId: true,
        },
      },
    },
    where: (users, { eq }) => eq(users.id, userId),
  });

  if (!result) {
    throw new TeamAccessError("User not found", "USER_NOT_FOUND");
  }

  const teamId = result.teamId ?? null;

  if (teamId === null) {
    return null;
  }

  const cacheKey = `user:${userId}:team:${teamId}`;
  let hasAccess = await teamCache.get(cacheKey);

  if (hasAccess === undefined) {
    hasAccess = result.usersOnTeams.some(
      (membership) => membership.teamId === teamId,
    );

    await teamCache.set(cacheKey, hasAccess);
  }

  if (!hasAccess) {
    throw new TeamAccessError("No permission to access this team", "TEAM_FORBIDDEN");
  }

  return teamId;
}
