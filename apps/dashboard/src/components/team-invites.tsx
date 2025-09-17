"use client";

import { TeamInvite } from "@/components/team-invite";
import type { TeamInviteRow } from "./tables/select-team/types";

type Props = {
  invites: TeamInviteRow[];
};

export function TeamInvites({ invites }: Props) {
  if (!invites.length) {
    return null;
  }

  return (
    <div className="mt-4">
      <span className="text-sm font-mono text-[#878787] mb-4">Invitations</span>

      <div className="mt-6 space-y-4">
        {invites.map((invite) => (
          <TeamInvite key={invite.id} invite={invite} />
        ))}
      </div>
    </div>
  );
}
