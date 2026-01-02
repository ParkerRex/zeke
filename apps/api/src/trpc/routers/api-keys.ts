import { deleteApiKeySchema, upsertApiKeySchema } from "@api/schemas/api-key";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { apiKeyCache } from "@zeke/cache/api-key-cache";
import { deleteApiKey, getApiKeysByTeam, upsertApiKey } from "@zeke/db/queries";

export const apiKeysRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getApiKeysByTeam(db, teamId!);
  }),

  upsert: protectedProcedure
    .input(upsertApiKeySchema)
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      const { data, key, keyHash } = await upsertApiKey(db, {
        teamId: teamId!,
        userId: session.user.id,
        ...input,
      });

      // Invalidate cache if this was an update (has keyHash)
      if (keyHash) {
        await apiKeyCache.delete(keyHash);
      }

      return {
        key,
        data,
      };
    }),

  delete: protectedProcedure
    .input(deleteApiKeySchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const keyHash = await deleteApiKey(db, {
        teamId: teamId!,
        ...input,
      });

      // Invalidate cache if key was deleted
      if (keyHash) {
        await apiKeyCache.delete(keyHash);
      }

      return keyHash;
    }),
});
