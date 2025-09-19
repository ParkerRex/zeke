import type { Context } from "@api/rest/types";
import {
  globalSearchInputSchema,
  searchResultSchema,
  semanticSearchInputSchema,
} from "@api/schemas/search";
import { protectedMiddleware, withRequiredScope } from "@api/rest/middleware";
import { validateResponse } from "@api/utils/validate-response";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import {
  globalSearchQuery,
  globalSemanticSearchQuery,
} from "@zeke/db/queries";

const app = new OpenAPIHono<Context>();

app.use("*", ...protectedMiddleware);

app.openapi(
  createRoute({
    method: "get",
    path: "/global",
    summary: "Global search",
    description: "Keyword-based search across stories, highlights, and related surfaces.",
    operationId: "searchGlobal",
    tags: ["Search"],
    security: [{ bearerAuth: [] }],
    request: {
      query: globalSearchInputSchema,
    },
    responses: {
      200: {
        description: "Search results ordered by relevance score.",
        content: {
          "application/json": {
            schema: z.array(searchResultSchema),
          },
        },
      },
    },
    middleware: [withRequiredScope("search.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");

    if (!teamId) {
      throw new HTTPException(400, {
        message: "Global search requires an active team context",
      });
    }

    const query = c.req.valid("query");

    const results = await globalSearchQuery(db, {
      teamId,
      searchTerm: query.searchTerm,
      limit: query.limit,
      itemsPerTableLimit: query.itemsPerTableLimit,
      language: query.language,
      relevanceThreshold: query.relevanceThreshold,
    });

    return c.json(
      validateResponse(results, z.array(searchResultSchema)),
    );
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/semantic",
    summary: "Semantic search",
    description: "Embedding-backed semantic search across the workspace.",
    operationId: "searchSemantic",
    tags: ["Search"],
    security: [{ bearerAuth: [] }],
    request: {
      query: semanticSearchInputSchema,
    },
    responses: {
      200: {
        description: "Semantic search results ordered by similarity.",
        content: {
          "application/json": {
            schema: z.array(searchResultSchema),
          },
        },
      },
    },
    middleware: [withRequiredScope("search.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");

    if (!teamId) {
      throw new HTTPException(400, {
        message: "Semantic search requires an active team context",
      });
    }

    const query = c.req.valid("query");

    const results = await globalSemanticSearchQuery(db, {
      teamId,
      searchTerm: query.searchTerm,
      itemsPerTableLimit: query.itemsPerTableLimit,
      language: query.language,
      types: query.types,
      amount: query.amount,
      amountMin: query.amountMin,
      amountMax: query.amountMax,
      status: query.status,
      currency: query.currency,
      startDate: query.startDate,
      endDate: query.endDate,
      dueDateStart: query.dueDateStart,
      dueDateEnd: query.dueDateEnd,
    });

    return c.json(
      validateResponse(results, z.array(searchResultSchema)),
    );
  },
);

export const searchRouter = app;
