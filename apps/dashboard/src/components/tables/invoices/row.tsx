"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { type Row, flexRender } from "@tanstack/react-table";
import { cn } from "@zeke/ui/cn";
import { TableCell, TableRow } from "@zeke/ui/table";
import type { Invoice } from "./columns";

type Props = {
  row: Row<Invoice>;
};

export function InvoiceRow({ row }: Props) {
  const { setParams } = useInvoiceParams();

  return (
    <>
      <TableRow
        className="group h-[57px] cursor-pointer hover:bg-[#F2F1EF] hover:dark:bg-secondary"
        key={row.id}
      >
        {row.getVisibleCells().map((cell, index) => (
          <TableCell
            key={cell.id}
            className={cn(
              index === 2 && "w-[50px] min-w-[50px]",
              cell.column.columnDef.meta?.className,
            )}
            onClick={() => {
              if (index !== row.getVisibleCells().length - 1) {
                setParams({
                  invoiceId: row.id,
                  type: "details",
                });
              }
            }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    </>
  );
}
