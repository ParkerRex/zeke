"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { cn } from "@zeke/ui/cn";
import { Skeleton } from "@zeke/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@zeke/ui/table";
import { DataTableHeader } from "./data-table-header";

const data = [...Array(40)].map((_, i) => ({ id: i.toString() }));

export function Loading({ isEmpty }: { isEmpty?: boolean }) {
  return (
    <div className="w-full">
      <div
        className={cn(
          "overflow-x-auto",
          !isEmpty && "md:border-l md:border-r border-border",
        )}
      >
        <Table
          className={cn(
            "min-w-[1600px]",
            isEmpty && "opacity-20 pointer-events-none blur-[7px]",
          )}
        >
          <DataTableHeader loading />

          <TableBody className="border-l-0 border-r-0 border-t-0 border-b-0">
            {data?.map((row) => (
              <TableRow key={row.id} className="h-[45px]">
                {/* Select column - always visible */}
                <TableCell className="w-[50px] min-w-[50px]">
                  <Skeleton className="h-3.5 w-[15px]" />
                </TableCell>

                {/* Date column - always visible */}
                <TableCell className="w-[110px] min-w-[110px]">
                  <Skeleton className="h-3.5 w-[60%]" />
                </TableCell>

                {/* Description column - always visible */}
                <TableCell className="w-[320px] min-w-[320px]">
                  <Skeleton className="h-3.5 w-[50%]" />
                </TableCell>

                {/* Amount column */}
                <TableCell className="w-[170px] min-w-[170px]">
                  <Skeleton className="h-3.5 w-[50%]" />
                </TableCell>

                {/* Tax Amount column */}
                <TableCell className="w-[170px] min-w-[170px]">
                  <Skeleton className="h-3.5 w-[60%]" />
                </TableCell>

                {/* Category column */}
                <TableCell className="w-[250px] min-w-[250px]">
                  <div className="flex items-center space-x-2 w-[80%]">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-3.5 w-[70%]" />
                  </div>
                </TableCell>

                {/* Counterparty column */}
                <TableCell className="w-[200px] min-w-[200px]">
                  <Skeleton className="h-3.5 w-[60%]" />
                </TableCell>

                {/* Tags column */}
                <TableCell className="w-[280px] max-w-[280px]">
                  <div className="flex items-center space-x-1">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </TableCell>

                {/* Bank Account column */}
                <TableCell className="w-[250px]">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-3.5 w-[60%]" />
                  </div>
                </TableCell>

                {/* Method column */}
                <TableCell className="w-[140px] min-w-[140px]">
                  <Skeleton className="h-3.5 w-[50%]" />
                </TableCell>

                {/* Assigned column */}
                <TableCell className="w-[220px] min-w-[220px]">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-3.5 w-[50%]" />
                  </div>
                </TableCell>

                {/* Status column */}
                <TableCell className="w-[140px]">
                  <Skeleton className="h-5 w-[80px]" />
                </TableCell>

                {/* Actions column - always visible */}
                <TableCell className="w-[100px]">
                  <Skeleton className="h-[20px] w-[20px]" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
