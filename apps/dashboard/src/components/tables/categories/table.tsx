"use client";
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { CreateCategoriesModal } from "@/components/modals/create-categories-modal";
import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "@zeke/ui/cn";
import { Dialog } from "@zeke/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zeke/ui/table";
import React from "react";
import { columns } from "./columns";
import { Header } from "./header";

export function DataTable() {
  const [isOpen, onOpenChange] = React.useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data } = useSuspenseQuery(trpc.tags.list.queryOptions());

  const deleteTagMutation = useMutation(
    trpc.tags.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.tags.list.queryKey(),
        });
      },
    }),
  );

  const table = useReactTable({
    data: data ?? [],
    getRowId: ({ id }) => id,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      deleteTag: (id: string) => {
        deleteTagMutation.mutate({ id });
      },
    },
  });

  return (
    <div className="w-full">
      <Header table={table} onOpenChange={onOpenChange} />

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow className="hover:bg-transparent" key={row.id}>
              {row.getVisibleCells().map((cell, index) => (
                <TableCell
                  key={cell.id}
                  className={cn(index === 3 && "w-[50px]")}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <CreateCategoriesModal onOpenChange={onOpenChange} isOpen={isOpen} />
      </Dialog>
    </div>
  );
}
