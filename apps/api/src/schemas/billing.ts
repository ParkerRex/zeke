import { z } from "zod";

export const getBillingOrdersSchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.number().int().min(1).max(100).default(25),
});

export const billingInvoiceSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  amount: z.object({
    amount: z.number(),
    currency: z.string(),
  }),
  status: z.string(),
  product: z.object({
    name: z.string(),
  }),
  invoiceId: z.string(),
});

export const billingInvoicePageSchema = z.object({
  data: z.array(billingInvoiceSchema),
  meta: z.object({
    hasNextPage: z.boolean(),
    cursor: z.string().optional(),
  }),
});

export const billingInvoiceDownloadSchema = z.union([
  z.object({
    status: z.literal("generating"),
  }),
  z.object({
    status: z.literal("ready"),
    downloadUrl: z.string(),
  }),
]);

export type GetBillingOrdersSchema = z.infer<typeof getBillingOrdersSchema>;
export type BillingInvoice = z.infer<typeof billingInvoiceSchema>;
export type BillingInvoicePage = z.infer<typeof billingInvoicePageSchema>;
export type BillingInvoiceDownload = z.infer<
  typeof billingInvoiceDownloadSchema
>;
