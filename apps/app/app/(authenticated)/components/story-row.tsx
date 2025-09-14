'use client';
import { useTabs } from '@/hooks/use-tabs';
import { domainFromUrl } from '@/utils/url';
import type { Cluster } from '@zeke/supabase/types';
import { useRouter } from 'next/navigation';
import { StoryKindIcon } from './story-kind-icon';

export default function StoryRow({ cluster }: { cluster: Cluster }) {
  const { openTab } = useTabs();
  const router = useRouter();
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
  const openPermanent = () => {
    router.push(`/stories/${encodeURIComponent(cluster.id)}`);
  };

  return (
    <button
      className="group flex w-full items-start gap-3 px-3 py-2 text-left transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
      onClick={openPreview}
      onDoubleClick={(e) => {
        e.preventDefault();
        openPermanent();
      }}
      type="button"
    >
      <div className="mt-0.5 flex-shrink-0 text-gray-700">
        <StoryKindIcon className="h-5 w-5" kind={cluster.embedKind} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-gray-900 text-sm">
          {cluster.title}
        </div>
        <div className="truncate text-[11px] text-gray-500">
          {domainFromUrl(cluster.primaryUrl)}
        </div>
      </div>
      <span aria-label="spiciness" className="flex-shrink-0 text-xs" role="img">
        {'🌶'.repeat(cluster.overlays.chili)}
      </span>
    </button>
  );
}
