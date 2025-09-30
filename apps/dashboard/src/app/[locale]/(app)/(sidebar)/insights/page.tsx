import { PrioritizedHighlights } from "@/components/insights/prioritized-highlights";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Insights • ZEKE",
  description:
    "Curate AI insights, highlights, and follow-ups tailored to your team.",
  alternates: { canonical: "/insights" },
};

export default function InsightsPage() {
  return (
    <section className="flex h-full flex-col gap-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Insights</h1>
        <p className="text-sm text-muted-foreground">
          AI-scored highlights from your monitored sources, prioritized by
          relevance.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-24 w-full animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        }
      >
        <PrioritizedHighlights />
      </Suspense>
    </section>
  );
}
