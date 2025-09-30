"use client";

import { usePrioritizedHighlights } from "@/hooks/use-highlights";
import { Skeleton } from "@zeke/ui/skeleton";

export function PrioritizedHighlights() {
  const { data: highlights, isLoading } = usePrioritizedHighlights(20);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!highlights || highlights.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        <p>No highlights yet.</p>
        <p className="mt-2">
          Highlights will appear here as content is ingested and analyzed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {highlights.map((highlight) => {
        const relevanceScore = highlight.metadata?.relevance_score as
          | number
          | undefined;
        const scoreColor =
          relevanceScore && relevanceScore >= 0.8
            ? "text-green-600"
            : relevanceScore && relevanceScore >= 0.6
              ? "text-yellow-600"
              : "text-muted-foreground";

        return (
          <div
            key={highlight.id}
            className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-2 flex items-start justify-between">
              <div className="flex-1">
                {highlight.kind && (
                  <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {highlight.kind.replace("_", " ")}
                  </span>
                )}
                {highlight.title && (
                  <h3 className="mt-2 font-medium">{highlight.title}</h3>
                )}
              </div>
              {relevanceScore !== undefined && (
                <span className={`text-xs font-mono ${scoreColor}`}>
                  {(relevanceScore * 100).toFixed(0)}%
                </span>
              )}
            </div>

            {highlight.summary && (
              <p className="text-sm text-muted-foreground">
                {highlight.summary}
              </p>
            )}

            {highlight.quote && (
              <blockquote className="mt-2 border-l-2 border-primary/20 pl-3 text-sm italic text-muted-foreground">
                {highlight.quote.length > 200
                  ? `${highlight.quote.slice(0, 200)}...`
                  : highlight.quote}
              </blockquote>
            )}

            {highlight.storyTitle && (
              <div className="mt-3 text-xs text-muted-foreground">
                From:{" "}
                <span className="font-medium">{highlight.storyTitle}</span>
                {highlight.storyPublishedAt && (
                  <span className="ml-2">
                    • {new Date(highlight.storyPublishedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}