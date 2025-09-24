"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { useTrackerParams } from "@/hooks/use-tracker-params";
import { Sheet, SheetContent } from "@zeke/ui/sheet";
import React from "react";
import { TrackerSchedule } from "../tracker-schedule";

export function TrackerScheduleSheet() {
  const { setParams, projectId, range, selectedDate, eventId, update, create } =
    useTrackerParams();

  const isOpen =
    !update &&
    !create &&
    (Boolean(projectId) ||
      range?.length === 2 ||
      Boolean(selectedDate) ||
      Boolean(eventId));

  return (
    <Sheet
      open={isOpen}
      onOpenChange={() =>
        setParams({
          projectId: null,
          range: null,
          selectedDate: null,
          eventId: null,
        })
      }
    >
      <SheetContent>
        <TrackerSchedule />
      </SheetContent>
    </Sheet>
  );
}
