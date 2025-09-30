import { verifyAccessToken } from "@api/utils/auth";
import { expandScopes } from "@api/utils/scopes";
import { getUserById } from "@zeke/db/queries";
import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

export const withAuth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    throw new HTTPException(401, { message: "Authorization header required" });
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer") {
    throw new HTTPException(401, { message: "Invalid authorization scheme" });
  }

  if (!token) {
    throw new HTTPException(401, { message: "Token required" });
  }

  const db = c.get("db");

  // Zeke uses Supabase JWT authentication only
  const supabaseSession = await verifyAccessToken(token);
  if (!supabaseSession) {
    throw new HTTPException(401, { message: "Invalid or expired token" });
  }

  // Get user from database to get team info
  const user = await getUserById(db, supabaseSession.user.id);

  if (!user) {
    throw new HTTPException(401, { message: "User not found" });
  }

  const session = {
    teamId: user.teamId,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
    },
  };

  c.set("session", session);
  c.set("teamId", session.teamId);
  // Grant all research scopes for authenticated users
  c.set("scopes", expandScopes(["all_access"]));

  await next();
};
