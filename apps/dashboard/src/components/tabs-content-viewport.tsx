"use client";
import { useTabs } from "@/src/hooks/use-tabs";
import { STRINGS } from "@/src/utils/constants";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import StoriesGridClient from "./stories-grid-client";
import StoryTab from "./story-tab";

const STORIES_PATH_RE = /^\/stories\/(.+)$/;

export default function TabsContentViewport() {
  const { tabs, activeId, active, setActive, restoreFromUrl } = useTabs();
  const pathname = usePathname();
  const router = useRouter();
  // If the URL is /stories/[id], ensure the matching tab is active once loaded
  useEffect(() => {
    const m = pathname?.match(STORIES_PATH_RE);
    if (!m) {
      return;
    }
    const id = decodeURIComponent(m[1]);
    if (id && activeId !== id) {
      const exists = tabs.find((t) => t.id === id);
      if (exists) {
        setActive(id);
      } else {
        // Restore tab from URL if it doesn't exist
        restoreFromUrl(id, false);
      }
    }
  }, [pathname, tabs, activeId, setActive, restoreFromUrl]);

  // Keep URL in sync with active tab (stories)
  useEffect(() => {
    if (!active) {
      return;
    }
    if (active.clusterId) {
      const target = `/stories/${encodeURIComponent(active.clusterId)}`;
      if (pathname !== target) {
        router.replace(target);
      }
    }
  }, [active, pathname, router]);

  // Note: URL hydration is now handled automatically by nuqs
  // The tabs and activeId state are automatically synced with URL parameters
  let content: React.ReactNode;
  if (active) {
    content = (
      <div
        aria-labelledby={`tab-${active.id}`}
        className="h-full"
        id={`tabpanel-${active.id}`}
        role="tabpanel"
      >
        <StoryTab tab={active} />
      </div>
    );
  } else if (pathname === "/stories") {
    content = <StoriesGridClient variant="full" />;
  } else {
    content = (
      <div className="p-6 text-muted-foreground">{STRINGS.openAStory}</div>
    );
  }

  return content;
}
