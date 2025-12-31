import { stripe } from "@/utils/stripe";
import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { connectDb, type Database } from "@zeke/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLAN_CODES = ["trial", "starter", "pro", "enterprise"] as const;
type PlanCode = (typeof PLAN_CODES)[number];

const SUBSCRIPTION_EVENT_TYPES = new Set<Stripe.Event.Type>([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    console.error("Missing Stripe webhook signature or secret");
    return new NextResponse("Webhook configuration error", { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutSessionCompleted(
        event.data.object as Stripe.Checkout.Session,
      );
    } else if (SUBSCRIPTION_EVENT_TYPES.has(event.type)) {
      await handleSubscriptionEvent(
        event.data.object as Stripe.Subscription,
        event.type,
      );
    } else {
      console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing Stripe webhook", error);
    return new NextResponse("Webhook processing failed", { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
) {
  const teamId = extractTeamId(session.metadata);
  const customerId = extractCustomerId(session.customer);

  if (!teamId || !customerId) {
    return;
  }

  // TODO: Store stripe customer ID when database schema is updated
  console.log(`Checkout completed for team ${teamId}, customer ${customerId}`);
}

async function handleSubscriptionEvent(
  subscription: Stripe.Subscription,
  eventType: Stripe.Event.Type,
) {
  const db = await connectDb();

  const teamId = await resolveTeamId(db, subscription);
  if (!teamId) {
    console.error(`Unable to resolve team for subscription ${subscription.id}`);
    return;
  }

  const planCode = await resolvePlanCode(db, subscription);
  const stripeCustomerId = extractCustomerId(subscription.customer);

  await upsertSubscriptionRecord(db, subscription, teamId, planCode);

  const shouldDowngrade =
    subscription.status === "canceled" ||
    eventType === "customer.subscription.deleted";

  await updateTeamBillingState(db, {
    teamId,
    planCode: shouldDowngrade ? "trial" : planCode,
    stripeCustomerId,
  });
}

async function resolveTeamId(
  db: Database,
  subscription: Stripe.Subscription,
): Promise<string | null> {
  const metadataTeamId = extractTeamId(subscription.metadata);
  if (metadataTeamId) {
    return metadataTeamId;
  }

  // TODO: Implement customer ID lookup when database schema is updated
  console.warn(
    `Cannot resolve team ID from customer for subscription ${subscription.id}`,
  );
  return null;
}

async function resolvePlanCode(
  db: Database,
  subscription: Stripe.Subscription,
): Promise<PlanCode> {
  const metadataPlan = extractPlanCode(subscription.metadata);
  if (metadataPlan) {
    return metadataPlan;
  }

  const firstItem = subscription.items?.data?.[0];

  const pricePlan = extractPlanCode(firstItem?.price?.metadata);
  if (pricePlan) {
    return pricePlan;
  }

  // TODO: Implement price lookup from database when prices table is migrated to Drizzle
  // For now, default to starter plan if not found in metadata
  return "starter";
}

async function upsertSubscriptionRecord(
  db: Database,
  subscription: Stripe.Subscription,
  teamId: string,
  planCode: PlanCode,
) {
  const priceId = subscription.items?.data?.[0]?.price?.id;

  if (!priceId) {
    console.error(
      `Subscription ${subscription.id} is missing an associated price`,
    );
    return;
  }

  // TODO: Implement subscription upsert when subscriptions table is migrated to Drizzle
  console.log(
    `Upsert subscription ${subscription.id} for team ${teamId}, plan: ${planCode}`,
  );
}

async function updateTeamBillingState(
  db: Database,
  params: {
    teamId: string;
    planCode: PlanCode;
    stripeCustomerId: string | null;
  },
) {
  // TODO: Update to use plan_code when schema is updated (currently uses 'plan' enum)
  console.log(
    `Team ${params.teamId} billing state: ${params.planCode}, customer: ${params.stripeCustomerId}`,
  );
}

function extractTeamId(
  metadata: Stripe.Metadata | null | undefined,
): string | null {
  if (!metadata) {
    return null;
  }

  const candidates = [
    metadata.teamId,
    metadata.team_id,
    metadata.teamID,
    metadata.team,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

function extractPlanCode(
  metadata: Stripe.Metadata | Record<string, unknown> | null | undefined,
): PlanCode | null {
  if (!metadata) {
    return null;
  }

  const lookup = metadata as Record<string, unknown>;

  const candidates = [
    lookup.plan,
    lookup.plan_code,
    lookup.planCode,
    lookup.plan_type,
    lookup.planType,
    lookup.price_card_variant,
    lookup.priceCardVariant,
    lookup.key,
  ];

  for (const candidate of candidates) {
    const plan = normalizePlanCode(candidate);
    if (plan) {
      return plan;
    }
  }

  return null;
}

function normalizePlanCode(value: unknown): PlanCode | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (PLAN_CODES.includes(normalized as PlanCode)) {
    return normalized as PlanCode;
  }

  return null;
}

function extractCustomerId(
  customer:
    | Stripe.Subscription["customer"]
    | Stripe.Checkout.Session["customer"],
): string | null {
  if (!customer) {
    return null;
  }

  if (typeof customer === "string") {
    return customer;
  }

  if ("deleted" in customer && customer.deleted) {
    return null;
  }

  return customer.id;
}

function toIsoDate(value: number | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return new Date(value * 1000).toISOString();
}

function normalizeMetadata(metadata: Stripe.Metadata | null | undefined) {
  if (!metadata) {
    return null;
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, value ?? null]),
  );
}
