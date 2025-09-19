import { createApiContext } from "@api/context";
import type { MiddlewareHandler } from "hono";

export const withApiContext: MiddlewareHandler = async (c, next) => {
  const baseContext = await createApiContext(c.req);

  c.set("db", baseContext.db);
  c.set("session", baseContext.session);
  c.set("supabase", baseContext.supabase);
  c.set("geo", baseContext.geo);

  await next();
};
