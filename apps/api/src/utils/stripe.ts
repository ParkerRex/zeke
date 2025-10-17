import Stripe from "stripe";

const STRIPE_API_VERSION = "2025-02-24.acacia";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error(
    "Missing STRIPE_SECRET_KEY environment variable for Stripe configuration",
  );
}

export const stripe = new Stripe(secretKey, {
  apiVersion: STRIPE_API_VERSION,
  typescript: true,
  appInfo: {
    name: "Zeke API",
  },
});

// Stripe configuration for Zeke's research content subscriptions
export const stripeConfig = {
  // Webhook endpoint secret for validating webhooks
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

  // Currency for subscriptions (default to USD)
  currency: process.env.STRIPE_CURRENCY || "usd",

  // Success and cancel URLs for checkout sessions
  successUrl:
    process.env.STRIPE_SUCCESS_URL || "https://app.zekehq.com/billing/success",
  cancelUrl:
    process.env.STRIPE_CANCEL_URL || "https://app.zekehq.com/billing/cancel",
} as const;
