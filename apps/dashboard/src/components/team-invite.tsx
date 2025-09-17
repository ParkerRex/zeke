"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@zeke/ui/avatar";
import { SubmitButton } from "@zeke/ui/submit-button";
import { acceptTeamInviteAction } from "@/actions/teams/accept-team-invite-action";
import { declineTeamInviteAction } from "@/actions/teams/decline-team-invite-action";
import type { TeamInviteRow } from "./tables/select-team/types";

type Props = {
  invite: TeamInviteRow;
};

export function TeamInvite({ invite }: Props) {
  const router = useRouter();

  const acceptInvite = useAction(acceptTeamInviteAction, {
    onSuccess: () => {
      router.refresh();
      router.push("/");
    },
  });

  const declineInvite = useAction(declineTeamInviteAction, {
    onSuccess: () => {
      router.refresh();
    },
  });

  const teamName = invite.team?.name ?? "";

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Avatar className="size-8 rounded-none">
          {invite.team?.logoUrl ? (
            <AvatarImage
              src={invite.team.logoUrl}
              alt={teamName}
              className="rounded-none"
            />
          ) : null}
          <AvatarFallback className="rounded-none">
            <span className="text-xs">{teamName.charAt(0).toUpperCase()}</span>
          </AvatarFallback>
        </Avatar>

        <span className="text-sm font-medium">{teamName}</span>
      </div>

      <div className="flex gap-2">
        <SubmitButton
          isSubmitting={acceptInvite.status === "executing"}
          variant="outline"
          onClick={() =>
            acceptInvite.execute({
              inviteId: invite.id,
            })
          }
        >
          Accept
        </SubmitButton>
        <SubmitButton
          isSubmitting={declineInvite.status === "executing"}
          variant="outline"
          onClick={() =>
            declineInvite.execute({
              inviteId: invite.id,
            })
          }
        >
          Decline
        </SubmitButton>
      </div>
    </div>
  );
}
