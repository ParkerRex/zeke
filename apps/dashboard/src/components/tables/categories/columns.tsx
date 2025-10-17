"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { EditCategoryModal } from "@/components/modals/edit-category-modal";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@zeke/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@zeke/ui/dropdown-menu";
import { Icons } from "@zeke/ui/icons";
import * as React from "react";

export type Tag = RouterOutputs["tags"]["list"][number];

export const columns: ColumnDef<any>[] = [
  {
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2 items-center">
          <span>{row.getValue("name")}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const [isEditOpen, setIsEditOpen] = React.useState(false);

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Icons.MoreHoriz className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() =>
                  (table.options.meta as any)?.deleteTag?.(row.original.id)
                }
              >
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <EditCategoryModal
            id={row.original.id}
            defaultValue={row.original}
            isOpen={isEditOpen}
            onOpenChange={setIsEditOpen}
          />
        </div>
      );
    },
  },
];
