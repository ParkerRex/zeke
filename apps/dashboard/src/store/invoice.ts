// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import type { Column } from "@tanstack/react-table";
import { create } from "zustand";

interface InvoiceState {
  columns: Column<any, unknown>[];
  setColumns: (columns?: Column<any, unknown>[]) => void;
}

export const useInvoiceStore = create<InvoiceState>()((set) => ({
  columns: [],
  setColumns: (columns) => set({ columns: columns || [] }),
}));
