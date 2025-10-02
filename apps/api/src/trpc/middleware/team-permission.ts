import { TeamAccessError, ensureTeamAccess } from "@api/auth/team";
import type { Session } from "@api/utils/auth";
import { TRPCError } from "@trpc/server";
import type { Database } from "@zeke/db/client";

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

  let teamId: string | null;

  try {
    teamId = await ensureTeamAccess(ctx.db, userId);
  } catch (error) {
    if (error instanceof TeamAccessError) {
      if (error.code === "USER_NOT_FOUND") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: error.message,
        });
      }

      if (error.code === "TEAM_FORBIDDEN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: error.message,
        });
      }
    }

    // Debug: Log the actual error details
    console.error("ensureTeamAccess failed with unexpected error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name,
      userId,
    });

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to resolve team access",
      cause: error,
    });
  }

  return next({
    ctx: {
      session: ctx.session,
      teamId,
      db: ctx.db,
    },
  });
};
