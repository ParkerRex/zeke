"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import type { Table } from "@tanstack/react-table";
import { Button } from "@zeke/ui/button";
import { Input } from "@zeke/ui/input";
import type { Category } from "./columns";

type Props = {
  table?: Table<Category>;
  onOpenChange?: (isOpen: boolean) => void;
};

export function Header({ table, onOpenChange }: Props) {
  return (
    <div className="flex items-center py-4 justify-between">
      <Input
        placeholder="Search..."
        value={(table?.getColumn("name")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table?.getColumn("name")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />

      <Button onClick={() => onOpenChange?.(true)}>Create</Button>
    </div>
  );
}
