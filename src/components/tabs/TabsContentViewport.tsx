"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import StoriesGridClient from "@/components/stories/StoriesGridClient";
import { STRINGS } from "@/constants/strings";
import { useTabs } from "@/stores/tabsStore";
import StoryTab from "./StoryTab";

const STORIES_PATH_RE = /^\/stories\/(.+)$/;
const MAX_TABS_FROM_URL = 8;

export default function TabsContentViewport() {
  const { tabs, activeId, setActive } = useTabs();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = tabs.find((t) => t.id === activeId);
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
      }
    }
  }, [pathname, tabs, activeId, setActive]);

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

  // One-time hydration from URL: open tabs from ?tabs=id1,id2,.. and set active from ?active=id
  const tabsParam = useMemo(
    () => searchParams?.get("tabs") ?? "",
    [searchParams]
  );
  const activeParam = useMemo(
    () => searchParams?.get("active") ?? "",
    [searchParams]
  );
  const hydratedOnceRef = useRef(false);
  useEffect(() => {
    if (hydratedOnceRef.current) {
      return;
    }
    const param = tabsParam;
    if (!param) {
      return;
    }
    const ids = Array.from(
      new Set(
        param
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      )
    ).slice(0, MAX_TABS_FROM_URL);
    if (!ids.length) {
      return;
    }
    // Open sequentially to avoid thundering herd
    (async () => {
      for (const id of ids) {
        try {
          await useTabs.getState().restoreFromUrl(id, false);
        } catch {
          // Swallow errors; individual tabs may fail to restore
        }
      }
      const act = activeParam;
      const target = act && ids.includes(act) ? act : ids[0];
      if (target) {
        setActive(target);
      }
      hydratedOnceRef.current = true;
    })();
  }, [tabsParam, activeParam, setActive]);
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
