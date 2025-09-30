/**
 * Reusable stories grid component
 */

import { cn } from "@zeke/ui/lib/utils";
import type { StoryClusterView } from "../lib/stories";
import { StoryCard } from "./story-card";

interface StoriesGridProps {
  stories: StoryClusterView[];
  variant?: "default" | "featured" | "compact";
  showHype?: boolean;
  showImage?: boolean;
  showTimestamp?: boolean;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  className?: string;
}

export function StoriesGrid({
  stories,
  variant = "default",
  showHype = false,
  showImage = true,
  showTimestamp = true,
  columns = { sm: 2, md: 2, lg: 3, xl: 3 },
  className,
}: StoriesGridProps) {
  const gridClasses = cn(
    "grid grid-cols-1 gap-4",
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`,
    className,
  );

  return (
    <div className={gridClasses}>
      {stories.map((story) => (
        <StoryCard
          key={story.id}
          story={story}
          variant={variant}
          showHype={showHype}
          showImage={showImage}
          showTimestamp={showTimestamp}
        />
      ))}
    </div>
  );
}
