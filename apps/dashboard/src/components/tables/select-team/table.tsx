"use client";

import { Table, TableBody } from "@zeke/ui/table";
import type { SelectTeamRow } from "./types";
import { TableRow } from "./table-row";

type Props = {
  data: SelectTeamRow[];
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
