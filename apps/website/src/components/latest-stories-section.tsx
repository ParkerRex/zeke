/**
 * Latest Stories Section component
 * Displays a grid of latest stories
 */

import { fetchStoriesForWebsite, type StoryClusterView } from '../../lib/stories';
import { DEFAULT_STORIES_LIMIT } from '../../lib/stories-utils';
import { StoriesGrid } from './stories-grid';

interface LatestStoriesSectionProps {
  title?: string;
  stories?: StoryClusterView[];
  limit?: number;
}

export async function LatestStoriesSection({
  title = 'Latest Stories',
  stories,
  limit = DEFAULT_STORIES_LIMIT,
}: LatestStoriesSectionProps) {
  const items =
    stories ?? (await fetchStoriesForWebsite({ limit })).stories;
  const grid = items.slice(0, limit);

  return (
    <section className="mt-8">
      <h2 className="mb-2 font-bold text-2xl">{title}</h2>

      {/* Decorative multi-rule under heading */}
      <div className="mb-4 space-y-[2px]">
        <div className="h-[2px] bg-foreground" />
        <div className="h-[2px] bg-foreground" />
        <div className="h-[1px] bg-foreground" />
      </div>

      <StoriesGrid stories={grid} columns={{ sm: 2, lg: 2, xl: 3 }} />
    </section>
  );
}
