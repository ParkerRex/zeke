import type { Context } from "@api/rest/types";
import { protectedMiddleware, withRequiredScope } from "@api/rest/middleware";
import {
  createTagInputSchema,
  tagSchema,
  updateTagInputSchema,
} from "@api/schemas/tags";
import { validateResponse } from "@api/utils/validate-response";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import {
  createTag,
  deleteTag,
  getTagById,
  getTags,
  updateTag,
} from "@zeke/db/queries";

const app = new OpenAPIHono<Context>();

app.use("*", ...protectedMiddleware);

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List tags",
    description: "Return all tags scoped to the active team.",
    operationId: "listTags",
    tags: ["Tags"],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Tags available to the current team.",
        content: {
          "application/json": {
            schema: z.array(tagSchema),
          },
        },
      },
    },
    middleware: [withRequiredScope("tags.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");

    if (!teamId) {
      return c.json([]);
    }

    const rows = await getTags(db, { teamId });

    return c.json(validateResponse(rows, z.array(tagSchema)));
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Create tag",
    description: "Create a new tag scoped to the active team.",
    operationId: "createTag",
    tags: ["Tags"],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: createTagInputSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Tag created successfully.",
        content: {
          "application/json": {
            schema: tagSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("tags.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");

    if (!teamId) {
      throw new HTTPException(400, {
        message: "Active team required to create tags",
      });
    }

    const body = c.req.valid("json");

    const result = await createTag(db, {
      teamId,
      name: body.name,
    });

    const fullRecord = await getTagById(db, { id: result.id, teamId });

    if (!fullRecord) {
      throw new HTTPException(500, {
        message: "Tag created but failed to load full record",
      });
    }

    return c.json(validateResponse(fullRecord, tagSchema), 201);
  },
);

app.openapi(
  createRoute({
    method: "patch",
    path: "/{id}",
    summary: "Update tag",
    description: "Rename an existing tag.",
    operationId: "updateTag",
    tags: ["Tags"],
    security: [{ bearerAuth: [] }],
    request: {
      params: updateTagInputSchema.pick({ id: true }),
      body: {
        content: {
          "application/json": {
            schema: createTagInputSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Updated tag.",
        content: {
          "application/json": {
            schema: tagSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("tags.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");

    if (!teamId) {
      throw new HTTPException(400, {
        message: "Active team required to update tags",
      });
    }

    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    await updateTag(db, {
      id,
      name: body.name,
      teamId,
    });

    const refreshed = await getTagById(db, { id, teamId });

    if (!refreshed) {
      throw new HTTPException(404, {
        message: "Tag not found",
      });
    }

    return c.json(validateResponse(refreshed, tagSchema));
  },
);

app.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    summary: "Delete tag",
    description: "Remove a tag from the active team.",
    operationId: "deleteTag",
    tags: ["Tags"],
    security: [{ bearerAuth: [] }],
    request: {
      params: updateTagInputSchema.pick({ id: true }),
    },
    responses: {
      204: {
        description: "Tag deleted.",
      },
    },
    middleware: [withRequiredScope("tags.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");

    if (!teamId) {
      throw new HTTPException(400, {
        message: "Active team required to delete tags",
      });
    }

    const { id } = c.req.valid("param");

    const removed = await deleteTag(db, {
      id,
      teamId,
    });

    if (!removed) {
      throw new HTTPException(404, {
        message: "Tag not found",
      });
    }

    return c.body(null, 204);
  },
);

export const tagsRouter = app;
