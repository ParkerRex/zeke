"use client";
import { Pin, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import { useEffect, useRef, useState } from "react";
import { StoryKindIcon } from "@/components/stories/StoryKindIcon";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ToastAction } from "@/components/ui/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import { EDGE_FADE_THRESHOLD_PX, MAX_CHILI_ICONS } from "@/constants/tabs";
import { useTabs } from "@/lib/tabsStore";
import { domainFromUrl } from "@/utils/url";

const YT_EMBED_RE = /\/embed\/([a-zA-Z0-9_-]{6,})/;

// Keyboard shortcut bounds for digit-based tab switching
const DIGIT_SHORTCUT_MIN = 1;
const DIGIT_SHORTCUT_MAX = 9;
// Soft guard threshold when closing many tabs via context menu
const MANY_CLOSE_THRESHOLD = 5;

type TabId = { id: string };
type TabBasic = TabId & { pinned?: boolean };
type TabFull = TabBasic & {
  title: string;
  embedKind: string;
  embedUrl: string;
  overlays: { chili?: number };
  clusterId?: string;
  preview?: boolean;
};

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) {
    return false;
  }
  const tag = el.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    el.isContentEditable ||
    el.closest('input,textarea,[contenteditable="true"]') !== null
  );
}

function isInsideElement(
  container: HTMLElement | null,
  target: Node | null
): boolean {
  return !!(container && target && container.contains(target));
}

function isViewerFocused(): boolean {
  const active = document.activeElement?.tagName.toLowerCase();
  return active === "iframe";
}

function handleCloseCurrentTab(
  e: KeyboardEvent,
  activeId: string | undefined,
  closeTab: (id: string) => void
): boolean {
  if (e.key.toLowerCase() !== "w") {
    return false;
  }
  if (activeId) {
    e.preventDefault();
    closeTab(activeId);
  }
  return true;
}

function handleDigitTabShortcut<T extends TabId>(
  e: KeyboardEvent,
  tabs: T[],
  setActive: (id: string) => void
): boolean {
  const idx = Number(e.key);
  if (
    !Number.isNaN(idx) &&
    idx >= DIGIT_SHORTCUT_MIN &&
    idx <= DIGIT_SHORTCUT_MAX
  ) {
    const target = tabs[idx - 1];
    if (target) {
      e.preventDefault();
      setActive(target.id);
      return true;
    }
  }
  return false;
}

function handleTabKeyDown<T extends TabBasic>(
  e: ReactKeyboardEvent,
  ctx: {
    idx: number;
    tabs: T[];
    tab: T;
    setActive: (id: string) => void;
    pinTab: (id: string, pinned: boolean) => void;
  }
): void {
  const { idx, tabs, tab: t, setActive, pinTab } = ctx;
  switch (e.key) {
    case "Enter":
    case " ":
      e.preventDefault();
      setActive(t.id);
      return;
    case "p":
    case "P":
      if (e.shiftKey) {
        e.preventDefault();
        pinTab(t.id, !t.pinned);
      }
      return;
    case "ArrowRight": {
      e.preventDefault();
      const next = tabs[idx + 1] ?? tabs.at(0);
      if (next) {
        setActive(next.id);
      }
      return;
    }
    case "ArrowLeft": {
      e.preventDefault();
      const prev = tabs[idx - 1] ?? tabs.at(-1);
      if (prev) {
        setActive(prev.id);
      }
      return;
    }
    case "Home": {
      e.preventDefault();
      const first = tabs.at(0);
      if (first) {
        setActive(first.id);
      }
      return;
    }
    case "End": {
      e.preventDefault();
      const last = tabs.at(-1);
      if (last) {
        setActive(last.id);
      }
      return;
    }
    default:
      return;
  }
}

function getStatusLabel(t: { preview?: boolean; pinned?: boolean }): string {
  if (t.preview) {
    return "Preview";
  }
  if (t.pinned) {
    return "Pinned";
  }
  return "Open";
}

function CloseMenuItems<T extends TabFull>(props: {
  t: T;
  tabs: T[];
  closeTab: (id: string) => void;
  closeToRight: (id: string) => void;
  closeOthers: (id: string) => void;
  batch: (updater: (cur: T[]) => T[]) => void;
}) {
  const { t, tabs, closeTab, closeToRight, closeOthers, batch } = props;
  const current = tabs;
  const selfIndex = current.findIndex((x) => x.id === t.id);
  const toRight =
    selfIndex === -1
      ? 0
      : current.slice(selfIndex + 1).filter((x) => !x.pinned).length;
  const others = current.filter((x) => x.id !== t.id && !x.pinned).length;

  const doCloseRight = () => {
    if (t.pinned || toRight === 0) {
      return;
    }
    if (!confirmCloseMany(toRight)) {
      return;
    }
    const toRestore = current.slice(selfIndex + 1).filter((x) => !x.pinned);
    closeToRight(t.id);
    showUndoToast(toRestore.length, () =>
      batch((cur) => [...cur, ...toRestore])
    );
  };

  const doCloseOthers = () => {
    if (others === 0) {
      return;
    }
    const toRestore = current.filter((x) => x.id !== t.id && !x.pinned);
    closeOthers(t.id);
    showUndoToast(toRestore.length, () =>
      batch((cur) => [...cur, ...toRestore])
    );
  };

  return (
    <>
      <ContextMenuItem onSelect={() => closeTab(t.id)}>Close</ContextMenuItem>
      <ContextMenuItem
        disabled={t.pinned || toRight === 0}
        onSelect={doCloseRight}
      >
        {`Close to the right${toRight ? ` (${toRight})` : ""}`}
      </ContextMenuItem>
      <ContextMenuItem disabled={others === 0} onSelect={doCloseOthers}>
        {`Close others${others ? ` (${others})` : ""}`}
      </ContextMenuItem>
    </>
  );
}

