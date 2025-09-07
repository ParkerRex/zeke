import z from "zod";

export const priceCardVariantSchema = z.enum(["pro"]);

// Pro product metadata: researches (number | 'unlimited') and support level.
export const productMetadataSchema = z
  .object({
    price_card_variant: priceCardVariantSchema,
    researches: z.union([z.string(), z.number()]).optional(),
    research_limit: z.union([z.string(), z.number()]).optional(),
    support_level: z.enum(["email", "live"]),
  })
  .transform((data) => {
    const raw = data.researches ?? data.research_limit;

    let researches: number | "unlimited" | undefined;
    if (typeof raw === "string") {
      if (raw.toLowerCase() === "unlimited") {
        researches = "unlimited";
      } else {
        const n = Number.parseInt(raw, 10);
        if (!Number.isNaN(n)) {
          researches = n;
        }
      }
    } else if (typeof raw === "number") {
      researches = raw;
    }

    return {
      priceCardVariant: data.price_card_variant,
      researches: researches ?? "unlimited",
      supportLevel: data.support_level,
    };
  });

export type ProductMetadata = z.infer<typeof productMetadataSchema>;
export type PriceCardVariant = z.infer<typeof priceCardVariantSchema>;
