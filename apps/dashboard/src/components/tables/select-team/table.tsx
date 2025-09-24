"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Table, TableBody } from "@zeke/ui/table";
import { TableRow } from "./table-row";

type Props = {
  data: RouterOutputs["team"]["list"];
};

export function SelectTeamTable({ data }: Props) {
  return (
    <Table>
      <TableBody className="border-none">
        {data.map((row) => (
          <TableRow key={row.id} row={row} />
        ))}
      </TableBody>
    </Table>
  );
}
