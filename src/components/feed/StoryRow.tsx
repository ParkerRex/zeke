"use client";
import { Button } from "@/components/ui/button";
import type { Cluster } from "@/features/stories";
import { useTabs } from "@/lib/tabsStore";

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
    <div className="flex items-center justify-between rounded border border-gray-200 p-4 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-150 cursor-pointer">
      <div className="min-w-0 flex-1">
        <div className="font-medium truncate max-w-[60vw] text-gray-900">{cluster.title}</div>
        <div className="text-xs text-gray-500 truncate max-w-[60vw] mt-1">{cluster.primaryUrl}</div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span aria-label="chili" className="hidden md:inline text-sm">
          {Array.from({ length: cluster.overlays.chili }).map((_, i) => "🌶")}
        </span>
        <Button size="sm" variant="outline" onClick={openInTab}>
          Open
        </Button>
      </div>
    </div>
  );
}
