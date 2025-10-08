import type { Session } from "@api/utils/auth";
import { TRPCError } from "@trpc/server";
import { teamCache } from "@zeke/cache/team-cache";
import type { Database } from "@zeke/db/client";
import { users } from "@zeke/db/schema";

export const withTeamPermission = async <TReturn>(opts: {
  ctx: {
    session?: Session | null;
    db: Database;
  };
  next: (opts: {
    ctx: {
      session?: Session | null;
      db: Database;
      teamId: string | null;
    };
  }) => Promise<TReturn>;
}) => {
  const { ctx, next } = opts;

  const userId = ctx.session?.user?.id;

  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No permission to access this team",
    });
  }

  const ensureUserRecord = async () =>
    ctx.db.query.users.findFirst({
      with: {
        usersOnTeams: {
          columns: {
            id: true,
            teamId: true,
          },
        },
      },
      where: (users, { eq }) => eq(users.id, userId),
    });

  let result = await ensureUserRecord();

  if (!result) {
    const sessionUser = ctx.session?.user;

    if (!sessionUser) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No permission to access this team",
      });
    }

    await ctx.db
      .insert(users)
      .values({
        id: sessionUser.id,
        email: sessionUser.email ?? null,
        fullName: sessionUser.full_name ?? null,
      })
      .onConflictDoNothing({ target: users.id });

    result = await ensureUserRecord();
  }

  if (!result) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  const teamId = result.teamId;

  // If teamId is null, user has no team assigned but this is now allowed
  if (teamId !== null) {
    const cacheKey = `user:${userId}:team:${teamId}`;
    let hasAccess = await teamCache.get(cacheKey);

    if (hasAccess === undefined) {
      hasAccess = result.usersOnTeams.some(
        (membership) => membership.teamId === teamId,
      );

      await teamCache.set(cacheKey, hasAccess);
    }

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No permission to access this team",
      });
    }
  }

  return next({
    ctx: {
      ...ctx,
      teamId,
    },
  });
};
