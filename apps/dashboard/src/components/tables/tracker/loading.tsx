"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { Skeleton } from "@zeke/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@zeke/ui/table";
import { DataTableHeader } from "./data-table-header";

const data = [...Array(10)].map((_, i) => ({ id: i.toString() }));

export function Loading() {
  return (
    <div className="w-full">
      <div className="overflow-x-auto md:border-l md:border-r border-border">
        <Table>
          <DataTableHeader />

          <TableBody className="border-l-0 border-r-0 border-t-0 border-b-0">
            {data?.map((row) => (
              <TableRow key={row.id} className="h-[45px]">
                <TableCell className="w-[240px] min-w-[240px] sticky left-0 bg-background z-20">
                  <Skeleton className="h-3.5 w-[60%]" />
                </TableCell>
                <TableCell className="w-[180px]">
                  <Skeleton className="h-3.5 w-[50%]" />
                </TableCell>
                <TableCell className="w-[180px]">
                  <Skeleton className="h-3.5 w-[40%]" />
                </TableCell>
                <TableCell className="w-[190px]">
                  <Skeleton className="h-3.5 w-[50%]" />
                </TableCell>
                <TableCell className="w-[330px]">
                  <Skeleton className="h-3.5 w-[70%]" />
                </TableCell>
                <TableCell className="min-w-[170px]">
                  <Skeleton className="h-3.5 w-[60%]" />
                </TableCell>
                <TableCell className="w-[140px]">
                  <Skeleton className="h-3.5 w-[50%]" />
                </TableCell>
                <TableCell className="w-[150px] min-w-[150px]">
                  <Skeleton className="h-3.5 w-[40%]" />
                </TableCell>
                <TableCell className="w-[100px] sticky right-0 bg-background z-30">
                  <Skeleton className="h-3.5 w-[30%]" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
