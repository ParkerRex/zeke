import {
  assistantAddSourceInputSchema,
  assistantCreateMessageInputSchema,
  assistantLinkMessageSourcesInputSchema,
  assistantMessageSchema,
  assistantMessageSourceSchema,
  assistantMessagesInputSchema,
  assistantRemoveSourceInputSchema,
  assistantThreadContextInputSchema,
  assistantThreadIdInputSchema,
  assistantThreadSchema,
  assistantThreadSourceSchema,
} from "@api/schemas/assistant";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { z } from "@hono/zod-openapi";
import { TRPCError } from "@trpc/server";
import {
  addAssistantThreadSource,
  createAssistantMessage,
  getAssistantMessages,
  getAssistantThreadSources,
  getOrCreateAssistantThread,
  linkMessageSources,
  removeAssistantThreadSource,
} from "@zeke/db/queries";

export const assistantRouter = createTRPCRouter({
  getOrCreateThread: protectedProcedure
    .input(assistantThreadContextInputSchema)
    .output(assistantThreadSchema)
    .mutation(async ({ ctx: { db, session, teamId }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Assistant threads require an active team",
        });
      }

      const thread = await getOrCreateAssistantThread(db, {
        teamId,
        storyId: input.storyId ?? undefined,
        playbookId: input.playbookId ?? undefined,
        goalId: input.goalId ?? undefined,
        createdBy: session.user.id,
        topic: input.topic ?? undefined,
      });

      return thread;
    }),

  listMessages: protectedProcedure
    .input(assistantMessagesInputSchema)
    .output(z.array(assistantMessageSchema))
    .query(async ({ ctx: { db }, input }) => {
      const rows = await getAssistantMessages(db, {
        threadId: input.threadId,
        limit: input.limit,
        before: input.before ?? undefined,
      });

      return rows;
    }),

  createMessage: protectedProcedure
    .input(assistantCreateMessageInputSchema)
    .output(assistantMessageSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      const senderId = input.role === "assistant" || input.role === "system"
        ? null
        : session.user.id;

      const message = await createAssistantMessage(db, {
        threadId: input.threadId,
        senderId,
        role: input.role,
        body: input.body,
        metadata: input.metadata ?? null,
      });

      return message;
    }),

  listThreadSources: protectedProcedure
    .input(assistantThreadIdInputSchema)
    .output(z.array(assistantThreadSourceSchema))
    .query(async ({ ctx: { db }, input }) => {
      const sources = await getAssistantThreadSources(db, input.threadId);
      return sources;
    }),

  addThreadSource: protectedProcedure
    .input(assistantAddSourceInputSchema)
    .output(assistantThreadSourceSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      const source = await addAssistantThreadSource(db, {
        threadId: input.threadId,
        highlightId: input.highlightId ?? null,
        turnId: input.turnId ?? null,
        addedBy: session.user.id,
        position: input.position ?? null,
      });

      return source;
    }),

  removeThreadSource: protectedProcedure
    .input(assistantRemoveSourceInputSchema)
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx: { db }, input }) => {
      await removeAssistantThreadSource(db, {
        threadSourceId: input.threadSourceId,
        threadId: input.threadId,
      });

      return { success: true } as const;
    }),

  linkMessageSources: protectedProcedure
    .input(assistantLinkMessageSourcesInputSchema)
    .output(z.array(assistantMessageSourceSchema))
    .mutation(async ({ ctx: { db }, input }) => {
      const sources = await linkMessageSources(db, {
        messageId: input.messageId,
        highlightIds: input.highlightIds,
        turnIds: input.turnIds,
      });

      return sources;
    }),
});
