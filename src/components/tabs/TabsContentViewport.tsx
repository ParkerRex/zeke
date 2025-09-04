"use client";
import { useTabs } from "@/lib/tabsStore";
import StoryTab from "./StoryTab";
import { usePathname } from "next/navigation";
import StoriesGridClient from "@/components/stories/StoriesGridClient";

export default function TabsContentViewport() {
  const { tabs, activeId } = useTabs();
  const pathname = usePathname();
  const active = tabs.find((t) => t.id === activeId);
  if (!active) {
    if (pathname === "/stories") return <StoriesGridClient variant="full" />;
    return <div className="p-6 text-muted-foreground">Open a story to begin.</div>;
  }
  return <StoryTab tab={active} />;
}
