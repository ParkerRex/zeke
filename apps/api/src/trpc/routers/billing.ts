import {
  billingInvoiceDownloadSchema,
  billingInvoicePageSchema,
  getBillingOrdersSchema,
} from "@api/schemas/billing";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { stripe } from "@api/utils/stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TRPCError } from "@trpc/server";
import type Stripe from "stripe";
import { z } from "zod";

type StripeCustomer = string | Stripe.Customer | Stripe.DeletedCustomer | null;

const MAX_PAGE_SIZE = 100;

const extractCustomerId = (customer: StripeCustomer) => {
  if (!customer) {
    return null;
  }

  return typeof customer === "string" ? customer : customer.id;
};

const resolveInvoiceStatus = (
  status: Stripe.Invoice.Status | null | undefined,
): string => {
  switch (status) {
    case "paid":
      return "paid";
    case "void":
      return "canceled";
    case "uncollectible":
      return "failed";
    case "draft":
    case "open":
      return "pending";
    default:
      return status ?? "pending";
  }
};

const getInvoiceProductName = (invoice: Stripe.Invoice) => {
  const line = invoice.lines?.data?.[0];

  if (!line) {
    return invoice.description ?? undefined;
  }

  if (line.description) {
    return line.description;
  }

  if (line.price?.nickname) {
    return line.price.nickname;
  }

  const product = line.price?.product;
  if (product && typeof product !== "string" && "name" in product && product.name) {
    return product.name;
  }

  if (line.plan?.nickname) {
    return line.plan.nickname ?? undefined;
  }

  return invoice.description ?? undefined;
};

const getStripeCustomerId = async (
  supabase: SupabaseClient,
  teamId: string,
) => {
  const { data, error } = await supabase
    .from("teams")
    .select("stripe_customer_id")
    .eq("id", teamId)
    .maybeSingle();

  if (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unable to load billing details for this team",
      cause: error,
    });
  }

  return data?.stripe_customer_id ?? null;
};

const fetchInvoiceForTeam = async (
  invoiceId: string,
  teamId: string,
  supabase: SupabaseClient,
) => {
  const stripeCustomerId = await getStripeCustomerId(supabase, teamId);

  if (!stripeCustomerId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Team is not linked to a Stripe customer",
    });
  }

  try {
    const invoice = await stripe.invoices.retrieve(invoiceId, {
      expand: ["lines.data.price.product"],
    });

    if (extractCustomerId(invoice.customer) !== stripeCustomerId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invoice not found for this team",
      });
    }

    return invoice;
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unable to retrieve invoice",
      cause: error,
    });
  }
};

const resolveInvoiceDownloadUrl = (invoice: Stripe.Invoice) => {
  return invoice.invoice_pdf ?? invoice.hosted_invoice_url ?? undefined;
};

export const billingRouter = createTRPCRouter({
  orders: protectedProcedure
    .input(getBillingOrdersSchema)
    .output(billingInvoicePageSchema)
    .query(async ({ input, ctx: { teamId, supabase } }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "A team must be selected to view billing history",
        });
      }

      const stripeCustomerId = await getStripeCustomerId(supabase, teamId);

      if (!stripeCustomerId) {
        return {
          data: [],
          meta: {
            hasNextPage: false,
            cursor: undefined,
          },
        } as const;
      }

      const limit = Math.min(input.pageSize ?? 25, MAX_PAGE_SIZE);

      try {
        const invoices = await stripe.invoices.list({
          customer: stripeCustomerId,
          limit,
          starting_after: input.cursor || undefined,
          expand: ["data.lines.data.price.product"],
        });

        const mappedInvoices = invoices.data.map((invoice) => ({
          id: invoice.id,
          createdAt: new Date(
            (invoice.created ?? Math.floor(Date.now() / 1000)) * 1000,
          ),
          amount: {
            amount:
              invoice.total ?? invoice.amount_due ?? invoice.amount_paid ?? 0,
            currency: invoice.currency ?? "usd",
          },
          status: resolveInvoiceStatus(invoice.status),
          product: {
            name: getInvoiceProductName(invoice) ?? "Subscription",
          },
          invoiceId: invoice.id,
        }));

        const lastInvoice = invoices.data.at(-1);

        return {
          data: mappedInvoices,
          meta: {
            hasNextPage: invoices.has_more,
            cursor: invoices.has_more && lastInvoice ? lastInvoice.id : undefined,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load billing history",
          cause: error,
        });
      }
    }),

  getInvoice: protectedProcedure
    .input(z.string())
    .output(billingInvoiceDownloadSchema)
    .mutation(async ({ input: invoiceId, ctx: { teamId, supabase } }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "A team must be selected to download invoices",
        });
      }

      const invoice = await fetchInvoiceForTeam(invoiceId, teamId, supabase);

      if (invoice.status === "draft") {
        await stripe.invoices
          .finalizeInvoice(invoice.id)
          .catch(() => undefined);
        return { status: "generating" } as const;
      }

      const downloadUrl = resolveInvoiceDownloadUrl(invoice);

      if (!downloadUrl) {
        return { status: "generating" } as const;
      }

      return {
        status: "ready" as const,
        downloadUrl,
      };
    }),

  checkInvoiceStatus: protectedProcedure
    .input(z.string())
    .output(billingInvoiceDownloadSchema)
    .query(async ({ input: invoiceId, ctx: { teamId, supabase } }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "A team must be selected to view invoice status",
        });
      }

      try {
        const invoice = await fetchInvoiceForTeam(invoiceId, teamId, supabase);

        const downloadUrl = resolveInvoiceDownloadUrl(invoice);

        if (!downloadUrl) {
          return { status: "generating" as const };
        }

        return {
          status: "ready" as const,
          downloadUrl,
        };
      } catch (error) {
        if (error instanceof TRPCError && error.code === "NOT_FOUND") {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check invoice status",
          cause: error,
        });
      }
    }),
});
