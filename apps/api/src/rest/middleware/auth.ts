import { SCOPES } from "@api/utils/scopes";
import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

export const withAuth: MiddlewareHandler = async (c, next) => {
  const session = c.get("session");

  if (!session || !session.user?.id) {
    throw new HTTPException(401, {
      message: "Authentication required",
    });
  }

  c.set("scopes", [...SCOPES]);

  await next();
};
