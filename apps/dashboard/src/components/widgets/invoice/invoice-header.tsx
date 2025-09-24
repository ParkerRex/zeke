"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { Button } from "@zeke/ui/button";
import { Icons } from "@zeke/ui/icons";
import Link from "next/link";

export function InvoiceWidgetHeader() {
  const { setParams } = useInvoiceParams();

  return (
    <div className="flex justify-between items-center">
      <Link href="/invoices" prefetch>
        <h2 className="text-lg">Invoices</h2>
      </Link>

      <Button
        variant="outline"
        size="icon"
        onClick={() => setParams({ type: "create" })}
      >
        <Icons.Add />
      </Button>
    </div>
  );
}
