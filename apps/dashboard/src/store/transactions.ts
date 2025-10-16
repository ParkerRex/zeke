import { create } from "zustand";

export const useTransactionsStore = create(() => ({
  columns: [],
  canDelete: false,
  rowSelection: {},
  setCanDelete: () => {},
  setColumns: () => {},
  setRowSelection: () => {},
}));
