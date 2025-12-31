// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { Invites } from "./invites";
import { DataTable } from "./table";

export function TeamsTable() {
  return (
    <div className="flex flex-col gap-4">
      <DataTable />
      <Invites />
    </div>
  );
}
