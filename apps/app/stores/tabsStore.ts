'use client';
import { create } from 'zustand';

import type { EmbedKind, Overlays } from '@zeke/supabase/types';

const STORAGE_PANEL_MAP = 'tabs:panelOpenById';
const STORAGE_PANEL_GLOBAL = 'tabs:sidePanelOpen';

function loadPanelMap(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_PANEL_MAP);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function savePanelMap(map: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_PANEL_MAP, JSON.stringify(map));
  } catch {
    // Ignore localStorage errors silently
  }
}

function loadPanelGlobal(): boolean | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_PANEL_GLOBAL);
    return raw ? raw === 'true' : undefined;
  } catch {
    return;
  }
}

function savePanelGlobal(v: boolean) {
  try {
    localStorage.setItem(STORAGE_PANEL_GLOBAL, String(v));
  } catch {
    // Ignore localStorage errors silently
  }
}

export type Tab = {
  id: string; // clusterId or "share:abc123"
  title: string;
  embedKind: EmbedKind;
  embedUrl: string;
  clusterId?: string;
  shareId?: string;
  overlays: Overlays;
  // Optional contextual data for non-story tabs (e.g., industry selection)
  context?: Record<string, unknown>;
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
  updateOverlay: (id: string, partial: Partial<Tab['overlays']>) => void;
  updateContext: (id: string, partial: Record<string, unknown>) => void;
  restoreFromUrl: (
    clusterIdOrShareId: string,
    isShare?: boolean
  ) => Promise<void>;
  promoteTab: (id: string) => void; // convert preview -> permanent
  pinTab: (id: string, pinned?: boolean) => void; // toggle pin
  closeOthers: (id: string) => void;
  closeToRight: (id: string) => void;
  sidePanelOpen: boolean;
  setSidePanelOpen: (v: boolean) => void;
  panelOpenById: Record<string, boolean>;
  // Batch: apply multiple changes and sort once
  batch: (fn: (tabs: Tab[]) => Tab[]) => void;
  // Clear persisted panel visibility state
  resetPanelState: () => void;
};

// TODO(perf): If tabs become very large, consider a stable in-place reordering
function sortTabs(tabs: Tab[]): Tab[] {
  // Keep pinned tabs first, relative order preserved
  const pinned = tabs.filter((t) => t.pinned);
  const normal = tabs.filter((t) => !t.pinned);
  return [...pinned, ...normal];
}

// Helper function to create a tab from story response
function createTabFromResponse(
  res: {
    title: string;
    embedKind: EmbedKind;
    embedUrl: string;
    overlays: Overlays;
  },
  optimisticId: string,
  isShare: boolean,
  id: string
): Tab {
  return {
    id: optimisticId,
    title: res.title,
    embedKind: res.embedKind,
    embedUrl: res.embedUrl,
    clusterId: isShare ? undefined : id,
    shareId: isShare ? id : undefined,
    overlays: res.overlays,
    preview: false,
  };
}

// Helper function to create optimistic tab
function createOptimisticTab(
  optimisticId: string,
  isShare: boolean,
  id: string
): Tab {
  return {
    id: optimisticId,
    title: 'Loading…',
    embedKind: 'article',
    embedUrl: 'about:blank',
    clusterId: isShare ? undefined : id,
    shareId: isShare ? id : undefined,
    overlays: {
      whyItMatters: '',
      chili: 0,
      confidence: 0,
      sources: [],
    },
    preview: true,
  };
}

