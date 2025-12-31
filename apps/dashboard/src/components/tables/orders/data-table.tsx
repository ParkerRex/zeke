"use client";
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { useTRPC } from "@/trpc/client";
import { formatDate } from "@/utils/format";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@zeke/ui/button";
import { Spinner } from "@zeke/ui/spinner";
import { Table, TableBody, TableCell, TableRow } from "@zeke/ui/table";
import { useMemo } from "react";
import { FormatAmount } from "../../format-amount";
import { OrderStatus } from "../../order-status";
import { ActionsMenu } from "./actions-menu";
import { OrdersTableHeader } from "./table-header";

export function OrdersDataTable() {
  const trpc = useTRPC();

  const infiniteQueryOptions = trpc.billing.orders.infiniteQueryOptions(
    {
      pageSize: 15,
    },
    {
      getNextPageParam: ({ meta }) => meta?.cursor,
    },
  );

  const { data, fetchNextPage, hasNextPage, isFetching } =
    useSuspenseInfiniteQuery(infiniteQueryOptions);

  const tableData = useMemo(() => {
    return data?.pages.flatMap((page) => page?.data ?? []) ?? [];
  }, [data]);

  return (
    <div className="w-full">
      <Table>
        <OrdersTableHeader />
        <TableBody>
          {tableData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center">
                <p className="text-muted-foreground">No orders found</p>
              </TableCell>
            </TableRow>
          ) : (
            tableData.map((order) => (
              <TableRow key={order.id} className="h-[45px]">
                <TableCell className="w-[120px] text-sm text-muted-foreground">
                  {formatDate(
                    order.createdAt.toISOString(),
                    "MMM, yyyy",
                    false,
                  )}
                </TableCell>
                <TableCell className="w-[100px] font-medium">
                  <FormatAmount
                    amount={order.amount.amount / 100}
                    currency={order.amount.currency}
                  />
                </TableCell>
                <TableCell className="w-[120px]">
                  <OrderStatus status={order.status} />
                </TableCell>
                <TableCell className="w-[140px] text-sm">
                  {order.product?.name || "N/A"}
                </TableCell>
                <TableCell className="w-[100px] text-right">
                  <ActionsMenu order={order} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {hasNextPage && (
        <div className="flex items-center justify-center mt-6">
          <Button
            onClick={() => fetchNextPage()}
            variant="outline"
            className="w-full"
          >
            {isFetching ? <Spinner /> : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
