"use client";

import { useArtifacts } from "@ai-sdk-tools/artifacts/client";
import { Badge } from "@zeke/ui/badge";
import { Separator } from "@zeke/ui/separator";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Target,
} from "lucide-react";
import { BaseCanvas, CanvasContent, CanvasHeader, CanvasSection } from "./base";

export function BriefCanvas() {
  const { current } = useArtifacts({
    exclude: ["chat-title", "followup-questions"],
  });

  if (current?.type !== "research-brief") {
    return null;
  }

  const brief = current.payload?.brief;
  const metadata = current.payload?.metadata;

  if (!brief) return null;

  return (
    <BaseCanvas>
      <CanvasHeader
        title={brief.title || "Research Brief"}
        subtitle={metadata?.topic || "Generated Brief"}
        icon={FileText}
      />

      <CanvasContent>
        {/* Metadata Bar */}
        <div className="flex items-center gap-3 pb-4">
          <Badge variant="outline">{metadata?.audience || "General"}</Badge>
          <Badge variant="outline">{metadata?.format || "Brief"}</Badge>
          <span className="text-xs text-muted-foreground">
            {metadata?.sourcesAnalyzed || 0} sources •{" "}
            {metadata?.insightsIncluded || 0} insights
          </span>
        </div>

        {/* Executive Summary */}
        <CanvasSection title="Executive Summary">
          <p className="text-sm text-foreground leading-relaxed">
            {brief.executive_summary}
          </p>
        </CanvasSection>

        <Separator className="my-4" />

        {/* Background */}
        <CanvasSection title="Background">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {brief.background}
          </p>
        </CanvasSection>

        {/* Key Findings */}
        <CanvasSection title="Key Findings">
          <div className="space-y-3">
            {brief.key_findings?.map((finding: any) => {
              const findingKey =
                finding?.id ?? finding?.finding ?? JSON.stringify(finding);

              return (
                <div
                  key={String(findingKey)}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {finding.impact === "high" ? (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      ) : finding.impact === "medium" ? (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium">{finding.finding}</p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            finding.impact === "high"
                              ? "destructive"
                              : finding.impact === "medium"
                                ? "secondary"
                                : "default"
                          }
                        >
                          {finding.impact} impact
                        </Badge>
                      </div>
                      {finding.evidence?.length > 0 && (
                        <div className="pt-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            Supporting Evidence:
                          </p>
                          <ul className="space-y-1">
                            {finding.evidence.slice(0, 3).map((ev: string) => (
                              <li
                                key={`${String(findingKey)}-${ev}`}
                                className="text-xs text-muted-foreground flex items-start"
                              >
                                <span className="mr-1.5 mt-0.5">•</span>
                                <span>{ev}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CanvasSection>

        {/* Analysis */}
        <CanvasSection title="Analysis">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {brief.analysis}
          </p>
        </CanvasSection>

        {/* Recommendations */}
        {brief.recommendations?.length > 0 && (
          <CanvasSection title="Recommendations" icon={Target}>
            <div className="space-y-3">
              {brief.recommendations.map((rec: any) => {
                const recommendationKey =
                  rec?.id ?? rec?.action ?? JSON.stringify(rec);

                return (
                  <div
                    key={String(recommendationKey)}
                    className="p-4 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium">{rec.action}</h4>
                      <Badge
                        variant={
                          rec.priority === "immediate"
                            ? "destructive"
                            : rec.priority === "short-term"
                              ? "default"
                              : "secondary"
                        }
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {rec.rationale}
                    </p>
                  </div>
                );
              })}
            </div>
          </CanvasSection>
        )}

        {/* Next Steps */}
        {brief.next_steps?.length > 0 && (
          <CanvasSection title="Next Steps">
            <ol className="space-y-2">
              {brief.next_steps.map((step: string, index: number) => (
                <li key={step} className="flex items-start gap-2 text-sm">
                  <span className="font-medium text-primary">{index + 1}.</span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </CanvasSection>
        )}

        {/* Appendix */}
        {brief.appendix && (
          <CanvasSection title="Appendix">
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Sources Reviewed:</span>
                <span className="font-medium">
                  {brief.appendix.sources_reviewed}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Confidence Level:</span>
                <span className="font-medium">
                  {Math.round((brief.appendix.confidence_level || 0) * 100)}%
                </span>
              </div>
              {brief.appendix.limitations?.length > 0 && (
                <div className="pt-2">
                  <p className="font-medium mb-1">Limitations:</p>
                  <ul className="space-y-1">
                    {brief.appendix.limitations.map((limit: string) => (
                      <li key={limit} className="flex items-start">
                        <span className="mr-1.5 mt-0.5">•</span>
                        <span>{limit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CanvasSection>
        )}
      </CanvasContent>
    </BaseCanvas>
  );
}
