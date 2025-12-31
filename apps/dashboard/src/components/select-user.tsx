"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@zeke/ui/spinner";
import { useEffect, useState } from "react";
import { AssignedUser } from "./assigned-user";

type User = {
  id: string;
  avatar_url?: string | null;
  full_name: string | null;
};

type Props = {
  selectedId?: string;
  onSelect: (selected: User) => void;
};

export function SelectUser({ selectedId, onSelect }: Props) {
  const [value, setValue] = useState<string>();
  const trpc = useTRPC();

  // Get current user to get their team ID
  const { data: currentUser } = useQuery(trpc.user.me.queryOptions());

  // Get team members
  const { data: teamMembers, isLoading } = useQuery({
    ...trpc.teams.getMembers.queryOptions({ teamId: currentUser?.teamId ?? "" }),
    enabled: !!currentUser?.teamId,
  });

  const users: User[] = teamMembers?.map((member) => ({
    id: member.id,
    avatar_url: member.avatarUrl,
    full_name: member.fullName,
  })) ?? [];

  useEffect(() => {
    setValue(selectedId);
  }, [selectedId]);

  if (!selectedId && isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return users.map((user) => {
    return (
      <button
        type="button"
        key={user.id}
        className="flex items-center text-sm cursor-default"
        onClick={() => onSelect(user)}
      >
        <AssignedUser avatarUrl={user.avatar_url} fullName={user.full_name} />
      </button>
    );
  });
}
