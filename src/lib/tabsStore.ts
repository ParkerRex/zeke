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
  // Optional contextual data for non-story tabs (e.g., industry selection)
  context?: Record<string, any>;
  // Preview tabs are shown in italics until promoted (e.g., one-click open)
  preview?: boolean;
  // Pinned tabs stay at the front of the list
  pinned?: boolean;
};

type TabsState = {
  tabs: Tab[];
  activeId?: string;
  openTab: (tab: Tab) => void;
  closeTab: (id: string) => void;
  setActive: (id: string) => void;
  updateOverlay: (id: string, partial: Partial<Tab["overlays"]>) => void;
  updateContext: (id: string, partial: Record<string, any>) => void;
  restoreFromUrl: (clusterIdOrShareId: string, isShare?: boolean) => Promise<void>;
  promoteTab: (id: string) => void; // convert preview -> permanent
  pinTab: (id: string, pinned?: boolean) => void; // toggle pin
  closeOthers: (id: string) => void;
  closeToRight: (id: string) => void;
  sidePanelOpen: boolean;
  setSidePanelOpen: (v: boolean) => void;
};

// TODO(perf): If tabs become very large, consider a stable in-place reordering
function sortTabs(tabs: Tab[]): Tab[] {
  // Keep pinned tabs first, relative order preserved
  const pinned = tabs.filter((t) => t.pinned);
  const normal = tabs.filter((t) => !t.pinned);
  return [...pinned, ...normal];
}

export const useTabs = create<TabsState>((set, get) => ({
  tabs: [],
  activeId: undefined,
  sidePanelOpen: true,
  setSidePanelOpen: (v) => set({ sidePanelOpen: v }),
  openTab: (tab) =>
    set((s) => {
      const exists = s.tabs.find((t) => t.id === tab.id);
      if (exists) {
        // If the tab already exists, update preview flag/title/url etc. and activate it
        const tabs = sortTabs(s.tabs.map((t) => (t.id === tab.id ? { ...t, ...tab } : t)));
        return { tabs, activeId: tab.id };
      }
      return { tabs: sortTabs([...s.tabs, tab]), activeId: tab.id };
    }),
  closeTab: (id) =>
    set((s) => {
      const idx = s.tabs.findIndex((t) => t.id === id);
      const tabs = s.tabs.filter((t) => t.id !== id);
      const activeId = s.activeId === id ? tabs[idx - 1]?.id || tabs[0]?.id : s.activeId;
      return { tabs: sortTabs(tabs), activeId };
    }),
  setActive: (id) => set({ activeId: id }),
  promoteTab: (id) =>
    set((s) => ({ tabs: sortTabs(s.tabs.map((t) => (t.id === id ? { ...t, preview: false } : t))) })),
  pinTab: (id, pinned = true) =>
    set((s) => ({ tabs: sortTabs(s.tabs.map((t) => (t.id === id ? { ...t, pinned } : t))) })),
  updateOverlay: (id, partial) =>
    set((s) => ({
      tabs: sortTabs(s.tabs.map((t) => (t.id === id ? { ...t, overlays: { ...t.overlays, ...partial } } : t))),
    })),
  updateContext: (id, partial) =>
    set((s) => ({
      tabs: sortTabs(s.tabs.map((t) => (t.id === id ? { ...t, context: { ...(t.context ?? {}), ...partial } } : t))),
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
  closeOthers: (id) =>
    set((s) => ({ tabs: sortTabs(s.tabs.filter((t) => t.id === id || t.pinned)), activeId: id })),
  closeToRight: (id) =>
    set((s) => {
      const idx = s.tabs.findIndex((t) => t.id === id);
      if (idx === -1) return {} as any;
      // TODO(cleanup): match visual order if we ever enable drag-reordering
      const kept = s.tabs.filter((t, i) => i <= idx || t.pinned);
      return { tabs: sortTabs(kept) };
    }),
}));
