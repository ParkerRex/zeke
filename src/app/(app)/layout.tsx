"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { IoChevronBack, IoChevronForward, IoMenu } from "react-icons/io5";
import TodayFeedClient from "@/components/feed/TodayFeedClient";
import HomeSnapshot from "@/components/home/HomeSnapshot";
import Sidebar from "@/components/shell/Sidebar";
import TabsContentViewport from "@/components/tabs/TabsContentViewport";
import TabsStrip from "@/components/tabs/TabsStrip";
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

export default function AppLayout({ children }: { children: ReactNode }) {
  // 3-pane layout: Rail | Sidebar Panel (route content) | Main viewer (tabs)
  const pathname = usePathname();
  const router = useRouter();
  const { sidePanelOpen, setSidePanelOpen, resetPanelState } = useTabs();
  const searchParams = useSearchParams();
  const [panel, setPanel] = useQueryState("panel", panelParser);
  const isHome = pathname === "/home";
  const usesViewer =
    pathname === "/today" ||
    (pathname?.startsWith("/stories") ?? false) ||
    (pathname?.startsWith("/sector") ?? false) ||
    pathname === "/company" ||
    pathname === "/watchlists";
  // Show the sidebar panel for all viewer routes except stories (stories is a full-page experience)
  const showSidebarPanel =
    !(isHome || (pathname?.startsWith("/stories") ?? false)) && usesViewer;

  // Initialize store from URL only when panel param is present; otherwise keep persisted fallback
  useEffect(() => {
    const hasParam = searchParams?.has("panel");
    if (hasParam) setSidePanelOpen(!!panel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel]);

  // Back-compat for legacy panel=1/0 values: normalize to true/false via nuqs
  useEffect(() => {
    const raw = searchParams?.get("panel");
    if (raw === "1" || raw === "0") {
      void setPanel(raw === "1");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TooltipProvider delayDuration={400}>
      <div className="grid h-screen grid-cols-[64px_1fr] grid-rows-[auto_1fr]">
        {/* Rail spans both rows */}
        <aside className="row-span-2 border-r bg-white">
          <Sidebar />
        </aside>

        {/* Global top bar with tabs strip */}
        <header className="col-start-2 flex items-center gap-2 border-b p-2">
          {/* Mobile: open sidebar panel in a sheet */}
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
                {/* Render the sidebar panel content inside the sheet on mobile */}
                <div className="mt-4 overflow-auto">
                  {isHome ? (
                    <TodayFeedClient />
                  ) : showSidebarPanel ? (
                    children
                  ) : null}
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Back button (IDE-style) */}
          {usesViewer && (
            <button
              aria-label="Back"
              className="hidden items-center gap-2 rounded-md border border-transparent px-2 py-1 text-gray-700 text-sm transition-colors hover:border-gray-200 hover:bg-white sm:inline-flex"
              onClick={() => {
                if (typeof window !== "undefined") {
                  // Guard router.back with same-origin referrer; otherwise go to /stories
                  const ref = document.referrer;
                  let sameOrigin = false;
                  try {
                    const refUrl = ref ? new URL(ref) : null;
                    sameOrigin = !!(
                      refUrl && refUrl.origin === window.location.origin
                    );
                  } catch {}
                  if (window.history.length > 1 && sameOrigin) router.back();
                  else router.push("/stories");
                }
              }}
              type="button"
            >
              ← Back
            </button>
          )}

          {/* Tabs strip */}
          <div className="ml-1 flex min-w-0 flex-1 overflow-hidden">
            <TabsStrip />
          </div>

          {/* Panel toggle */}
          {usesViewer && (
            <Button
              className="ml-1 hidden sm:inline-flex"
              onClick={() => {
                setSidePanelOpen(!sidePanelOpen);
                void setPanel(!sidePanelOpen);
              }}
              size="sm"
              title={sidePanelOpen ? "Hide side panel" : "Show side panel"}
              variant="ghost"
            >
              {sidePanelOpen ? (
                <IoChevronForward className="h-5 w-5" />
              ) : (
                <IoChevronBack className="h-5 w-5" />
              )}
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

          {/* Copy session link (tabs + active + panel) */}
          {usesViewer && (
            <Button
              className="ml-1 hidden text-gray-600 text-xs hover:text-gray-900 sm:inline-flex"
              onClick={() => {
                try {
                  const u = new URL(window.location.href);
                  // Build tabs list from store (only story tabs)
                  const state = useTabs.getState();
                  const ids = state.tabs
                    .map((t) => t.clusterId)
                    .filter((x): x is string => !!x);
                  const unique = Array.from(new Set(ids)).slice(0, 8);
                  if (unique.length)
                    u.searchParams.set("tabs", unique.join(","));
                  else u.searchParams.delete("tabs");
                  const active =
                    state.activeId &&
                    state.tabs.find((t) => t.id === state.activeId)?.clusterId;
                  if (active) u.searchParams.set("active", active);
                  else u.searchParams.delete("active");
                  u.searchParams.set(
                    "panel",
                    (state.sidePanelOpen ?? true) ? "true" : "false"
                  );
                  navigator.clipboard.writeText(u.toString());
                  toast({
                    title: "Session link copied",
                    description: "Share this URL to load the same tabs.",
                  });
                } catch (e: any) {
                  toast({
                    title: "Unable to copy link",
                    description: String(e?.message || e),
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

        {/* Row 2: two columns – sidebar panel + content */}
        <div
          className={
            "col-start-2 grid" +
            (isHome
              ? "grid-cols-1"
              : showSidebarPanel
                ? "grid-cols-[320px_1fr] lg:grid-cols-[380px_1fr]"
                : "grid-cols-1")
          }
        >
          {showSidebarPanel && (
            <section className="hidden overflow-auto border-r bg-gray-50 sm:block">
              {children}
            </section>
          )}
          <main className="h-full min-w-0">
            {isHome ? (
              <HomeSnapshot />
            ) : usesViewer ? (
              <TabsContentViewport />
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
