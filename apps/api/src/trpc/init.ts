import { createApiContext, type ApiContext } from "@api/context";
import { TRPCError, initTRPC } from "@trpc/server";
import type { Context } from "hono";
import superjson from "superjson";
import { withPrimaryReadAfterWrite } from "./middleware/primary-read-after-write";
import { withTeamPermission } from "./middleware/team-permission";

type TRPCContext = ApiContext & {
  teamId?: string | null;
};

export const createTRPCContext = async (
  _: unknown,
  c: Context,
): Promise<TRPCContext> => {
  const baseContext = await createApiContext(c.req);

  return {
    ...baseContext,
    teamId: null,
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
  .use(withTeamPermissionMiddleware)
  .use(withPrimaryDbMiddleware)
  .use(async (opts) => {
    const { teamId, session } = opts.ctx;

    if (!session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return opts.next({
      ctx: {
        ...opts.ctx,
        teamId,
        session,
      },
    });
  });
