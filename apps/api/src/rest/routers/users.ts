import type { Context } from "@api/rest/types";
import { protectedMiddleware, withRequiredScope } from "@api/rest/middleware";
import { updateUserSchema, userSchema } from "@api/schemas/users";
import { validateResponse } from "@api/utils/validate-response";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { getUserById, updateUser } from "@zeke/db/queries";

const app = new OpenAPIHono<Context>();

app.use("*", ...protectedMiddleware);

app.openapi(
  createRoute({
    method: "get",
    path: "/me",
    summary: "Current user",
    description: "Return the profile for the authenticated user.",
    operationId: "getCurrentUser",
    tags: ["Users"],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "User profile",
        content: {
          "application/json": {
            schema: userSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("users.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const session = c.get("session");

    if (!session?.user?.id) {
      throw new HTTPException(401, {
        message: "Authentication required",
      });
    }

    const user = await getUserById(db, session.user.id);

    if (!user) {
      throw new HTTPException(404, {
        message: "User not found",
      });
    }

    return c.json(validateResponse(user, userSchema));
  },
);

app.openapi(
  createRoute({
    method: "patch",
    path: "/me",
    summary: "Update current user",
    description: "Update profile fields for the authenticated user.",
    operationId: "updateCurrentUser",
    tags: ["Users"],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: updateUserSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Updated user",
        content: {
          "application/json": {
            schema: userSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("users.manage")],
  }),
  async (c) => {
    const db = c.get("db");
    const session = c.get("session");

    if (!session?.user?.id) {
      throw new HTTPException(401, {
        message: "Authentication required",
      });
    }

    const body = c.req.valid("json");

    await updateUser(db, {
      id: session.user.id,
      ...body,
    });

    const refreshed = await getUserById(db, session.user.id);

    if (!refreshed) {
      throw new HTTPException(404, {
        message: "User not found",
      });
    }

    return c.json(validateResponse(refreshed, userSchema));
  },
);

export const usersRouter = app;
