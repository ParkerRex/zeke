import type { Context } from "@api/rest/types";
import { protectedMiddleware, withRequiredScope } from "@api/rest/middleware";
import {
  assistantAddSourceInputSchema,
  assistantCreateMessageInputSchema,
  assistantLinkMessageSourcesInputSchema,
  assistantMessageSchema,
  assistantMessageSourceSchema,
  assistantMessagesInputSchema,
  assistantRemoveSourceInputSchema,
  assistantThreadContextInputSchema,
  assistantThreadSchema,
  assistantThreadSourceSchema,
} from "@api/schemas/assistant";
import { validateResponse } from "@api/utils/validate-response";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import {
  addAssistantThreadSource,
  createAssistantMessage,
  getAssistantMessages,
  getAssistantThreadSources,
  getOrCreateAssistantThread,
  linkMessageSources,
  removeAssistantThreadSource,
} from "@zeke/db/queries";

const app = new OpenAPIHono<Context>();

app.use("*", ...protectedMiddleware);

app.openapi(
  createRoute({
    method: "post",
    path: "/threads",
    summary: "Create or fetch assistant thread",
    description:
      "Get or create a thread anchored to a story, playbook, or goal.",
    operationId: "createAssistantThread",
    tags: ["Assistant"],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: assistantThreadContextInputSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Assistant thread returned or created.",
        content: {
          "application/json": {
            schema: assistantThreadSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("assistant.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const session = c.get("session");
    const teamId = c.get("teamId");

    if (!session?.user?.id) {
      throw new HTTPException(401, {
        message: "Authentication required",
      });
    }

    if (!teamId) {
      throw new HTTPException(400, {
        message: "Assistant threads require an active team",
      });
    }

    const body = c.req.valid("json");

    const thread = await getOrCreateAssistantThread(db, {
      teamId,
      storyId: body.storyId ?? undefined,
      playbookId: body.playbookId ?? undefined,
      goalId: body.goalId ?? undefined,
      createdBy: session.user.id,
      topic: body.topic ?? undefined,
    });

    return c.json(validateResponse(thread, assistantThreadSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/threads/{threadId}/messages",
    summary: "List assistant messages",
    description:
      "Return messages for a thread ordered by creation time descending.",
    operationId: "listAssistantMessages",
    tags: ["Assistant"],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        threadId: z.string().uuid(),
      }),
      query: assistantMessagesInputSchema.omit({ threadId: true }).partial(),
    },
    responses: {
      200: {
        description: "Assistant messages for the thread.",
        content: {
          "application/json": {
            schema: z.array(assistantMessageSchema),
          },
        },
      },
    },
    middleware: [withRequiredScope("assistant.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const { threadId } = c.req.valid("param");
    const queries = c.req.queries();

    const params = assistantMessagesInputSchema.parse({
      threadId,
      limit: queries.limit?.[0] ? Number(queries.limit[0]) : undefined,
      before: queries.before?.[0],
    });

    const rows = await getAssistantMessages(db, {
      threadId: params.threadId,
      limit: params.limit,
      before: params.before ?? undefined,
    });

    return c.json(validateResponse(rows, z.array(assistantMessageSchema)));
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/threads/{threadId}/messages",
    summary: "Create assistant message",
    description: "Append a new message to a thread.",
    operationId: "createAssistantMessage",
    tags: ["Assistant"],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ threadId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: assistantCreateMessageInputSchema.omit({ threadId: true }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Message created.",
        content: {
          "application/json": {
            schema: assistantMessageSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("assistant.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const session = c.get("session");
    const { threadId } = c.req.valid("param");
    const body = c.req.valid("json");

    if (!session?.user?.id) {
      throw new HTTPException(401, {
        message: "Authentication required",
      });
    }

    const senderId =
      body.role === "assistant" || body.role === "system"
        ? null
        : session.user.id;

    const message = await createAssistantMessage(db, {
      threadId,
      senderId,
      role: body.role,
      body: body.body,
      metadata: body.metadata ?? null,
    });

    return c.json(validateResponse(message, assistantMessageSchema), 201);
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/threads/{threadId}/sources",
    summary: "List thread sources",
    description:
      "Return highlight and transcript sources attached to a thread.",
    operationId: "listAssistantThreadSources",
    tags: ["Assistant"],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ threadId: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Thread sources.",
        content: {
          "application/json": {
            schema: z.array(assistantThreadSourceSchema),
          },
        },
      },
    },
    middleware: [withRequiredScope("assistant.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const { threadId } = c.req.valid("param");

    const sources = await getAssistantThreadSources(db, threadId);

    return c.json(
      validateResponse(sources, z.array(assistantThreadSourceSchema)),
    );
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/threads/{threadId}/sources",
    summary: "Add thread source",
    description: "Attach a highlight or transcript turn to a thread.",
    operationId: "addAssistantThreadSource",
    tags: ["Assistant"],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ threadId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: assistantAddSourceInputSchema.omit({ threadId: true }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "Source added.",
        content: {
          "application/json": {
            schema: assistantThreadSourceSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("assistant.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const session = c.get("session");
    const { threadId } = c.req.valid("param");
    const body = c.req.valid("json");

    if (!session?.user?.id) {
      throw new HTTPException(401, {
        message: "Authentication required",
      });
    }

    const source = await addAssistantThreadSource(db, {
      threadId,
      highlightId: body.highlightId ?? null,
      turnId: body.turnId ?? null,
      addedBy: session.user.id,
      position: body.position ?? null,
    });

    return c.json(validateResponse(source, assistantThreadSourceSchema), 201);
  },
);

app.openapi(
  createRoute({
    method: "delete",
    path: "/threads/{threadId}/sources/{threadSourceId}",
    summary: "Remove thread source",
    description: "Detach a source from the assistant thread.",
    operationId: "removeAssistantThreadSource",
    tags: ["Assistant"],
    security: [{ bearerAuth: [] }],
    request: {
      params: assistantRemoveSourceInputSchema,
    },
    responses: {
      204: {
        description: "Source removed.",
      },
    },
    middleware: [withRequiredScope("assistant.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const params = c.req.valid("param");

    await removeAssistantThreadSource(db, {
      threadSourceId: params.threadSourceId,
      threadId: params.threadId,
    });

    return c.body(null, 204);
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/messages/{messageId}/sources",
    summary: "Link message sources",
    description:
      "Associate highlights or transcript turns with a specific message.",
    operationId: "linkAssistantMessageSources",
    tags: ["Assistant"],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ messageId: z.string().uuid() }),
      body: {
        content: {
          "application/json": {
            schema: assistantLinkMessageSourcesInputSchema.omit({
              messageId: true,
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Linked sources for the message.",
        content: {
          "application/json": {
            schema: z.array(assistantMessageSourceSchema),
          },
        },
      },
    },
    middleware: [withRequiredScope("assistant.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const { messageId } = c.req.valid("param");
    const body = c.req.valid("json");

    const sources = await linkMessageSources(db, {
      messageId,
      highlightIds: body.highlightIds,
      turnIds: body.turnIds,
    });

    return c.json(
      validateResponse(sources, z.array(assistantMessageSourceSchema)),
    );
  },
);

export const assistantRouter = app;
