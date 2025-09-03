"use client";
import { create } from "zustand";

import type { EmbedKind, Overlays } from "@/features/stories";

export type Tab = {
  id: string; // clusterId or "share:abc123"
  title: string;
  embedKind: EmbedKind;
  embedUrl: string;
  clusterId?: string;
  shareId?: string;
  overlays: Overlays;
};

type TabsState = {
  tabs: Tab[];
  activeId?: string;
  openTab: (tab: Tab) => void;
  closeTab: (id: string) => void;
  setActive: (id: string) => void;
  updateOverlay: (id: string, partial: Partial<Tab["overlays"]>) => void;
  restoreFromUrl: (clusterIdOrShareId: string, isShare?: boolean) => Promise<void>;
};

export const useTabs = create<TabsState>((set, get) => ({
  tabs: [],
  activeId: undefined,
  openTab: (tab) =>
    set((s) =>
      s.tabs.some((t) => t.id === tab.id)
        ? { activeId: tab.id }
        : { tabs: [...s.tabs, tab], activeId: tab.id }
    ),
  closeTab: (id) =>
    set((s) => {
      const idx = s.tabs.findIndex((t) => t.id === id);
      const tabs = s.tabs.filter((t) => t.id !== id);
      const activeId = s.activeId === id ? tabs[idx - 1]?.id || tabs[0]?.id : s.activeId;
      return { tabs, activeId };
    }),
  setActive: (id) => set({ activeId: id }),
  updateOverlay: (id, partial) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, overlays: { ...t.overlays, ...partial } } : t)),
    })),
  restoreFromUrl: async (id, isShare) => {
    const endpoint = isShare ? `/api/share?id=${id}` : `/api/stories/${id}`;
    const res = await fetch(endpoint).then((r) => r.json());
    const tab: Tab = {
      id: isShare ? `share:${id}` : id,
      title: res.title,
      embedKind: res.embedKind,
      embedUrl: res.embedUrl,
      clusterId: isShare ? undefined : id,
      shareId: isShare ? id : undefined,
      overlays: res.overlays, // whyItMatters, chili, sources, confidence
    };
    get().openTab(tab);
  },
}));
