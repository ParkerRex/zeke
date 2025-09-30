"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import {
  activeTabParser,
  globalPanelParser,
  panelStatesParser,
  tabMetadataParser,
  tabsParser,
} from "@/utils/nuqs";
import type { StoryEmbedKind, StoryOverlaySummary } from "@/utils/stories";
import { useQueryStates } from "nuqs";
import { useCallback } from "react";

export type Tab = {
  id: string; // clusterId or "share:abc123"
  title: string;
  embedKind: StoryEmbedKind;
  embedUrl: string;
  clusterId?: string;
  shareId?: string;
  overlays: StoryOverlaySummary;
  // Optional contextual data for non-story tabs (e.g., industry selection)
  context?: Record<string, unknown>;
  // Preview tabs are shown in italics until promoted (e.g., one-click open)
  preview?: boolean;
  // Pinned tabs stay at the front of the list
  pinned?: boolean;
};

// Helper function to sort tabs (pinned first)
function sortTabs(tabs: Tab[]): Tab[] {
  const pinned = tabs.filter((t) => t.pinned);
  const normal = tabs.filter((t) => !t.pinned);
  return [...pinned, ...normal];
}

// Helper function to create a tab from response
function createTabFromResponse(
  res: {
    title: string;
    embedKind: StoryEmbedKind;
    embedUrl: string;
    overlays: StoryOverlaySummary;
  },
  optimisticId: string,
  isShare: boolean,
  id: string,
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
  id: string,
): Tab {
  return {
    id: optimisticId,
    title: "Loading…",
    embedKind: "article",
    embedUrl: "about:blank",
    clusterId: isShare ? undefined : id,
    shareId: isShare ? id : undefined,
    overlays: {
      whyItMatters: "",
      chili: 0,
      confidence: 0,
      sources: [],
    },
    preview: true,
  };
}

