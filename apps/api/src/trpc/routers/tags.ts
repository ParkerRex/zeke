import {
  createTagSchema,
  deleteTagSchema,
  tagResponseSchema,
  updateTagSchema,
} from "@api/schemas/tags";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { createTag, deleteTag, getTags, updateTag } from "@zeke/db/queries";
import { z } from "@hono/zod-openapi";

export const tagsRouter = createTRPCRouter({
  list: protectedProcedure
    .output(z.array(tagResponseSchema))
    .query(async ({ ctx: { db, teamId } }) => {
      if (!teamId) {
        return [];
      }

      const rows = await getTags(db, { teamId });
      return rows;
    }),

  create: protectedProcedure
    .input(createTagSchema)
    .output(tagResponseSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new Error("Active team required");
      }

      const tag = await createTag(db, {
        teamId: teamId!,
        name: input.name,
      });

      return tag;
    }),

  delete: protectedProcedure
    .input(deleteTagSchema)
    .output(tagResponseSchema.nullable())
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        return null;
      }

      const tag = await deleteTag(db, {
        id: input.id,
        teamId,
      });

      return tag ?? null;
    }),

  update: protectedProcedure
    .input(updateTagSchema)
    .output(tagResponseSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new Error("Active team required");
      }

      const tag = await updateTag(db, {
        id: input.id,
        name: input.name,
        teamId,
      });

      return tag;
    }),
});
