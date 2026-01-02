import Stripe from "stripe";

const STRIPE_API_VERSION = "2025-12-15.clover";

const secretKey = process.env.STRIPE_SECRET_KEY;

// Stripe is optional in development - will throw when actually used if not configured
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!secretKey) {
      throw new Error(
        "Missing STRIPE_SECRET_KEY environment variable for Stripe configuration",
      );
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: STRIPE_API_VERSION,
      typescript: true,
      appInfo: {
        name: "Zeke API",
      },
    });
  }
  return stripeInstance;
}

// Export a proxy that lazily initializes Stripe
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return getStripe()[prop as keyof Stripe];
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
