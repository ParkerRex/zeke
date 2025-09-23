import type { MiddlewareHandler } from "hono";
import { withAuth } from "./auth";
import { withApiContext } from "./context";
import { withTeamContext } from "./team";

export const publicMiddleware: MiddlewareHandler[] = [withApiContext];

export const protectedMiddleware: MiddlewareHandler[] = [
  withApiContext,
  withAuth,
  withTeamContext,
];

export { withRequiredScope } from "./scope";
