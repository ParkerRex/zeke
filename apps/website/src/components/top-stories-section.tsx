import { Button } from "@zeke/ui/button";
import Link from "next/link";
import {
  type StoryClusterView,
  fetchStoriesForWebsite,
} from "../../lib/stories";
import { DEFAULT_STORIES_LIMIT } from "../../lib/stories-utils";
import { StoriesGrid } from "./stories-grid";

interface TopStoriesSectionProps {
  title?: string;
  limit?: number;
  showDate?: boolean;
  stories?: StoryClusterView[];
}

export async function TopStoriesSection({
  title = "Top Stories",
  limit = DEFAULT_STORIES_LIMIT,
  showDate = true,
  stories,
}: TopStoriesSectionProps) {
  const items = stories ?? (await fetchStoriesForWebsite({ limit })).stories;
  const grid = items.slice(0, limit);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-bold text-2xl">{title}</h2>
        {showDate && (
          <div className="text-muted-foreground text-sm">
            {new Date().toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Decorative multi-rule under heading */}
      <div className="mb-4 space-y-[2px]">
        <div className="h-[2px] bg-foreground" />
        <div className="h-[2px] bg-foreground" />
        <div className="h-[1px] bg-foreground" />
      </div>

      <StoriesGrid
        stories={grid}
        variant="featured"
        showHype={true}
        columns={{ sm: 2, lg: 3 }}
      />

      <div className="mt-4">
        <Button variant="outline" asChild>
          <Link href="/stories">
            Show More
            <span aria-hidden className="text-lg leading-none">
              +
            </span>
          </Link>
        </Button>
      </div>
    </section>
  );
}
