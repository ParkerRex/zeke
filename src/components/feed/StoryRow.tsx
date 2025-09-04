"use client";
import type { Cluster } from "@/features/stories";
import { useTabs } from "@/lib/tabsStore";
import { StoryKindIcon } from "@/components/stories/StoryKindIcon";

export default function StoryRow({ cluster }: { cluster: Cluster }) {
  const { openTab } = useTabs();
  const openPreview = () =>
    openTab({
      id: cluster.id,
      title: cluster.title,
      embedKind: cluster.embedKind,
      embedUrl: cluster.embedUrl,
      clusterId: cluster.id,
      overlays: cluster.overlays,
      preview: true,
    });
  const openPermanent = () =>
    openTab({
      id: cluster.id,
      title: cluster.title,
      embedKind: cluster.embedKind,
      embedUrl: cluster.embedUrl,
      clusterId: cluster.id,
      overlays: cluster.overlays,
      preview: false,
    });

  return (
    <button
      onClick={openPreview}
      onDoubleClick={(e) => {
        e.preventDefault();
        openPermanent();
      }}
      className="group flex w-full items-start gap-3 px-3 py-2 text-left transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
    >
      <div className="mt-0.5 flex-shrink-0 text-gray-700">
        <StoryKindIcon kind={cluster.embedKind} className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-gray-900">{cluster.title}</div>
        <div className="truncate text-[11px] text-gray-500">{cluster.primaryUrl}</div>
      </div>
      <span aria-label="chili" className="flex-shrink-0 text-xs">
        {Array.from({ length: cluster.overlays.chili }).map(() => "🌶")}
      </span>
    </button>
  );
}
