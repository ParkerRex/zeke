// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { create } from "zustand";

interface SearchState {
  isOpen: boolean;
  setOpen: () => void;
}

export const useSearchStore = create<SearchState>()((set) => ({
  isOpen: false,
  setOpen: () => set((state) => ({ isOpen: !state.isOpen })),
}));
