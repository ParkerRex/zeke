import type { Database } from "@db/client";
import {
  type planCodeEnum,
  prices,
  type pricingPlanInterval,
  type pricingType,
  products,
  type subscriptionStatus,
  subscriptions,
} from "@db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

export type BillingPlanCode = (typeof planCodeEnum.enumValues)[number];
export type BillingInterval = (typeof pricingPlanInterval.enumValues)[number];
export type BillingPriceType = (typeof pricingType.enumValues)[number];
export type BillingSubscriptionStatus =
  (typeof subscriptionStatus.enumValues)[number];

export type BillingProductSummary = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  metadata: Record<string, unknown> | null;
};

export type BillingPriceSummary = {
  id: string;
  productId: string;
  active: boolean;
  currency: string;
  type: BillingPriceType;
  unitAmount: number | null;
  interval: BillingInterval | null;
  intervalCount: number | null;
  metadata: Record<string, unknown> | null;
};

export type BillingProductWithPrices = BillingProductSummary & {
  prices: BillingPriceSummary[];
};

export type BillingPriceWithProduct = BillingPriceSummary & {
  product: BillingProductSummary | null;
};

export type BillingSubscriptionRecord = {
  id: string;
  teamId: string;
  priceId: string;
  status: BillingSubscriptionStatus;
  planCode: BillingPlanCode;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  canceledAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  price: BillingPriceWithProduct | null;
};

const PRODUCT_INDEX_FALLBACK = 9999;
const ACTIVE_SUBSCRIPTION_STATUSES: BillingSubscriptionStatus[] = [
  "trialing",
  "active",
];

function mapProductRow(row: {
  id: string;
  name: string;
  description: string | null;
  active: boolean | null;
  metadata: unknown;
}): BillingProductSummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    active: !!row.active,
    metadata: (row.metadata ?? null) as Record<string, unknown> | null,
  };
}

function mapPriceRow(row: {
  id: string;
  productId: string;
  active: boolean | null;
  currency: string;
  type: BillingPriceType;
  unitAmount: number | null;
  interval: BillingInterval | null;
  intervalCount: number | null;
  metadata: unknown;
}): BillingPriceSummary {
  return {
    id: row.id,
    productId: row.productId,
    active: !!row.active,
    currency: row.currency,
    type: row.type,
    unitAmount: row.unitAmount,
    interval: row.interval,
    intervalCount: row.intervalCount,
    metadata: (row.metadata ?? null) as Record<string, unknown> | null,
  };
}

/**
 * Fetch all active Stripe products with their active prices.
 */
export async function getActiveProductsWithPrices(
  db: Database,
): Promise<BillingProductWithPrices[]> {
  const productRows = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      active: products.active,
      metadata: products.metadata,
    })
    .from(products)
    .where(eq(products.active, true))
    .orderBy(
      sql`coalesce(( ${products.metadata}->>'index' )::int, ${PRODUCT_INDEX_FALLBACK})`,
      products.name,
    );

  if (productRows.length === 0) {
    return [];
  }

  const productIds = productRows.map((product) => product.id);

  const priceRows = await db
    .select({
      id: prices.id,
      productId: prices.product_id,
      active: prices.active,
      currency: prices.currency,
      type: prices.type,
      unitAmount: prices.unit_amount,
      interval: prices.interval,
      intervalCount: prices.interval_count,
      metadata: prices.metadata,
    })
    .from(prices)
    .where(and(eq(prices.active, true), inArray(prices.product_id, productIds)))
    .orderBy(prices.product_id, prices.unit_amount);

  const pricesByProduct = new Map<string, BillingPriceSummary[]>();
  for (const row of priceRows) {
    const price = mapPriceRow(row);
    const list = pricesByProduct.get(price.productId) ?? [];
    list.push(price);
    pricesByProduct.set(price.productId, list);
  }

  return productRows.map((productRow) => {
    const product = mapProductRow(productRow);
    return {
      ...product,
      prices: pricesByProduct.get(product.id) ?? [],
    } satisfies BillingProductWithPrices;
  });
}

/**
 * Fetch the newest active subscription for a team, including price and product metadata.
 */
