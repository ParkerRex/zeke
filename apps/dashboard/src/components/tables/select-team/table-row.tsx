"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SubmitButton } from "@zeke/ui/submit-button";
import { Avatar, AvatarFallback, AvatarImage } from "@zeke/ui/avatar";
import { TableRow as BaseTableRow, TableCell } from "@zeke/ui/table";
import { setActiveTeamAction } from "@/actions/teams/set-active-team-action";
import type { SelectTeamRow } from "./types";

type Props = {
  row: SelectTeamRow;
};

export function TableRow({ row }: Props) {
  const router = useRouter();
  const changeTeam = useAction(setActiveTeamAction, {
    onSuccess: () => {
      router.push("/");
    },
  });

  useEffect(() => {
    if (changeTeam.status === "hasErrored") {
      // TODO: surface toast once notification system wired
      console.error(changeTeam.error);
    }
  }, [changeTeam.status, changeTeam.error]);

  return (
    <BaseTableRow key={row.id} className="hover:bg-transparent">
      <TableCell className="border-r-0 py-4 px-0">
        <div className="flex items-center space-x-4">
          <Avatar className="size-8 rounded-none">
            {row.logoUrl ? (
              <AvatarImage src={row.logoUrl} alt={row.name ?? ""} />
            ) : null}
            <AvatarFallback className="rounded-none">
              <span className="text-xs">
                {row.name?.charAt(0)?.toUpperCase()}
              </span>
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{row.name}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-0">
        <div className="flex justify-end">
          <SubmitButton
            isSubmitting={changeTeam.status === "executing"}
            variant="outline"
            onClick={() => {
              changeTeam.execute({ teamId: row.id });
            }}
          >
            Launch
          </SubmitButton>
        </div>
      </TableCell>
    </BaseTableRow>
  );
}
