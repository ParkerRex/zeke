import { z } from "zod";

// Schema for listing Stripe subscriptions
export const getStripeSubscriptionsSchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.number().min(1).max(100).default(25),
  status: z
    .enum(["active", "canceled", "incomplete", "past_due", "unpaid"])
    .optional(),
});

// Schema for creating a checkout session for research subscriptions
export const createCheckoutSessionSchema = z.object({
  priceId: z
    .string()
    .describe("Stripe price ID for the research subscription plan"),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  metadata: z
    .record(z.string(), z.string())
    .optional()
    .describe("Additional metadata for the subscription"),
});

// Schema for Stripe webhook events
export const stripeWebhookEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.record(z.string(), z.any()),
  }),
  created: z.number(),
});

// Schema for subscription plans (research tiers)
export const subscriptionPlanSchema = z.object({
  id: z.string(),
  name: z.string().describe("Plan name (e.g., 'Research Pro', 'Enterprise')"),
  description: z.string().describe("Plan description"),
  price: z.number().describe("Price in cents"),
  currency: z.string().default("usd"),
  interval: z.enum(["month", "year"]).describe("Billing interval"),
  features: z
    .array(z.string())
    .describe("List of features included in this plan"),
  maxSources: z
    .number()
    .optional()
    .describe("Maximum number of content sources"),
  maxAnalyses: z.number().optional().describe("Maximum analyses per month"),
});

// Schema for customer portal session
export const createPortalSessionSchema = z.object({
  returnUrl: z.string().url().describe("URL to return to after portal session"),
});

export type GetStripeSubscriptionsSchema = z.infer<
  typeof getStripeSubscriptionsSchema
>;
export type CreateCheckoutSessionSchema = z.infer<
  typeof createCheckoutSessionSchema
>;
export type StripeWebhookEventSchema = z.infer<typeof stripeWebhookEventSchema>;
export type SubscriptionPlanSchema = z.infer<typeof subscriptionPlanSchema>;
export type CreatePortalSessionSchema = z.infer<
  typeof createPortalSessionSchema
>;
