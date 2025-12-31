// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import type { RowSelectionState, Updater } from "@tanstack/react-table";
import { create } from "zustand";

interface DocumentsState {
  setRowSelection: (updater: Updater<RowSelectionState>) => void;
  rowSelection: Record<string, boolean>;
}

export const useDocumentsStore = create<DocumentsState>()((set) => ({
  rowSelection: {},
  setRowSelection: (updater: Updater<RowSelectionState>) =>
    set((state) => {
      return {
        rowSelection:
          typeof updater === "function" ? updater(state.rowSelection) : updater,
      };
    }),
}));
