import { getQueryClient, trpc } from "@/trpc/server";
import { logger } from "@/utils/logger";
import { setupAnalytics } from "@zeke/events/server";
import { db } from "@zeke/db/client";
import {
  DEFAULT_SERVER_ERROR_MESSAGE,
  createSafeActionClient,
} from "next-safe-action";
import { z } from "zod";

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof Error) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});

export const actionClientWithMeta = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      name: z.string(),
      track: z
        .object({
          event: z.string(),
          channel: z.string(),
        })
        .optional(),
    });
  },
  handleServerError(e) {
    if (e instanceof Error) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});

export const authActionClient = actionClientWithMeta
  .use(async ({ next, clientInput, metadata }) => {
    const result = await next({ ctx: {} });

    if (process.env.NODE_ENV === "development") {
      logger("Input ->", clientInput);
      logger("Result ->", result.data);
      logger("Metadata ->", metadata);

      return result;
    }

    return result;
  })
  .use(async ({ next, metadata }) => {
    const queryClient = getQueryClient();
    const user = await queryClient.fetchQuery(trpc.user.me.queryOptions());

    if (!user) {
      throw new Error("Unauthorized");
    }

    const analytics = await setupAnalytics({
      userId: user.id,
      fullName: user.fullName,
    });

    if (metadata?.track) {
      analytics.track(metadata.track);
    }

    return next({
      ctx: {
        db,
        analytics,
        user,
        teamId: user.teamId,
      },
    });
  });
