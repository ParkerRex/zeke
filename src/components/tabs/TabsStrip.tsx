"use client";
import { Pin, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
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
import { useTabs } from "@/lib/tabsStore";
import { domainFromUrl } from "@/utils/url";

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
  const pathname = usePathname();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const [isHot, setIsHot] = useState(false);
  const ytThumb = (url: string) => {
    try {
      // Support /embed/ID, watch?v=ID, youtu.be/ID
      let id: string | undefined;
      const embed = url.match(/\/embed\/([a-zA-Z0-9_-]{6,})/);
      if (embed) id = embed[1];
      if (!id) {
        const u = new URL(url);
        if (u.hostname.includes("youtu.be"))
          id = u.pathname.split("/").filter(Boolean)[0];
        if (!id && u.searchParams.get("v"))
          id = String(u.searchParams.get("v"));
      }
      return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined;
    } catch {
      return;
    }
  };
  const domain = domainFromUrl;

  function TooltipThumb({ src }: { src?: string }) {
    const [loaded, setLoaded] = useState(false);
    if (!src) return null;
    return (
      <div className="relative h-[150px] w-full">
        {loaded ? null : (
          <div className="h-full w-full animate-pulse rounded-md bg-gray-100" />
        )}
        <img
          alt=""
          className={`h-full w-full rounded-md object-cover ${loaded ? "opacity-100" : "opacity-0"}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          src={src}
        />
      </div>
    );
  }

  // Keyboard shortcuts: Cmd/Ctrl+1..9 to switch, Cmd/Ctrl+W to close
  useEffect(() => {
    const isEditable = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        el.isContentEditable ||
        el.closest('input,textarea,[contenteditable="true"]') !== null
      );
    };
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (isEditable(e.target)) return;
      // Scope handling to the tabstrip region: only when hovered or when event target is within tablist
      const el = scrollerRef.current;
      const targetNode = (e.target as Node) ?? null;
      const insideTabstrip = !!(el && targetNode && el.contains(targetNode));
      if (!(isHot || insideTabstrip)) return;
      // Do not hijack shortcuts when an iframe (viewer) has focus
      const active = document.activeElement?.tagName.toLowerCase();
      if (active === "iframe") return;
      // Close active tab
      if (e.key.toLowerCase() === "w") {
        if (activeId) {
          e.preventDefault();
          closeTab(activeId);
        }
        return;
      }
      // Switch 1..9
      const idx = Number(e.key);
      if (!Number.isNaN(idx) && idx >= 1 && idx <= 9) {
        const target = tabs[idx - 1];
        if (target) {
          e.preventDefault();
          setActive(target.id);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId, tabs, setActive, closeTab, isHot]);

  // Show/hide edge fades only when overflowed and based on scroll position
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      const ov = el.scrollWidth > el.clientWidth + 2;
      if (!ov) {
        setShowLeft(false);
        setShowRight(false);
        return;
      }
      setShowLeft(el.scrollLeft > 2);
      setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
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
                          onClick={() => {
                            // Single click only activates; keep preview until double-click
                            setActive(t.id);
                            if (t.clusterId)
                              router.push(
                                `/stories/${encodeURIComponent(t.clusterId)}`
                              );
                          }}
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            if (t.preview) promoteTab(t.id);
                            if (t.clusterId)
                              router.push(
                                `/stories/${encodeURIComponent(t.clusterId)}`
                              );
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setActive(t.id);
                              return;
                            }
                            if (
                              (e.key === "p" || e.key === "P") &&
                              e.shiftKey
                            ) {
                              e.preventDefault();
                              pinTab(t.id, !t.pinned);
                              return;
                            }
                            if (e.key === "ArrowRight") {
                              e.preventDefault();
                              const next = tabs[idx + 1] ?? tabs[0];
                              if (next) setActive(next.id);
                              return;
                            }
                            if (e.key === "ArrowLeft") {
                              e.preventDefault();
                              const prev =
                                tabs[idx - 1] ?? tabs[tabs.length - 1];
                              if (prev) setActive(prev.id);
                              return;
                            }
                            if (e.key === "Home") {
                              e.preventDefault();
                              if (tabs[0]) setActive(tabs[0].id);
                              return;
                            }
                            if (e.key === "End") {
                              e.preventDefault();
                              if (tabs[tabs.length - 1])
                                setActive(tabs[tabs.length - 1].id);
                              return;
                            }
                          }}
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
                          {typeof t.overlays.chili === "number" ? (
                            <div aria-label="chili" className="text-xs">
                              {Array.from({
                                length: Math.max(
                                  0,
                                  Math.min(5, t.overlays.chili)
                                ),
                              }).map((_, i) => (
                                <span key={i}>🌶</span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        {t.embedKind === "youtube" ? (
                          <TooltipThumb src={ytThumb(t.embedUrl)} />
                        ) : null}
                        <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                          <span>
                            {t.preview
                              ? "Preview"
                              : t.pinned
                                ? "Pinned"
                                : "Open"}
                          </span>
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
                    {(() => {
                      const current = tabs;
                      const idx = current.findIndex((x) => x.id === t.id);
                      const toRight =
                        idx === -1
                          ? 0
                          : current.slice(idx + 1).filter((x) => !x.pinned)
                              .length;
                      const others = current.filter(
                        (x) => x.id !== t.id && !x.pinned
                      ).length;
                      const doCloseRight = () => {
                        if (t.pinned || toRight === 0) return;
                        // Soft guard when the action would close many tabs
                        const MANY_THRESHOLD = 5;
                        if (toRight >= MANY_THRESHOLD) {
                          const ok = window.confirm(
                            `Close ${toRight} tab${toRight > 1 ? "s" : ""} to the right?`
                          );
                          if (!ok) return;
                        }
                        const toRestore = current
                          .slice(idx + 1)
                          .filter((x) => !x.pinned);
                        closeToRight(t.id);
                        if (toRestore.length) {
                          toast({
                            title: `Closed ${toRestore.length} tab${toRestore.length > 1 ? "s" : ""}`,
                            action: (
                              <ToastAction
                                altText="Undo"
                                onClick={() =>
                                  batch((cur) => [...cur, ...toRestore])
                                }
                              >
                                Undo
                              </ToastAction>
                            ),
                          });
                        }
                      };
                      const doCloseOthers = () => {
                        if (others === 0) return;
                        const toRestore = current.filter(
                          (x) => x.id !== t.id && !x.pinned
                        );
                        closeOthers(t.id);
                        if (toRestore.length) {
                          toast({
                            title: `Closed ${toRestore.length} tab${toRestore.length > 1 ? "s" : ""}`,
                            action: (
                              <ToastAction
                                altText="Undo"
                                onClick={() =>
                                  batch((cur) => [...cur, ...toRestore])
                                }
                              >
                                Undo
                              </ToastAction>
                            ),
                          });
                        }
                      };
                      return (
  // Focus the active tab when activeId changes (roving tabIndex pattern)
  useEffect(() => {
    if (!activeId) return;
    const el = document.getElementById(`tab-${activeId}`) as HTMLElement | null;
    if (el) {
      // Defer to allow DOM to update after state changes (e.g., closing)
      requestAnimationFrame(() => el.focus());
    }
  }, [activeId]);
                      <>
                        <ContextMenuItem onSelect={() => closeTab(t.id)}>
                          Close
                        </ContextMenuItem>
                        <ContextMenuItem
                          disabled={t.pinned || toRight === 0}
                          onSelect={doCloseRight}
                        >
                          Close to the right{toRight ? ` (${toRight})` : ""}
                        </ContextMenuItem>
                        <ContextMenuItem
                          disabled={others === 0}
                          onSelect={doCloseOthers}
                        >
                          Close others{others ? ` (${others})` : ""}
                        </ContextMenuItem>
                      </>;
                      )
                    })()}
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
