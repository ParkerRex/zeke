import Link from "next/link";

import type { StoryClusterView } from "@/utils/stories";

type Props = {
  cluster: StoryClusterView;
};

export default function StoryRow({ cluster }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-xs uppercase text-muted-foreground">
          {cluster.embedKind ?? "story"}
        </p>
        <h3 className="text-sm font-medium">
          <Link
            className="hover:text-primary hover:underline"
            href={`/stories/${encodeURIComponent(cluster.id)}`}
          >
            {cluster.title}
          </Link>
        </h3>
        {cluster.primaryUrl && (
          <p className="text-xs text-muted-foreground truncate max-w-[320px]">
            {cluster.primaryUrl}
          </p>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        {cluster.overlays?.sources?.length ?? 0} sources
      </div>
    </div>
  );
}