export async function getTeamActiveSubscription(
  db: Database,
  params: {
    teamId: string;
    statuses?: BillingSubscriptionStatus[];
  },
): Promise<BillingSubscriptionRecord | null> {
  const { teamId, statuses = ACTIVE_SUBSCRIPTION_STATUSES } = params;

  const filters = [eq(subscriptions.team_id, teamId)];
  if (statuses.length) {
    filters.push(inArray(subscriptions.status, statuses));
  }

  const baseQuery = db
    .select({
      id: subscriptions.id,
      teamId: subscriptions.team_id,
      priceId: subscriptions.price_id,
      status: subscriptions.status,
      planCode: subscriptions.plan_code,
      currentPeriodStart: subscriptions.current_period_start,
      currentPeriodEnd: subscriptions.current_period_end,
      trialEndsAt: subscriptions.trial_ends_at,
      canceledAt: subscriptions.canceled_at,
      metadata: subscriptions.metadata,
      createdAt: subscriptions.created_at,
      updatedAt: subscriptions.updated_at,
      price: {
        id: prices.id,
        productId: prices.product_id,
        active: prices.active,
        currency: prices.currency,
        type: prices.type,
        unitAmount: prices.unit_amount,
        interval: prices.interval,
        intervalCount: prices.interval_count,
        metadata: prices.metadata,
      },
      product: {
        id: products.id,
        name: products.name,
        description: products.description,
        active: products.active,
        metadata: products.metadata,
      },
    })
    .from(subscriptions)
    .innerJoin(prices, eq(prices.id, subscriptions.price_id))
    .leftJoin(products, eq(products.id, prices.product_id));

  const whereCondition =
    filters.length === 0
      ? null
      : filters.length === 1
        ? filters[0]
        : and(...filters);

  const conditionedQuery = whereCondition
    ? baseQuery.where(whereCondition)
    : baseQuery;

  const rows = await conditionedQuery
    .orderBy(desc(subscriptions.created_at))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return null;
  }

  if (!row.createdAt || !row.updatedAt) {
    throw new Error("Subscription record missing timestamps");
  }

  const price = row.price
    ? {
        ...mapPriceRow({
          id: row.price.id,
          productId: row.price.productId,
          active: row.price.active,
          currency: row.price.currency,
          type: row.price.type,
          unitAmount: row.price.unitAmount,
          interval: row.price.interval,
          intervalCount: row.price.intervalCount,
          metadata: row.price.metadata,
        }),
        product: row.product ? mapProductRow(row.product) : null,
      }
    : null;

  return {
    id: row.id,
    teamId: row.teamId,
    priceId: row.priceId,
    status: row.status,
    planCode: row.planCode,
    currentPeriodStart: row.currentPeriodStart,
    currentPeriodEnd: row.currentPeriodEnd,
    trialEndsAt: row.trialEndsAt,
    canceledAt: row.canceledAt,
    metadata: (row.metadata ?? null) as Record<string, unknown> | null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    price,
  } satisfies BillingSubscriptionRecord;
}

// Stub function for research system - plans are simplified to trial/starter/pro
export async function getAvailablePlans(db: Database, teamId: string) {
  // TODO: Implement proper plan management for research system
  // For now, return basic research plan options
  return [
    {
      id: "trial",
      name: "Research Trial",
      description: "7-day trial with basic discovery capabilities",
      price: 0,
      interval: "month" as const,
      features: [
        "Basic insight discovery",
        "Up to 100 sources",
        "Email support",
      ],
    },
    {
      id: "starter",
      name: "Research Starter",
      description: "Essential research tools for small teams",
      price: 29,
      interval: "month" as const,
      features: [
        "Advanced discovery",
        "Up to 1,000 sources",
        "Priority support",
        "Basic playbooks",
      ],
    },
    {
      id: "pro",
      name: "Research Pro",
      description: "Full research platform with publishing capabilities",
      price: 99,
      interval: "month" as const,
      features: [
        "Unlimited sources",
        "Custom playbooks",
        "Team collaboration",
        "API access",
        "White-label publishing",
      ],
    },
  ];
}
