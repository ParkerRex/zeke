"use client";

import { useArtifacts } from "@ai-sdk-tools/artifacts/client";
import { Badge } from "@zeke/ui/badge";
import { Progress } from "@zeke/ui/progress";
import { Activity, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import {
  BaseCanvas,
  CanvasContent,
  CanvasGrid,
  CanvasHeader,
  CanvasSection,
} from "./base";

export function TrendCanvas() {
  const { current } = useArtifacts({
    exclude: ["chat-title", "followup-questions"],
  });

  if (current?.type !== "trend-analysis") {
    return null;
  }

  const data = current.payload as {
    title: string;
    timeframe: string;
    trends: Array<{
      topic: string;
      direction: "up" | "down" | "stable";
      change: number;
      confidence: number;
      insights: string[];
      sources: number;
    }>;
    summary: string;
    recommendations: string[];
  };

  return (
    <BaseCanvas>
      <CanvasHeader
        title={data.title || "Trend Analysis"}
        subtitle={`Analyzing trends for ${data.timeframe}`}
        icon={Activity}
      />

      <CanvasContent>
        {/* Summary Section */}
        <CanvasSection title="Executive Summary" icon={Sparkles}>
          <p className="text-sm text-muted-foreground">{data.summary}</p>
        </CanvasSection>

        {/* Trends Grid */}
        <CanvasSection title="Key Trends">
          <CanvasGrid cols={1}>
            {data.trends.map((trend) => (
              <div
                key={trend.topic}
                className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      {trend.topic}
                      {trend.direction === "up" ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : trend.direction === "down" ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : (
                        <Activity className="h-4 w-4 text-yellow-600" />
                      )}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={
                          trend.direction === "up"
                            ? "default"
                            : trend.direction === "down"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {trend.change > 0 ? "+" : ""}
                        {trend.change}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        from {trend.sources} sources
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confidence Indicator */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Confidence</span>
                    <span>{Math.round(trend.confidence * 100)}%</span>
                  </div>
                  <Progress value={trend.confidence * 100} className="h-1.5" />
                </div>

                {/* Key Insights */}
                {trend.insights.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Key Insights:
                    </p>
                    <ul className="space-y-1">
                      {trend.insights.slice(0, 3).map((insight) => (
                        <li
                          key={`${trend.topic}-${insight}`}
                          className="text-xs text-muted-foreground flex items-start"
                        >
                          <span className="mr-1.5 mt-1">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CanvasGrid>
        </CanvasSection>

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <CanvasSection title="Recommendations">
            <div className="space-y-2">
              {data.recommendations.map((rec, index) => (
                <div
                  key={rec}
                  className="flex items-start gap-2 p-3 rounded-lg bg-muted/50"
                >
                  <span className="text-sm font-medium text-primary">
                    {index + 1}.
                  </span>
                  <span className="text-sm text-foreground">{rec}</span>
                </div>
              ))}
            </div>
          </CanvasSection>
        )}
      </CanvasContent>
    </BaseCanvas>
  );
}
