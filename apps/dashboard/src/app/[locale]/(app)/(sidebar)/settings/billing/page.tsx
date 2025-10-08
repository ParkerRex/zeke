import { ManageSubscription } from "@/components/manage-subscription";
import { Plans } from "@/components/plans";
import { getQueryClient, prefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing | Zeke",
};
/**
 * Billing Orders Data Flow
 * TODO: update this to STRIPE logic
 * This page displays the team's billing charges pulled from Polar's Orders API.
 *
 * Client-side flow:
 * - OrdersDataTable requests billing.orders via tRPC infinite query
 *   (apps/dashboard/src/components/tables/orders/data-table.tsx:18)
 * - Renders each order's timestamp, total, status, product name, and actions menu
 *   (apps/dashboard/src/components/tables/orders/data-table.tsx:47)
 * - ActionsMenu handles invoice PDF generation/download with polling
 *   (apps/dashboard/src/components/tables/orders/actions-menu.tsx:73)
 *
 * Server-side flow:
 * - Billing router finds Polar customer by team ID
 * - Pages through api.orders.list and filters by teamId metadata
 *   (apps/api/src/trpc/routers/billing.ts:7)
 * - Returns order data: id, creation date, total/currency, status, product name, invoice status
 *   (apps/api/src/trpc/routers/billing.ts:31)
 * - Handles invoice PDF generation via Polar API
 *   (apps/api/src/trpc/routers/billing.ts:64)
 *
 * Infrastructure:
 * - Uses shared Polar SDK client with POLAR_ACCESS_TOKEN/POLAR_ENVIRONMENT
 *   (apps/api/src/utils/polar.ts:1)
 * - All orders reflect real subscription transactions billed to the team
 */

export default async function Billing() {
  const queryClient = getQueryClient();
  const user = await queryClient.fetchQuery(trpc.user.me.queryOptions());

  const team = user?.team;

  prefetch(
    trpc.billing.orders.infiniteQueryOptions({
      pageSize: 15,
    }),
  );

  return (
    <div className="space-y-12">
      {team?.plan !== "trial" && <ManageSubscription />}

      {team?.plan === "trial" && (
        <div>
          <h2 className="text-lg font-medium leading-none tracking-tight mb-4">
            Plans
          </h2>

          <Plans />
        </div>
      )}

      {(team?.plan !== "trial" || team?.canceledAt !== null) && (
        <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          Billing history coming soon.
        </div>
      )}
    </div>
  );
}
