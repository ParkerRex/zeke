import { z } from "zod";

export const getProductsInputSchema = z.object({});

export const getTeamSubscriptionInputSchema = z.object({
  teamId: z.string().uuid().optional(),
});

export type GetTeamSubscriptionInput = z.infer<
  typeof getTeamSubscriptionInputSchema
>;
