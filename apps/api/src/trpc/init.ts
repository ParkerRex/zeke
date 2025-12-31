import { verifyAccessToken } from "@api/utils/auth";
import type { Session } from "@api/utils/auth";
import { getGeoContext } from "@api/utils/geo";
import { TRPCError, initTRPC } from "@trpc/server";
import { db } from "@zeke/db/client";
import type { Context } from "hono";
import superjson from "superjson";
import { withPrimaryReadAfterWrite } from "./middleware/primary-read-after-write";
import { withTeamPermission } from "./middleware/team-permission";

type Database = typeof db;

type TRPCContext = {
  session: Session | null;
  db: Database;
  geo: ReturnType<typeof getGeoContext>;
  teamId?: string;
};

export const createTRPCContext = async (
  _: unknown,
  c: Context,
): Promise<TRPCContext> => {
  const accessToken = c.req.header("Authorization")?.split(" ")[1];
  const session = await verifyAccessToken(accessToken);

  // Use the singleton database instance
  const geo = getGeoContext(c.req);

  return {
    session,
    db,
    geo,
  };
};

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

const withPrimaryDbMiddleware = t.middleware(async (opts) => {
  return withPrimaryReadAfterWrite({
    ctx: opts.ctx,
    type: opts.type,
    next: opts.next,
  });
});

const withTeamPermissionMiddleware = t.middleware(async (opts) => {
  return withTeamPermission({
    ctx: opts.ctx,
    next: opts.next,
  });
});

export const publicProcedure = t.procedure.use(withPrimaryDbMiddleware);

export const protectedProcedure = t.procedure
  .use(withTeamPermissionMiddleware) // NOTE: This is needed to ensure that the teamId is set in the context
  .use(withPrimaryDbMiddleware)
  .use(async (opts) => {
    const { teamId, session } = opts.ctx;

    if (!session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return opts.next({
      ctx: {
        teamId,
        session,
      },
    });
  });
