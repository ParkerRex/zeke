// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { TableHead, TableHeader, TableRow } from "@zeke/ui/table";

export function OrdersTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[120px]">Date</TableHead>
        <TableHead className="w-[100px]">Amount</TableHead>
        <TableHead className="w-[120px]">Status</TableHead>
        <TableHead className="w-[140px]">Product</TableHead>
        <TableHead className="w-[100px] text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}
