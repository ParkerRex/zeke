"use client";
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { InviteTeamMembersModal } from "@/components/modals/invite-team-members-modal";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import type { Table } from "@tanstack/react-table";
import { Button } from "@zeke/ui/button";
import { Dialog } from "@zeke/ui/dialog";
import { Input } from "@zeke/ui/input";
import { useState } from "react";

type Props = {
  table?: Table<RouterOutputs["team"]["teamInvites"][number]>;
};

export function DataTableHeader({ table }: Props) {
  const [isOpen, onOpenChange] = useState(false);

  return (
    <div className="flex items-center pb-4 space-x-4">
      <Input
        className="flex-1"
        placeholder="Search..."
        value={(table?.getColumn("email")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table?.getColumn("email")?.setFilterValue(event.target.value)
        }
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
      />
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <Button onClick={() => onOpenChange(true)}>Invite member</Button>
        <InviteTeamMembersModal onOpenChange={onOpenChange} />
      </Dialog>
    </div>
  );
}
