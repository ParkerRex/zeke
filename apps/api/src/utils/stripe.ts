import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

// Stripe configuration for Zeke's research content subscriptions
export const stripeConfig = {
  // Webhook endpoint secret for validating webhooks
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,

  // Currency for subscriptions (default to USD)
  currency: process.env.STRIPE_CURRENCY || "usd",

  // Success and cancel URLs for checkout sessions
  successUrl:
    process.env.STRIPE_SUCCESS_URL || "https://app.zekehq.com/billing/success",
  cancelUrl:
    process.env.STRIPE_CANCEL_URL || "https://app.zekehq.com/billing/cancel",
} as const;
