import type { MiddlewareHandler } from "hono";

export const requestLogger: MiddlewareHandler = async (c, next) => {
  const start = Date.now();

  await next();

  c.executionCtx.waitUntil(
    (async () => {
      const duration = Date.now() - start;
      console.log(
        JSON.stringify({
          msg: "request_completed",
          path: c.req.path,
          method: c.req.method,
          status: c.res.status,
          durationMs: duration,
        }),
      );
    })(),
  );
};
