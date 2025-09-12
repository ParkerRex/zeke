"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { IoMenu } from "react-icons/io5";
import TodayFeedClient from "@/components/feed/today-feed-client";
import HomeSnapshot from "@/components/home/home-snapshot";
import TabsContentViewport from "@/components/tabs/tabs-content-viewport";
import TabsStrip from "@/components/tabs/tabs-strip";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import { panelParser } from "@/lib/nuqs";
import { useTabs } from "@/stores/tabsStore";

const MAX_TABS_IN_SESSION = 8;
const LEGACY_PANEL_ENABLED = "1";
const LEGACY_PANEL_DISABLED = "0";

function getGridColumnClass(
  isHome: boolean,
  showSidebarPanel: boolean
): string {
  const baseClass = "grid";

  if (isHome) {
    return `${baseClass} grid-cols-1`;
  }

  if (showSidebarPanel) {
    return `${baseClass} grid-cols-[320px_1fr] lg:grid-cols-[380px_1fr]`;
  }

  return `${baseClass} grid-cols-1`;
}

function getSidebarContent(
  isHome: boolean,
  showSidebarPanel: boolean,
  children: ReactNode
): ReactNode {
  if (isHome) {
    return <TodayFeedClient />;
  }

  if (showSidebarPanel) {
    return children;
  }

  return null;
}

function getMainContent(
  isHome: boolean,
  usesViewer: boolean,
  children: ReactNode
): ReactNode {
  if (isHome) {
    return <HomeSnapshot />;
  }

  if (usesViewer) {
    return <TabsContentViewport />;
  }

  return children;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { sidePanelOpen, setSidePanelOpen, resetPanelState } = useTabs();
  const searchParams = useSearchParams();
  const [panel, setPanel] = useQueryState("panel", panelParser);
  const isHome = pathname === "/home";

  const usesViewer = useMemo(() => {
    return (
      pathname === "/today" ||
      (pathname?.startsWith("/stories") ?? false) ||
      (pathname?.startsWith("/sector") ?? false) ||
      pathname === "/company" ||
      pathname === "/watchlists"
    );
  }, [pathname]);

  const showSidebarPanel = useMemo(() => {
    return (
      !(isHome || (pathname?.startsWith("/stories") ?? false)) && usesViewer
    );
  }, [isHome, pathname, usesViewer]);

  useEffect(() => {
    const hasParam = searchParams?.has("panel");
    if (hasParam) {
      setSidePanelOpen(!!panel);
    }
  }, [panel, searchParams, setSidePanelOpen]);

  useEffect(() => {
    const raw = searchParams?.get("panel");
    if (raw === LEGACY_PANEL_ENABLED || raw === LEGACY_PANEL_DISABLED) {
      setPanel(raw === LEGACY_PANEL_ENABLED).catch(() => {
        // Ignore errors from setting panel state
      });
    }
  }, [searchParams, setPanel]);

  return (
    <TooltipProvider delayDuration={400}>
      <div className={"grid h-screen grid-rows-[auto_1fr]"}>
        {/* Global top bar with tabs strip */}
        <header className="flex h-11 items-center gap-2 border-b bg-[#EBEBEF] px-2">
          {showSidebarPanel && (
            <Sheet>
              <SheetTrigger asChild>
                <Button className="sm:hidden" size="sm" variant="ghost">
                  <IoMenu className="mr-2 h-5 w-5" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full bg-white sm:max-w-md" side="left">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4 overflow-auto">
                  {getSidebarContent(isHome, showSidebarPanel, children)}
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Back button removed per design */}

          {/* Tabs strip */}
          <div className="ml-1 flex min-w-0 flex-1 overflow-hidden">
            <TabsStrip />
          </div>

          {usesViewer && (
            <Button
              className="ml-1 hidden sm:inline-flex"
              onClick={() => {
                setSidePanelOpen(!sidePanelOpen);
                setPanel(!sidePanelOpen).catch(() => {
                  // Ignore errors from setting panel state
                });
              }}
              size="sm"
              title={sidePanelOpen ? "Hide side panel" : "Show side panel"}
              variant="ghost"
            >
              {sidePanelOpen ? "Hide panel" : "Show panel"}
            </Button>
          )}

          {/* Reset panel state (dev/UX utility) */}
          {usesViewer && (
            <Button
              className="ml-1 hidden text-gray-600 text-xs hover:text-gray-900 sm:inline-flex"
              onClick={() => resetPanelState()}
              size="sm"
              title="Reset side panel visibility (clears per-tab panel state)"
              variant="ghost"
            >
              Reset panels
            </Button>
          )}

          {usesViewer && (
            <Button
              className="ml-1 hidden text-gray-600 text-xs hover:text-gray-900 sm:inline-flex"
              onClick={() => {
                try {
                  const u = new URL(window.location.href);
                  const state = useTabs.getState();
                  const ids = state.tabs
                    .map((t) => t.clusterId)
                    .filter((x): x is string => !!x);
                  const unique = Array.from(new Set(ids)).slice(
                    0,
                    MAX_TABS_IN_SESSION
                  );
                  if (unique.length) {
                    u.searchParams.set("tabs", unique.join(","));
                  } else {
                    u.searchParams.delete("tabs");
                  }
                  const active =
                    state.activeId &&
                    state.tabs.find((t) => t.id === state.activeId)?.clusterId;
                  if (active) {
                    u.searchParams.set("active", active);
                  } else {
                    u.searchParams.delete("active");
                  }
                  u.searchParams.set(
                    "panel",
                    (state.sidePanelOpen ?? true) ? "true" : "false"
                  );
                  navigator.clipboard.writeText(u.toString());
                  toast({
                    title: "Session link copied",
                    description: "Share this URL to load the same tabs.",
                  });
                } catch (error: unknown) {
                  const message =
                    error instanceof Error ? error.message : String(error);
                  toast({
                    title: "Unable to copy link",
                    description: message,
                  });
                }
              }}
              size="sm"
              title="Copy session link (open tabs + active + panel)"
              variant="ghost"
            >
              Share session
            </Button>
          )}
        </header>

        <div className={getGridColumnClass(isHome, showSidebarPanel)}>
          {showSidebarPanel && (
            <section className="hidden overflow-auto border-r bg-gray-50 sm:block">
              {children}
            </section>
          )}
          <main className="h-full min-w-0">
            {getMainContent(isHome, usesViewer, children)}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
