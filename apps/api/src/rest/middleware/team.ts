import { TeamAccessError, ensureTeamAccess } from "@api/auth/team";
import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

export const withTeamContext: MiddlewareHandler = async (c, next) => {
  const session = c.get("session");
  const db = c.get("db");

  if (!session || !session.user?.id) {
    throw new HTTPException(401, {
      message: "Authentication required",
    });
  }

  try {
    const teamId = await ensureTeamAccess(db, session.user.id);
    c.set("teamId", teamId ?? null);
  } catch (error) {
    if (error instanceof TeamAccessError) {
      if (error.code === "USER_NOT_FOUND") {
        throw new HTTPException(404, {
          message: error.message,
        });
      }

      if (error.code === "TEAM_FORBIDDEN") {
        throw new HTTPException(403, {
          message: error.message,
        });
      }
    }

    throw new HTTPException(500, {
      message: "Failed to resolve team access",
    });
  }

  await next();
};
