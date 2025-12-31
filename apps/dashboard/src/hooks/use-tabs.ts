"use client";
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import type { StoryEmbedKind, StoryOverlaySummary } from "@/utils/stories";
import { useCallback, useMemo, useState } from "react";

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

type TabMetadata = {
  title?: string;
  clusterId?: string;
  embedKind?: StoryEmbedKind;
  embedUrl?: string;
  preview?: boolean;
  pinned?: boolean;
};

type TabsState = {
  tabs: string[];
  activeId: string;
  metadata: Record<string, TabMetadata>;
  panelStates: Record<string, boolean>;
  globalPanel: boolean;
};

const DEFAULT_OVERLAYS: StoryOverlaySummary = {
  whyItMatters: "",
  chili: 0,
  confidence: 0,
  sources: [],
};

const INITIAL_STATE: TabsState = {
  tabs: [],
  activeId: "",
  metadata: {},
  panelStates: {},
  globalPanel: false,
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
    overlays: DEFAULT_OVERLAYS,
    preview: true,
  };
}

export function useTabs() {
  const [state, setState] = useState<TabsState>(INITIAL_STATE);

  const tabs: Tab[] = useMemo(() => {
    return sortTabs(
      state.tabs.map((id) => {
        const meta = state.metadata[id];
        return {
          id,
          title: meta?.title || `Tab ${id}`,
          embedKind: meta?.embedKind || "article",
          embedUrl: meta?.embedUrl || "about:blank",
          clusterId: meta?.clusterId,
          shareId: id.startsWith("share:") ? id.replace("share:", "") : undefined,
          preview: meta?.preview || false,
          pinned: meta?.pinned || false,
          overlays: DEFAULT_OVERLAYS,
          context: {},
        } satisfies Tab;
      }),
    );
  }, [state.metadata, state.tabs]);

  const activeId = state.activeId;
  const active = tabs.find((t) => t.id === activeId);

  // Tab operations
  const openTab = useCallback(
    (tab: Tab) => {
      setState((prev) => {
        const exists = prev.tabs.includes(tab.id);
        const updatedTabs = exists ? prev.tabs : [...prev.tabs, tab.id];

        return {
          ...prev,
          tabs: updatedTabs,
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
    [],
  );

  const closeTab = useCallback((id: string) => {
    setState((prev) => {
      const idx = prev.tabs.findIndex((tabId) => tabId === id);
      const newTabs = prev.tabs.filter((tabId) => tabId !== id);
      const { [id]: _, ...metadata } = prev.metadata;
      const { [id]: __, ...panelStates } = prev.panelStates;

      let newActiveId = prev.activeId;
      if (prev.activeId === id) {
        newActiveId = newTabs[idx - 1] || newTabs[0] || "";
      }

      return {
        ...prev,
        tabs: newTabs,
        activeId: newActiveId,
        metadata,
        panelStates,
      };
    });
  }, []);

  const setActive = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      activeId: id,
      globalPanel: prev.panelStates[id] ?? prev.globalPanel,
    }));
  }, []);

  const pinTab = useCallback((id: string, pinned = true) => {
    setState((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [id]: { ...prev.metadata[id], pinned },
      },
    }));
  }, []);

  const promoteTab = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [id]: { ...prev.metadata[id], preview: false },
      },
    }));
  }, []);

  // Panel management
  const sidePanelOpen = activeId
    ? state.panelStates[activeId] ?? state.globalPanel
    : state.globalPanel;

  const setSidePanelOpen = useCallback(
    (open: boolean) => {
      setState((prev) => {
        if (prev.activeId) {
          return {
            ...prev,
            panelStates: { ...prev.panelStates, [prev.activeId]: open },
          };
        }

        return { ...prev, globalPanel: open };
      });
    },
    [],
  );

  // Batch operations
  const batch = useCallback(
    (fn: (tabs: Tab[]) => Tab[]) => {
      setState((prev) => {
        const tabObjects = prev.tabs.map((id) => {
          const meta = prev.metadata[id];
          return {
            id,
            title: meta?.title || `Tab ${id}`,
            embedKind: meta?.embedKind || "article",
            embedUrl: meta?.embedUrl || "about:blank",
            clusterId: meta?.clusterId,
            shareId: id.startsWith("share:") ? id.replace("share:", "") : undefined,
            preview: meta?.preview || false,
            pinned: meta?.pinned || false,
            overlays: DEFAULT_OVERLAYS,
            context: {},
          } satisfies Tab;
        });

        const nextTabs = fn(tabObjects);
        const nextIds = nextTabs.map((tab) => tab.id);
        const nextMetadata: Record<string, TabMetadata> = {};

        for (const tab of nextTabs) {
          nextMetadata[tab.id] = {
            title: tab.title,
            clusterId: tab.clusterId,
            embedKind: tab.embedKind,
            embedUrl: tab.embedUrl,
            preview: tab.preview,
            pinned: tab.pinned,
          };
        }

        return {
          ...prev,
          tabs: nextIds,
          metadata: nextMetadata,
        };
      });
    },
    [],
  );

  // Update overlay/context currently no-op placeholders
  const updateOverlay = useCallback(
    (id: string, partial: Partial<StoryOverlaySummary>) => {
      console.debug("updateOverlay", id, partial);
    },
    [],
  );

  const updateContext = useCallback((id: string, partial: Record<string, unknown>) => {
    console.debug("updateContext", id, partial);
  }, []);

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
      } catch (error) {
        console.error("Unable to open story", error);
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
    closeOthers: (id: string) => {
      const tab = tabs.find((t) => t.id === id);
      if (tab) batch(() => [tab]);
    },
    closeToRight: (id: string) => {
      const index = tabs.findIndex((t) => t.id === id);
      if (index >= 0) batch((current) => current.slice(0, index + 1));
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
