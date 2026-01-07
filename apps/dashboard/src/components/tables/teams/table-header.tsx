"use client";
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import type { RouterOutputs } from "@api/trpc/routers/_app";
import type { Table } from "@tanstack/react-table";
import { Button } from "@zeke/ui/button";
import { Input } from "@zeke/ui/input";
import Link from "next/link";

type Props = {
  table?: Table<RouterOutputs["team"]["list"][number]>;
};

export function DataTableHeader({ table }: Props) {
  return (
    <div className="flex items-center pb-4 space-x-4">
      <Input
        className="flex-1"
        placeholder="Search..."
        value={(table?.getColumn("team")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table?.getColumn("team")?.setFilterValue(event.target.value)
        }
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
      />
      <Link href="/teams/create">
        <Button variant="outline">Create team</Button>
      </Link>
    </div>
  );
}