function confirmCloseMany(count: number): boolean {
  if (count < MANY_CLOSE_THRESHOLD) {
    return true;
  }
  const ok = window.confirm(
    `Close ${count} tab${count > 1 ? "s" : ""} to the right?`
  );
  return ok;
}

function showUndoToast(count: number, onUndo: () => void) {
  if (count <= 0) {
    return;
  }
  toast({
    title: `Closed ${count} tab${count > 1 ? "s" : ""}`,
    action: (
      <ToastAction altText="Undo" onClick={onUndo}>
        Undo
      </ToastAction>
    ),
  });
}

function TooltipThumb({ src }: { src?: string }) {
  const [loaded, setLoaded] = useState(false);
  if (!src) {
    return null;
  }
  return (
    <div className="relative h-[150px] w-full">
      {loaded ? null : (
        <div className="h-full w-full animate-pulse rounded-md bg-gray-100" />
      )}
      <Image
        alt=""
        className={`h-full w-full rounded-md object-cover ${loaded ? "opacity-100" : "opacity-0"}`}
        height={150}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        src={src}
        width={360}
      />
    </div>
  );
}

function ChiliBadge({ value }: { value?: number }) {
  if (typeof value !== "number") {
    return null;
  }
  const count = Math.max(0, Math.min(MAX_CHILI_ICONS, value));
  return (
    <div aria-hidden="true" className="text-xs">
      {"🌶".repeat(count)}
    </div>
  );
}

function MaybeYouTubeThumb({
  kind,
  url,
  ytThumb,
}: {
  kind: string;
  url: string;
  ytThumb: (u: string) => string | undefined;
}) {
  if (kind !== "youtube") {
    return null;
  }
  return <TooltipThumb src={ytThumb(url)} />;
}

