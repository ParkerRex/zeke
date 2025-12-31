import { stripe } from "@/utils/stripe";
import { getSession } from "@zeke/auth/server";
import { connectDb } from "@zeke/db/client";
import { getTeamById } from "@zeke/db/queries";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export const GET = async (req: NextRequest) => {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error("You must be logged in");
  }

  const plan = req.nextUrl.searchParams.get("plan");
  const redirectPath = req.nextUrl.searchParams.get("redirectPath") ?? "/";
  const teamId = req.nextUrl.searchParams.get("teamId");
  const isDesktop = req.nextUrl.searchParams.get("isDesktop") === "true";
  const planType = req.nextUrl.searchParams.get("planType");

  const db = await connectDb();
  const team = await getTeamById(db, teamId!);

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

  // TODO: Implement price lookup from database when prices table is migrated to Drizzle
  // For now, return the plan as-is if it looks like a price ID
  console.warn("Price lookup not yet implemented - using plan directly:", plan);
  return null;
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
