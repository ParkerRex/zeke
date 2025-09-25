import { protectedMiddleware, withRequiredScope } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import {
  listStoriesInputSchema,
  listStoriesResponseSchema,
  storyDetailSchema,
  storyIdInputSchema,
  storyMetricsInputSchema,
  storyMetricsSchema,
} from "@api/schemas/stories";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  getStoryForDisplay,
  getStoryMetrics,
  listStoriesForDisplay,
} from "@zeke/db/queries";
import { HTTPException } from "hono/http-exception";

const app = new OpenAPIHono<Context>();

app.use("*", ...protectedMiddleware);

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List stories",
    description:
      "Paginated list of stories enriched with overlays and sources.",
    operationId: "listStories",
    tags: ["Stories"],
    security: [{ bearerAuth: [] }],
    request: {
      query: listStoriesInputSchema.partial(),
    },
    responses: {
      200: {
        description: "Story list page.",
        content: {
          "application/json": {
            schema: listStoriesResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("stories.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");

    if (!teamId) {
      throw new HTTPException(400, {
        message: "Listing stories requires an active team context",
      });
    }

    const queries = c.req.queries();
    const params = listStoriesInputSchema.parse({
      limit: queries.limit?.[0] ? Number(queries.limit[0]) : undefined,
      offset: queries.offset?.[0] ? Number(queries.offset[0]) : undefined,
      kind: queries.kind?.[0],
      search: queries.search?.[0],
      storyIds:
        queries.storyIds && queries.storyIds.length > 0
          ? queries.storyIds
          : undefined,
    });

    const result = await listStoriesForDisplay(db, {
      teamId,
      limit: params.limit,
      offset: params.offset,
      kind: params.kind,
      search: params.search ?? undefined,
      storyIds: params.storyIds,
    });

    return c.json(validateResponse(result, listStoriesResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/{storyId}",
    summary: "Story detail",
    description: "Detailed story payload with cluster mates and metrics.",
    operationId: "getStory",
    tags: ["Stories"],
    security: [{ bearerAuth: [] }],
    request: {
      params: storyIdInputSchema,
    },
    responses: {
      200: {
        description: "Story detail payload.",
        content: {
          "application/json": {
            schema: storyDetailSchema,
          },
        },
      },
      404: {
        description: "Story not found.",
      },
    },
    middleware: [withRequiredScope("stories.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { storyId } = c.req.valid("param");

    const detail = await getStoryForDisplay(db, storyId);

    if (!detail) {
      throw new HTTPException(404, {
        message: "Story not found",
      });
    }

    if (teamId) {
      const metrics = await getStoryMetrics(db, {
        teamId,
        storyIds: [storyId],
      });

      if (metrics.length > 0) {
        detail.metrics = metrics[0];
      }
    }

    return c.json(validateResponse(detail, storyDetailSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/metrics",
    summary: "Story metrics",
    description: "Return engagement metrics for one or more stories.",
    operationId: "getStoryMetrics",
    tags: ["Stories"],
    security: [{ bearerAuth: [] }],
    request: {
      query: storyMetricsInputSchema,
    },
    responses: {
      200: {
        description: "Metrics scoped to the active team.",
        content: {
          "application/json": {
            schema: z.array(storyMetricsSchema),
          },
        },
      },
    },
    middleware: [withRequiredScope("stories.metrics")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");

    if (!teamId) {
      throw new HTTPException(400, {
        message: "Story metrics require an active team context",
      });
    }

    const queries = c.req.queries();
    const storyIds = queries.storyIds ?? [];

    if (storyIds.length === 0) {
      throw new HTTPException(400, {
        message: "Provide at least one storyId query parameter",
      });
    }

    const params = storyMetricsInputSchema.parse({
      storyIds,
    });

    const metrics = await getStoryMetrics(db, {
      teamId,
      storyIds: params.storyIds,
    });

    return c.json(validateResponse(metrics, z.array(storyMetricsSchema)));
  },
);

export const storiesRouter = app;
