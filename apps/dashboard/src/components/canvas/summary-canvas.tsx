"use client";

import { useArtifacts } from "@ai-sdk-tools/artifacts/client";
import { Badge } from "@zeke/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zeke/ui/card";
import { AlertTriangle, CheckCircle, FileText, TrendingUp } from "lucide-react";
import {
  BaseCanvas,
  CanvasContent,
  CanvasGrid,
  CanvasHeader,
  CanvasSection,
} from "./base";

export function SummaryCanvas() {
  const { current } = useArtifacts({
    exclude: ["chat-title", "followup-questions"],
  });

  if (current?.type !== "source-summary") {
    return null;
  }

  const data = current.payload as {
    summary: {
      mainThemes: string[];
      keyInsights: Array<{
        insight: string;
        confidence: number;
        sources: string[];
      }>;
      consensus?: string;
      conflicts?: string[];
      recommendations?: string[];
    };
    sources: Array<{
      id: string;
      name: string;
      storyCount: number;
    }>;
    metadata: {
      totalSources: number;
      totalStories: number;
      totalHighlights: number;
      style: string;
      topic?: string;
    };
  };

  return (
    <BaseCanvas>
      <CanvasHeader
        title="Source Summary"
        subtitle={data.metadata.topic || "Multi-source Analysis"}
        icon={FileText}
      />

      <CanvasContent>
        {/* Metadata Bar */}
        <div className="flex items-center gap-3 pb-4">
          <Badge variant="outline">{data.metadata.totalSources} sources</Badge>
          <Badge variant="outline">{data.metadata.totalStories} stories</Badge>
          <Badge variant="outline">
            {data.metadata.totalHighlights} highlights
          </Badge>
          <Badge variant="secondary">{data.metadata.style} style</Badge>
        </div>

        {/* Main Themes */}
        <CanvasSection title="Main Themes">
          <div className="flex flex-wrap gap-2">
            {data.summary.mainThemes.map((theme) => (
              <Badge key={theme} variant="default" className="py-1.5 px-3">
                {theme}
              </Badge>
            ))}
          </div>
        </CanvasSection>

        {/* Key Insights */}
        <CanvasSection title="Key Insights">
          <div className="space-y-3">
            {data.summary.keyInsights.map((insight) => {
              const insightKey = insight.insight ?? JSON.stringify(insight);

              return (
                <Card key={insightKey}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-medium leading-relaxed">
                        {insight.insight}
                      </CardTitle>
                      <Badge
                        variant={
                          insight.confidence > 0.8
                            ? "default"
                            : insight.confidence > 0.6
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {Math.round(insight.confidence * 100)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>Sources:</span>
                      <div className="flex flex-wrap gap-1">
                        {insight.sources.map((source) => (
                          <Badge
                            key={`${insightKey}-${source}`}
                            variant="outline"
                            className="text-xs"
                          >
                            {source}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CanvasSection>

        {/* Consensus */}
        {data.summary.consensus && (
          <CanvasSection title="Consensus" icon={CheckCircle}>
            <div className="p-4 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
              <p className="text-sm text-foreground">
                {data.summary.consensus}
              </p>
            </div>
          </CanvasSection>
        )}

        {/* Conflicts */}
        {data.summary.conflicts && data.summary.conflicts.length > 0 && (
          <CanvasSection title="Conflicting Views" icon={AlertTriangle}>
            <div className="space-y-2">
              {data.summary.conflicts.map((conflict) => (
                <div
                  key={conflict}
                  className="p-3 rounded-lg bg-yellow-50/50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900"
                >
                  <p className="text-sm text-foreground">{conflict}</p>
                </div>
              ))}
            </div>
          </CanvasSection>
        )}

        {/* Recommendations */}
        {data.summary.recommendations &&
          data.summary.recommendations.length > 0 && (
            <CanvasSection title="Recommendations" icon={TrendingUp}>
              <ol className="space-y-2">
                {data.summary.recommendations.map((rec, index) => (
                  <li
                    key={rec}
                    className="flex items-start gap-2 p-3 rounded-lg bg-muted/30"
                  >
                    <span className="font-medium text-primary text-sm">
                      {index + 1}.
                    </span>
                    <span className="text-sm text-foreground">{rec}</span>
                  </li>
                ))}
              </ol>
            </CanvasSection>
          )}

        {/* Sources List */}
        <CanvasSection title="Sources Analyzed">
          <CanvasGrid cols={1}>
            {data.sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <span className="text-sm font-medium">{source.name}</span>
                <Badge variant="outline">
                  {source.storyCount}{" "}
                  {source.storyCount === 1 ? "story" : "stories"}
                </Badge>
              </div>
            ))}
          </CanvasGrid>
        </CanvasSection>
      </CanvasContent>
    </BaseCanvas>
  );
}
