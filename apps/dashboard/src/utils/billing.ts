import z from "zod";

import { connectDb } from "@zeke/db/src/client";
import {
  getActiveProductsWithPrices,
  getTeamActiveSubscription,
  type BillingProductWithPrices,
  type BillingSubscriptionRecord,
  type BillingPriceSummary,
  type BillingInterval,
} from "@zeke/db/src/queries/billing";

export type {
  BillingProductWithPrices,
  BillingSubscriptionRecord,
  BillingPriceSummary,
  BillingInterval,
};

const rawPriceCardVariantSchema = z.enum(["pro", "Pro"]);
export const priceCardVariantSchema = z.enum(["pro"]);

export const productMetadataSchema = z
  .object({
    price_card_variant: rawPriceCardVariantSchema,
    price: z.union([z.string(), z.number()]).optional(),
    support_level: z.string().optional(),
  })
  .transform((data) => {
    const normalizedVariant = (
      typeof data.price_card_variant === "string"
        ? data.price_card_variant.toLowerCase()
        : data.price_card_variant
    ) as z.infer<typeof priceCardVariantSchema>;

    const price =
      typeof data.price === "string"
        ? Number.parseFloat(data.price)
        : data.price;

    return {
      priceCardVariant: normalizedVariant,
      price,
      supportLevel: "founder chat" as const,
    };
  });

export type ProductMetadata = z.infer<typeof productMetadataSchema>;

export async function fetchActiveProductsWithPrices() {
  const db = await connectDb();
  return getActiveProductsWithPrices(db);
}

export async function fetchTeamActiveSubscription(teamId: string) {
  const db = await connectDb();
  return getTeamActiveSubscription(db, { teamId });
}
