import type { Context } from "@api/rest/types";
import { protectedMiddleware, withRequiredScope } from "@api/rest/middleware";
import {
  highlightEngagementSchema,
  highlightIdsInputSchema,
  highlightListResponseSchema,
  highlightsByStoryInputSchema,
} from "@api/schemas/highlight";
import { validateResponse } from "@api/utils/validate-response";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import {
  getHighlightEngagement,
  getStoryHighlights,
} from "@zeke/db/queries";

const app = new OpenAPIHono<Context>();

app.use("*", ...protectedMiddleware);

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "Story highlights",
    description: "Return highlights associated with a story, optionally including global ones.",
    operationId: "listHighlights",
    tags: ["Highlights"],
    security: [{ bearerAuth: [] }],
    request: {
      query: highlightsByStoryInputSchema,
    },
    responses: {
      200: {
        description: "Highlights for the requested story.",
        content: {
          "application/json": {
            schema: highlightListResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("highlights.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const query = c.req.valid("query");

    const highlights = await getStoryHighlights(db, {
      storyId: query.storyId,
      includeGlobal: query.includeGlobal,
      teamId,
    });

    return c.json(validateResponse(highlights, highlightListResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/engagement",
    summary: "Highlight engagement",
    description: "Return engagement metrics for selected highlights.",
    operationId: "getHighlightEngagement",
    tags: ["Highlights"],
    security: [{ bearerAuth: [] }],
    request: {
      query: highlightIdsInputSchema,
    },
    responses: {
      200: {
        description: "Engagement metrics scoped to the active team.",
        content: {
          "application/json": {
            schema: z.array(highlightEngagementSchema),
          },
        },
      },
    },
    middleware: [withRequiredScope("highlights.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");

    if (!teamId) {
      throw new HTTPException(400, {
        message: "Highlight engagement requires an active team context",
      });
    }

    const query = c.req.valid("query");

    const rows = await getHighlightEngagement(db, {
      teamId,
      highlightIds: query.highlightIds,
    });

    return c.json(validateResponse(rows, z.array(highlightEngagementSchema)));
  },
);

export const highlightsRouter = app;
