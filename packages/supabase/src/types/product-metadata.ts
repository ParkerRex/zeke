import z from 'zod';

// Accept either 'pro' or 'Pro' in metadata; normalize to 'pro' for UI mapping.
const rawPriceCardVariantSchema = z.enum(['pro', 'Pro']);
export const priceCardVariantSchema = z.enum(['pro']);

// Product metadata now focuses on: price (optional, if provided in metadata),
// the card variant, and support level which we standardize to 'founder chat'.
export const productMetadataSchema = z
  .object({
    price_card_variant: rawPriceCardVariantSchema,
    // Optional price, if present in product metadata. Can be string or number.
    price: z.union([z.string(), z.number()]).optional(),
    // Incoming support_level is ignored; we standardize to 'founder chat'.
    support_level: z.string().optional(),
  })
  .transform((data) => {
    const normalizedVariant = (
      typeof data.price_card_variant === 'string'
        ? data.price_card_variant.toLowerCase()
        : data.price_card_variant
    ) as z.infer<typeof priceCardVariantSchema>;

    const price =
      typeof data.price === 'string'
        ? Number.parseFloat(data.price)
        : data.price;

    return {
      priceCardVariant: normalizedVariant,
      price, // in whatever unit provided (recommend USD dollars)
      supportLevel: 'founder chat' as const,
    };
  });

export type ProductMetadata = z.infer<typeof productMetadataSchema>;
export type PriceCardVariant = z.infer<typeof priceCardVariantSchema>;
