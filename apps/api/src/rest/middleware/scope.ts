import type { Scope } from "@api/utils/scopes";
import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

export const withRequiredScope = (
  ...requiredScopes: Scope[]
): MiddlewareHandler => {
  return async (c, next) => {
    const scopes = c.get("scopes") as Scope[] | undefined;

    if (!scopes) {
      throw new HTTPException(401, {
        message: "Missing scopes for authenticated user",
      });
    }

    const hasScope = requiredScopes.length
      ? requiredScopes.some((scope) => scopes.includes(scope))
      : true;

    if (!hasScope) {
      throw new HTTPException(403, {
        message: `Insufficient permissions. Required: ${requiredScopes.join(", ")}`,
      });
    }

    await next();
  };
};
