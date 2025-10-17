import { stripe } from "@/utils/stripe";
import { getSession } from "@zeke/supabase/cached-queries";
import { getTeamByIdQuery } from "@zeke/supabase/queries";
import { createClient } from "@zeke/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export const GET = async (req: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { session },
  } = await getSession();

  if (!session?.user?.id) {
    throw new Error("You must be logged in");
  }

  const plan = req.nextUrl.searchParams.get("plan");
  const redirectPath = req.nextUrl.searchParams.get("redirectPath") ?? "/";
  const teamId = req.nextUrl.searchParams.get("teamId");
  const isDesktop = req.nextUrl.searchParams.get("isDesktop") === "true";
  const planType = req.nextUrl.searchParams.get("planType");

  const { data: team } = await getTeamByIdQuery(supabase, teamId!);

  if (!team) {
    throw new Error("Team not found");
  }

  const priceId = await resolvePriceId({
    plan,
    planType,
  });

  if (!priceId) {
    throw new Error("Invalid plan");
  }

  const successUrl = new URL("/api/checkout/success", req.nextUrl.origin);
  successUrl.searchParams.set("redirectPath", redirectPath);

  if (isDesktop) {
    successUrl.searchParams.set("isDesktop", "true");
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: team.id,
    success_url: successUrl.toString(),
    cancel_url: new URL(redirectPath ?? "/", req.nextUrl.origin).toString(),
    customer_email: session.user.email ?? undefined,
    metadata: {
      teamId: team.id,
      teamName: team.name ?? "",
      plan: plan ?? "",
      planType: planType ?? "",
    },
    subscription_data: {
      metadata: {
        teamId: team.id,
        teamName: team.name ?? "",
        plan: plan ?? "",
        planType: planType ?? "",
      },
    },
  });

  if (!checkoutSession.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return NextResponse.redirect(checkoutSession.url);
};

async function resolvePriceId({
  plan,
  planType,
}: {
  plan: string | null;
  planType: string | null;
}): Promise<string | null> {
  if (!plan) {
    return null;
  }

  if (plan.startsWith("price_")) {
    return plan;
  }

  const supabase = await createClient({ admin: true });
  const normalizedPlan = plan.toLowerCase();
  const { data, error } = await supabase
    .from("prices")
    .select(
      `
        id,
        interval,
        metadata,
        products (
          metadata
        )
      `,
    )
    .eq("active", true);

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const planMatches = data.filter((record) =>
    matchesPlanCode(normalizedPlan, record.metadata, record.products?.metadata),
  );

  if (planMatches.length === 0) {
    return null;
  }

  const preferredInterval = inferPreferredInterval(planType);

  const intervalMatch = planMatches.find(
    (record) =>
      typeof record.interval === "string" &&
      preferredInterval !== null &&
      record.interval.toLowerCase() === preferredInterval,
  );

  const selected = intervalMatch ?? planMatches[0];

  return typeof selected?.id === "string" ? selected.id : null;
}

function matchesPlanCode(
  plan: string,
  priceMetadata: Record<string, unknown> | null,
  productMetadata: Record<string, unknown> | null,
): boolean {
  const candidates = [
    priceMetadata?.plan_code,
    priceMetadata?.planCode,
    priceMetadata?.plan,
    priceMetadata?.key,
    productMetadata?.plan_code,
    productMetadata?.planCode,
    productMetadata?.plan,
    productMetadata?.key,
  ];

  return candidates.some(
    (value) => typeof value === "string" && value.toLowerCase() === plan,
  );
}

function inferPreferredInterval(planType: string | null): string | null {
  if (!planType) {
    return null;
  }

  const normalized = planType.toLowerCase();

  if (normalized.includes("year")) {
    return "year";
  }

  if (normalized.includes("month")) {
    return "month";
  }

  return null;
}
