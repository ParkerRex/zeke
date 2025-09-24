"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { InboxSheetDetails } from "@/components/inbox-sheet-details";
import { useInboxParams } from "@/hooks/use-inbox-params";
import { Sheet, SheetContent } from "@zeke/ui/sheet";
import React from "react";

export function InboxDetailsSheet() {
  const { params, setParams } = useInboxParams();

  const isOpen = Boolean(params.inboxId && params.type === "details");

  return (
    <Sheet
      open={isOpen}
      onOpenChange={() => setParams({ type: null, inboxId: null })}
    >
      <SheetContent style={{ maxWidth: 647 }}>
        <InboxSheetDetails />
      </SheetContent>
    </Sheet>
  );
}
