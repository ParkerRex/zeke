"use client";

import { SearchModal } from "@/components/search/search-modal";
import { AssistantModal } from "@/components/sheets/assistant-modal";
import { InsightLinkSheet } from "@/components/sheets/insight-link-sheet";
import { NotificationCenterSheet } from "@/components/sheets/notification-center-sheet";
import { PlaybookRunSheet } from "@/components/sheets/playbook-run-sheet";
import { SourceIntakeSheet } from "@/components/sheets/source-intake-sheet";

/**
 * GlobalSheets - Registers all modal/sheet overlays for the Zeke research platform
 * State is managed via URL parameters using Nuqs for persistence
 */
export function GlobalSheets() {
  return (
    <>
      {/* Core research modals */}
      <SourceIntakeSheet />
      <AssistantModal />
      <PlaybookRunSheet />
      <NotificationCenterSheet />
      <InsightLinkSheet />

      {/* Search modal (keeping from existing) */}
      <SearchModal />
    </>
  );
}
