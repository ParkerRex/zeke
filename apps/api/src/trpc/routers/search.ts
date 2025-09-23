import {
  globalSearchInputSchema,
  searchResultSchema,
  semanticSearchInputSchema,
} from "@api/schemas/search";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { z } from "@hono/zod-openapi";
import { TRPCError } from "@trpc/server";
import { globalSearchQuery, globalSemanticSearchQuery } from "@zeke/db/queries";

export const searchRouter = createTRPCRouter({
  global: protectedProcedure
    .input(globalSearchInputSchema)
    .output(z.array(searchResultSchema))
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Global search requires an active team",
        });
      }

      const results = await globalSearchQuery(db, {
        teamId,
        searchTerm: input.searchTerm,
        limit: input.limit,
        itemsPerTableLimit: input.itemsPerTableLimit,
        language: input.language,
        relevanceThreshold: input.relevanceThreshold,
      });

      return results;
    }),

  semantic: protectedProcedure
    .input(semanticSearchInputSchema)
    .output(z.array(searchResultSchema))
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Semantic search requires an active team",
        });
      }

      const results = await globalSemanticSearchQuery(db, {
        teamId,
        searchTerm: input.searchTerm,
        itemsPerTableLimit: input.itemsPerTableLimit,
        language: input.language,
        types: input.types,
        amount: input.amount,
        amountMin: input.amountMin,
        amountMax: input.amountMax,
        status: input.status,
        currency: input.currency,
        startDate: input.startDate,
        endDate: input.endDate,
        dueDateStart: input.dueDateStart,
        dueDateEnd: input.dueDateEnd,
      });

      return results;
    }),
});
