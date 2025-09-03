"use client";
import { useTabs } from "@/lib/tabsStore";
import type { Cluster } from "@/types/story";
import { Button } from "@/components/ui/button";

export default function StoryRow({ cluster }: { cluster: Cluster }) {
  const { openTab } = useTabs();
  const openInTab = () => {
    openTab({
      id: cluster.id,
      title: cluster.title,
      embedKind: cluster.embedKind,
      embedUrl: cluster.embedUrl,
      clusterId: cluster.id,
      overlays: cluster.overlays,
    });
  };

  return (
    <div className="flex items-center justify-between rounded border p-3">
      <div className="min-w-0">
        <div className="font-medium truncate max-w-[60vw]">{cluster.title}</div>
        <div className="text-xs text-muted-foreground truncate max-w-[60vw]">{cluster.primaryUrl}</div>
      </div>
      <div className="flex items-center gap-2">
        <span aria-label="chili" className="hidden md:inline">
          {Array.from({ length: cluster.overlays.chili }).map((_, i) => "🌶")}
        </span>
        <Button size="sm" onClick={openInTab}>
          Open
        </Button>
      </div>
    </div>
  );
}

