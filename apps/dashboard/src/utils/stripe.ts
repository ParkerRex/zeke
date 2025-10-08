import { env } from "@/env.mjs";
import Stripe from "stripe";

const stripeKey = env.STRIPE_SECRET_KEY;

export const stripe = stripeKey
  ? new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      appInfo: {
        name: "Zeke",
        version: "0.1.0",
      },
    })
  : (new Proxy(
      {},
      {
        get() {
          throw new Error("Stripe secret key not configured");
        },
      },
    ) as unknown as Stripe);