export default function TabsStrip() {
  const {
    tabs,
    activeId,
    setActive,
    closeTab,
    promoteTab,
    pinTab,
    closeOthers,
    closeToRight,
    batch,
  } = useTabs();
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const [isHot, setIsHot] = useState(false);
  const ytThumb = (url: string) => {
    try {
      // Support /embed/ID, watch?v=ID, youtu.be/ID
      let id: string | undefined;
      const embed = url.match(YT_EMBED_RE);
      if (embed) {
        id = embed[1];
      }
      if (!id) {
        const u = new URL(url);
        if (u.hostname.includes("youtu.be")) {
          id = u.pathname.split("/").filter(Boolean)[0];
        }
        if (!id && u.searchParams.get("v")) {
          id = String(u.searchParams.get("v"));
        }
      }
      return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined;
    } catch {
      return;
    }
  };
  const domain = domainFromUrl;

  // Navigation helpers to reduce inline branching in render
  const pushCluster = (clusterId?: string) => {
    if (!clusterId) {
      return;
    }
    router.push(`/stories/${encodeURIComponent(clusterId)}`);
  };

  const onTabClick = (tab: TabFull) => {
    setActive(tab.id);
    pushCluster(tab.clusterId);
  };

  const onTabDoubleClick = (tab: TabFull, e: ReactMouseEvent) => {
    e.preventDefault();
    if (tab.preview) {
      promoteTab(tab.id);
    }
    pushCluster(tab.clusterId);
  };

  // Keyboard shortcuts: Cmd/Ctrl+1..9 to switch, Cmd/Ctrl+W to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      const targetNode = (e.target as Node) ?? null;
      const insideTabstrip = isInsideElement(scrollerRef.current, targetNode);
      const shouldIgnore =
        !meta ||
        isEditableTarget(e.target) ||
        !(isHot || insideTabstrip) ||
        isViewerFocused();
      if (shouldIgnore) {
        return;
      }

      if (handleCloseCurrentTab(e, activeId, closeTab)) {
        return;
      }
      handleDigitTabShortcut(e, tabs, setActive);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId, tabs, setActive, closeTab, isHot]);

  // Focus the active tab when activeId changes (roving tabIndex pattern)
  useEffect(() => {
    if (!activeId) {
      return;
    }
    const el = document.getElementById(`tab-${activeId}`) as HTMLElement | null;
    if (el) {
      // Defer to allow DOM to update after state changes (e.g., closing)
      requestAnimationFrame(() => el.focus());
    }
  }, [activeId]);

  // Show/hide edge fades only when overflowed and based on scroll position
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    const update = () => {
      const ov = el.scrollWidth > el.clientWidth + EDGE_FADE_THRESHOLD_PX;
      if (!ov) {
        setShowLeft(false);
        setShowRight(false);
        return;
      }
      setShowLeft(el.scrollLeft > EDGE_FADE_THRESHOLD_PX);
      setShowRight(
        el.scrollLeft < el.scrollWidth - el.clientWidth - EDGE_FADE_THRESHOLD_PX
      );
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="flex min-w-0 items-center gap-2 overflow-hidden">
      <div className="relative ml-0 flex min-w-0 flex-1 overflow-hidden">
        {/* Scroll fade gradients */}
        <div
          className={`pointer-events-none absolute top-0 left-0 h-full w-4 bg-gradient-to-r from-white to-transparent transition-opacity ${
            showLeft ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`pointer-events-none absolute top-0 right-0 h-full w-4 bg-gradient-to-l from-white to-transparent transition-opacity ${
            showRight ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          aria-label="Open stories"
          className="no-scrollbar -mx-1 flex max-w-full flex-1 select-none items-center overflow-x-auto px-1"
          onBlur={() => setIsHot(false)}
          onFocus={() => setIsHot(true)}
          onMouseEnter={() => setIsHot(true)}
          onMouseLeave={() => setIsHot(false)}
          ref={scrollerRef}
          role="tablist"
        >
          <TooltipProvider delayDuration={150} disableHoverableContent>
            {tabs.map((t, idx) => (
              <div className="flex items-center" key={t.id}>
                <ContextMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ContextMenuTrigger asChild>
                        <div
                          aria-controls={`tabpanel-${t.id}`}
                          aria-selected={activeId === t.id}
                          className={`group mr-1 flex min-w-[104px] max-w-[260px] flex-1 basis-[200px] select-none items-center gap-2 rounded-[10px] border px-2.5 py-1 text-sm transition-all ${
                            activeId === t.id
                              ? "border-gray-200 bg-white text-gray-900 shadow-sm"
                              : "border-transparent bg-gray-100 text-gray-700 hover:border-gray-300 hover:bg-white hover:shadow-sm"
                          } ${t.preview ? "italic" : ""}`}
                          id={`tab-${t.id}`}
                          onClick={() => onTabClick(t as TabFull)}
                          onDoubleClick={(e) =>
                            onTabDoubleClick(t as TabFull, e)
                          }
                          onKeyDown={(e) =>
                            handleTabKeyDown(e, {
                              idx,
                              tabs,
                              tab: t,
                              setActive,
                              pinTab,
                            })
                          }
                          role="tab"
                          tabIndex={activeId === t.id ? 0 : -1}
                          title={t.title}
                        >
                          <StoryKindIcon kind={t.embedKind} />
                          <span className="truncate">{t.title}</span>
                          {t.pinned ? (
                            <Pin className="h-3.5 w-3.5 opacity-70" />
                          ) : null}
                          <button
                            aria-label={`Close ${t.title}`}
                            className={`ml-1 inline-flex h-6 w-6 items-center justify-center rounded transition-opacity hover:bg-gray-100 ${
                              activeId === t.id
                                ? "opacity-100"
                                : "opacity-0 focus-within:opacity-100 group-hover:opacity-100"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              closeTab(t.id);
                            }}
                            type="button"
                          >
                            <X className="h-4 w-4 opacity-80 transition-opacity hover:opacity-100" />
                          </button>
                        </div>
                      </ContextMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent
                      className="w-[360px] border bg-popover p-0 text-popover-foreground shadow-md"
                      side="bottom"
                    >
                      <div className="p-2">
                        <div className="mb-2 flex items-center gap-2">
                          <StoryKindIcon kind={t.embedKind} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium text-sm">
                              {t.title}
                            </div>
                            <div className="truncate text-[11px] text-gray-500">
                              {domain(t.embedUrl)}
                            </div>
                          </div>
                          <ChiliBadge value={t.overlays.chili} />
                        </div>
                        <MaybeYouTubeThumb
                          kind={t.embedKind}
                          url={t.embedUrl}
                          ytThumb={ytThumb}
                        />
                        <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                          <span>{getStatusLabel(t)}</span>
                          <span>
                            Double‑click to keep open · Right‑click or Shift+P
                            to Pin
                          </span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>

                  <ContextMenuContent className="min-w-[220px]">
                    {/* Counts for inline clarity (no extra confirmation) */}
                    <CloseMenuItems
                      batch={
                        batch as unknown as (
                          updater: (cur: TabFull[]) => TabFull[]
                        ) => void
                      }
                      closeOthers={closeOthers}
                      closeTab={closeTab}
                      closeToRight={closeToRight}
                      t={t as TabFull}
                      tabs={tabs as TabFull[]}
                    />
                    <ContextMenuSeparator />
                    <ContextMenuItem onSelect={() => pinTab(t.id, !t.pinned)}>
                      {t.pinned ? "Unpin" : "Pin"}
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              </div>
            ))}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
