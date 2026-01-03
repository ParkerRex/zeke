"use client";

import { useAnalytics } from "@/hooks/use-analytics";
import { trpc } from "@/trpc/client";
import { Badge } from "@zeke/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zeke/ui/card";
import { Skeleton } from "@zeke/ui/skeleton";
import { Flame } from "lucide-react";
import Link from "next/link";

/**
 * Hero module for displaying story summaries from the dashboard
 * Replaces legacy HomeSnapshot, LatestNewsSection, TopNewsSection
 */
export function StoriesHero() {
  const { track } = useAnalytics();
  const { data, isLoading, error } = trpc.stories.dashboardSummaries.useQuery({
    limit: 12,
    includeMetrics: true,
  });

  if (isLoading) {
    return <StoriesHeroSkeleton />;
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Stories</CardTitle>
          <CardDescription>Unable to load stories</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { trending, signals, repoWatch } = data;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Trending Stories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {trending.title}
            <Badge variant="secondary">{trending.stories.length}</Badge>
          </CardTitle>
          <CardDescription>{trending.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trending.stories.slice(0, 4).map((story, index) => (
              <StoryItem
                key={story.id}
                story={story}
                position={index}
                category="trending"
                onTrack={track}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Important Signals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {signals.title}
            <Badge variant="secondary">{signals.stories.length}</Badge>
          </CardTitle>
          <CardDescription>{signals.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {signals.stories.slice(0, 4).map((story, index) => (
              <StoryItem
                key={story.id}
                story={story}
                position={index}
                category="signals"
                isPinned
                onTrack={track}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Repository Watch */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {repoWatch.title}
            <Badge variant="secondary">{repoWatch.stories.length}</Badge>
          </CardTitle>
          <CardDescription>{repoWatch.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {repoWatch.stories.slice(0, 4).map((story, index) => (
              <StoryItem
                key={story.id}
                story={story}
                position={index}
                category="repo-watch"
                onTrack={track}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Individual story item component
 */
function StoryItem({
  story,
  isPinned = false,
  position,
  category,
  onTrack,
}: {
  story: any;
  isPinned?: boolean;
  position: number;
  category: "trending" | "signals" | "repo-watch";
  onTrack: (event: string, props: any) => void;
}) {
  const rawChili = typeof story.chiliScore === "number" ? story.chiliScore : 0;
  const chiliLevel = Number.isFinite(rawChili)
    ? Math.max(0, Math.round(rawChili * 5))
    : 0;

  const handleClick = () => {
    onTrack("StoryClicked", {
      storyId: story.id,
      source: "hero",
      chiliScore: story.chiliScore || 0,
      position,
    });
  };

  return (
    <Link
      href={`/stories/${story.id}`}
      className="block group"
      onClick={handleClick}
    >
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
            {story.title}
          </h4>
          {chiliLevel > 0 && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {Array.from({ length: chiliLevel }).map((_, idx) => (
                <Flame
                  key={`${story.id}-flame-${idx}`}
                  className="h-3 w-3 text-orange-500 fill-orange-500"
                />
              ))}
            </div>
          )}
        </div>
        {story.whyItMatters && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {story.whyItMatters}
          </p>
        )}
        <div className="flex items-center gap-2">
          {isPinned && (
            <Badge variant="outline" className="h-5 text-xs">
              Pinned
            </Badge>
          )}
          {story.cluster?.label && (
            <Badge variant="secondary" className="h-5 text-xs">
              {story.cluster.label}
            </Badge>
          )}
          {story.kind && (
            <Badge variant="ghost" className="h-5 text-xs">
              {story.kind}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}

/**
 * Loading skeleton for the hero module
 */
function StoriesHeroSkeleton() {
  const cardPlaceholders = ["card-a", "card-b", "card-c"];
  const linePlaceholders = ["line-a", "line-b", "line-c", "line-d"];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {cardPlaceholders.map((cardKey) => (
        <Card key={cardKey}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {linePlaceholders.map((lineKey) => (
                <div key={`${cardKey}-${lineKey}`} className="space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