export const useTabs = create<TabsState>((set, get) => ({
  tabs: [],
  activeId: undefined,
  sidePanelOpen: loadPanelGlobal() ?? true,
  panelOpenById: ((): Record<string, boolean> => {
    const map = loadPanelMap();
    // Migrate legacy non-story IDs to prefixed equivalents
    const migrations: Record<string, string> = {
      company: 'tab:company',
      industries: 'tab:industries',
    };
    const migrationKeys = Object.entries(migrations).filter(
      ([oldKey, newKey]) => oldKey in map && !(newKey in map)
    );

    if (migrationKeys.length > 0) {
      for (const [oldKey, newKey] of migrationKeys) {
        map[newKey] = map[oldKey];
        delete map[oldKey];
      }
      savePanelMap(map);
    }
    return map;
  })(),
  setSidePanelOpen: (v) =>
    set((s) => {
      const id = s.activeId;
      const panelOpenById = id
        ? { ...s.panelOpenById, [id]: v }
        : s.panelOpenById;
      savePanelGlobal(v);
      savePanelMap(panelOpenById);
      return {
        sidePanelOpen: v,
        panelOpenById,
      };
    }),
  openTab: (tab) =>
    set((s) => {
      const exists = s.tabs.find((t) => t.id === tab.id);
      if (exists) {
        // If the tab already exists, update preview flag/title/url etc. and activate it
        const tabs = sortTabs(
          s.tabs.map((t) => (t.id === tab.id ? { ...t, ...tab } : t))
        );
        return { tabs, activeId: tab.id };
      }
      return { tabs: sortTabs([...s.tabs, tab]), activeId: tab.id };
    }),
  closeTab: (id) =>
    set((s) => {
      const idx = s.tabs.findIndex((t) => t.id === id);
      const tabs = s.tabs.filter((t) => t.id !== id);
      const activeId =
        s.activeId === id ? tabs[idx - 1]?.id || tabs[0]?.id : s.activeId;
      return { tabs: sortTabs(tabs), activeId };
    }),
  setActive: (id) =>
    set((s) => ({
      activeId: id,
      sidePanelOpen: s.panelOpenById[id] ?? loadPanelGlobal() ?? true,
    })),
  promoteTab: (id) =>
    set((s) => ({
      tabs: sortTabs(
        s.tabs.map((t) => (t.id === id ? { ...t, preview: false } : t))
      ),
    })),
  pinTab: (id, pinned = true) =>
    set((s) => ({
      tabs: sortTabs(s.tabs.map((t) => (t.id === id ? { ...t, pinned } : t))),
    })),
  updateOverlay: (id, partial) =>
    set((s) => ({
      // Overlay updates don't affect ordering; avoid re-sorting for perf
      tabs: s.tabs.map((t) =>
        t.id === id ? { ...t, overlays: { ...t.overlays, ...partial } } : t
      ),
    })),
  updateContext: (id, partial) =>
    set((s) => ({
      // Context updates don't affect ordering; avoid re-sorting for perf
      tabs: s.tabs.map((t) =>
        t.id === id
          ? { ...t, context: { ...(t.context ?? {}), ...partial } }
          : t
      ),
    })),
  restoreFromUrl: async (id, isShare) => {
    const isShareTab = isShare ?? false;
    const optimisticId = isShareTab ? `share:${id}` : id;
    const optimistic = createOptimisticTab(optimisticId, isShareTab, id);
    get().openTab(optimistic);

    try {
      const endpoint = isShareTab
        ? `/api/share?id=${id}`
        : `/api/stories/${id}`;
      const res = await fetch(endpoint, { cache: 'no-store' }).then((r) =>
        r.json()
      );

      if (!res?.title) {
        throw new Error('Invalid story payload');
      }

      const tab = createTabFromResponse(res, optimisticId, isShareTab, id);
      get().openTab(tab);
    } catch (e) {
      try {
        const { toast } = await import('sonner');
        toast.error('Unable to open story', {
          description: String((e as Error)?.message || 'Unknown error'),
        });
      } catch {
        // Toast import failed, ignore
      }
    }
  },
  closeOthers: (id) =>
    set((s) => ({
      tabs: sortTabs(s.tabs.filter((t) => t.id === id || t.pinned)),
      activeId: id,
    })),
  closeToRight: (id) =>
    set((s) => {
      // Use current visual order (s.tabs) to decide which are to the right
      const current = s.tabs; // already sorted for pinning
      const idx = current.findIndex((t) => t.id === id);
      if (idx === -1 || current[idx]?.pinned) {
        return {}; // no-op for pinned tabs
      }
      // Keep everything up to idx, and always keep pinned tabs
      const kept = current.filter((t, i) => i <= idx || t.pinned);
      return { tabs: sortTabs(kept) };
    }),
  batch: (fn) => set((s) => ({ tabs: sortTabs(fn(s.tabs)) })),
  resetPanelState: () =>
    set((s) => {
      try {
        localStorage.removeItem(STORAGE_PANEL_MAP);
        localStorage.removeItem(STORAGE_PANEL_GLOBAL);
      } catch {
        // Ignore localStorage errors silently
      }
      return { ...s, panelOpenById: {}, sidePanelOpen: true };
    }),
}));
