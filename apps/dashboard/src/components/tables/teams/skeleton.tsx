// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { cn } from "@zeke/ui/cn";
import { Skeleton } from "@zeke/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@zeke/ui/table";
import { DataTableHeader } from "./table-header";

export function TeamsSkeleton() {
  return (
    <div className="w-full">
      <DataTableHeader />

      <Table>
        <TableBody>
          {[...Array(6)].map((_, index) => (
            <TableRow key={index.toString()} className="hover:bg-transparent">
              <TableCell className={cn("border-r-[0px] py-4")}>
                <div className="flex items-center space-x-4">
                  <Skeleton className="rounded-full w-8 h-8" />

                  <div className="flex flex-col space-y-2">
                    <Skeleton className="w-[200px] h-3" />
                    <Skeleton className="w-[150px] h-2" />
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
