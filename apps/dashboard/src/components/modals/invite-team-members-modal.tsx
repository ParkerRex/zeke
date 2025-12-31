"use client";
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@zeke/ui/dialog";
import { InviteForm } from "../forms/invite-form";

type InviteTeamMembersModalProps = {
  onOpenChange: (open: boolean) => void;
};

export function InviteTeamMembersModal({
  onOpenChange,
}: InviteTeamMembersModalProps) {
  return (
    <DialogContent className="max-w-[455px]">
      <div className="p-4">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>
            Invite new members by email address.
          </DialogDescription>
        </DialogHeader>

        <InviteForm onSuccess={() => onOpenChange(false)} skippable={false} />
      </div>
    </DialogContent>
  );
}
