"use client";

import StoryRow from "@/components/feed/story-row";
import { STRINGS } from "@/constants/strings";
import { useStories } from "@/hooks/use-stories";

export default function TodayFeedClient() {
  const { clusters, loading, error, reload } = useStories();

  let content: React.ReactNode;
  if (loading) {
    content = (
      <div className="p-3 text-muted-foreground text-sm">{STRINGS.loading}</div>
    );
  } else if (error) {
    content = (
      <div className="flex items-center justify-between p-3 text-sm">
        <span className="text-red-600">{error || STRINGS.loadError}</span>
        <button
          className="rounded bg-gray-900 px-3 py-1 text-white hover:opacity-90"
          onClick={reload}
          type="button"
        >
          {STRINGS.retry}
        </button>
      </div>
    );
  } else {
    content = (
      <div className="divide-y">
        {clusters.map((c) => (
          <StoryRow cluster={c} key={c.id} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="border-b bg-background/50 p-3 font-medium text-sm">
        {"Today's Top Stories"}
      </div>
      {content}
    </div>
  );
}