export function useTabs() {
  const [state, setState] = useQueryStates({
    tabs: tabsParser,
    activeId: activeTabParser,
    panelStates: panelStatesParser,
    globalPanel: globalPanelParser,
    metadata: tabMetadataParser,
  });

  // Derive tab objects from URL state
  const tabs: Tab[] = sortTabs(
    state.tabs.map((id) => {
      const meta = state.metadata[id];
      return {
        id,
        title: meta?.title || `Tab ${id}`,
        embedKind: (meta?.embedKind as StoryEmbedKind) || "article",
        embedUrl: meta?.embedUrl || "about:blank",
        clusterId: meta?.clusterId,
        shareId: id.startsWith("share:") ? id.replace("share:", "") : undefined,
        preview: meta?.preview || false,
        pinned: meta?.pinned || false,
        overlays: {
          whyItMatters: "",
          chili: 0,
          confidence: 0,
          sources: [],
        },
        context: {},
      };
    }),
  );

  const activeId = state.activeId;
  const active = tabs.find((t) => t.id === activeId);

  // Tab operations
  const openTab = useCallback(
    (tab: Tab) => {
      setState((prev) => {
        const newTabs = prev.tabs.includes(tab.id)
          ? prev.tabs
          : [...prev.tabs, tab.id];

        return {
          tabs: newTabs,
          activeId: tab.id,
          metadata: {
            ...prev.metadata,
            [tab.id]: {
              title: tab.title,
              clusterId: tab.clusterId,
              embedKind: tab.embedKind,
              embedUrl: tab.embedUrl,
              preview: tab.preview,
              pinned: tab.pinned,
            },
          },
        };
      });
    },
    [setState],
  );

  const closeTab = useCallback(
    (id: string) => {
      setState((prev) => {
        const idx = prev.tabs.findIndex((tabId) => tabId === id);
        const newTabs = prev.tabs.filter((tabId) => tabId !== id);
        const newMetadata = { ...prev.metadata };
        delete newMetadata[id];

        const newPanelStates = { ...prev.panelStates };
        delete newPanelStates[id];

        // If closing active tab, activate another
        let newActiveId = prev.activeId;
        if (prev.activeId === id) {
          newActiveId = newTabs[idx - 1] || newTabs[0] || "";
        }

        return {
          tabs: newTabs,
          activeId: newActiveId,
          metadata: newMetadata,
          panelStates: newPanelStates,
        };
      });
    },
    [setState],
  );

  const setActive = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        activeId: id,
        // Update global panel state when switching tabs
        globalPanel: prev.panelStates[id] ?? prev.globalPanel,
      }));
    },
    [setState],
  );

  const pinTab = useCallback(
    (id: string, pinned = true) => {
      setState((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [id]: { ...prev.metadata[id], pinned },
        },
      }));
    },
    [setState],
  );

  const promoteTab = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [id]: { ...prev.metadata[id], preview: false },
        },
      }));
    },
    [setState],
  );

  // Panel management
  const sidePanelOpen = activeId
    ? (state.panelStates[activeId] ?? state.globalPanel)
    : state.globalPanel;

  const setSidePanelOpen = useCallback(
    (open: boolean) => {
      if (activeId) {
        setState((prev) => ({
          ...prev,
          panelStates: { ...prev.panelStates, [activeId]: open },
        }));
      } else {
        setState((prev) => ({ ...prev, globalPanel: open }));
      }
    },
    [activeId, setState],
  );

  // Batch operations
  const batch = useCallback(
    (fn: (tabs: Tab[]) => Tab[]) => {
      const newTabs = fn(tabs);
      const newTabIds = newTabs.map((t) => t.id);
      const newMetadata = Object.fromEntries(
        newTabs.map((tab) => [
          tab.id,
          {
            title: tab.title,
            clusterId: tab.clusterId,
            embedKind: tab.embedKind,
            embedUrl: tab.embedUrl,
            preview: tab.preview,
            pinned: tab.pinned,
          },
        ]),
      );

      setState((prev) => ({
        ...prev,
        tabs: newTabIds,
        metadata: newMetadata,
      }));
    },
    [tabs, setState],
  );

  // Update overlay
  const updateOverlay = useCallback(
    (id: string, partial: Partial<Overlays>) => {
      // Note: Overlays are not stored in URL state as they're too large
      // This would need to be handled by updating the tab object directly
      // or fetching fresh data from the API
      console.log("updateOverlay called:", id, partial);
    },
    [],
  );

  // Update context
  const updateContext = useCallback(
    (id: string, partial: Record<string, unknown>) => {
      // Context is also not stored in URL state
      console.log("updateContext called:", id, partial);
    },
    [],
  );

  // Restore from URL (for initial hydration)
  const restoreFromUrl = useCallback(
    async (id: string, isShare = false) => {
      const isShareTab = isShare ?? false;
      const optimisticId = isShareTab ? `share:${id}` : id;
      const optimistic = createOptimisticTab(optimisticId, isShareTab, id);
      openTab(optimistic);

      try {
        const endpoint = isShareTab
          ? `/api/share?id=${id}`
          : `/api/stories/${id}`;
        const res = await fetch(endpoint, { cache: "no-store" }).then((r) =>
          r.json(),
        );

        if (!res?.title) {
          throw new Error("Invalid story payload");
        }

        const tab = createTabFromResponse(res, optimisticId, isShareTab, id);
        openTab(tab);
      } catch (e) {
        try {
          const { toast } = await import("sonner");
          toast.error("Unable to open story", {
            description: String((e as Error)?.message || "Unknown error"),
          });
        } catch {
          // Toast import failed, ignore
        }
      }
    },
    [openTab],
  );

  return {
    tabs,
    activeId,
    active,
    openTab,
    closeTab,
    setActive,
    pinTab,
    promoteTab,
    updateOverlay,
    updateContext,
    restoreFromUrl,
    sidePanelOpen,
    setSidePanelOpen,
    panelOpenById: state.panelStates,
    batch,
    // Utility methods
    closeOthers: (id: string) => {
      const tab = tabs.find((t) => t.id === id);
      if (tab) batch(() => [tab]);
    },
    closeToRight: (id: string) => {
      const index = tabs.findIndex((t) => t.id === id);
      if (index >= 0) batch((tabs) => tabs.slice(0, index + 1));
    },
    resetPanelState: () => {
      setState((prev) => ({
        ...prev,
        panelStates: {},
        globalPanel: true,
      }));
    },
  };
}
