"use client";

import { useArtifacts } from "@ai-sdk-tools/artifacts/client";
import { Badge } from "@zeke/ui/badge";
import { Button } from "@zeke/ui/button";
import { Progress } from "@zeke/ui/progress";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock,
  PlayCircle,
  Zap,
} from "lucide-react";
import {
  BaseCanvas,
  CanvasContent,
  CanvasGrid,
  CanvasHeader,
  CanvasSection,
} from "./base";

export function PlaybookCanvas() {
  const { current } = useArtifacts({
    exclude: ["chat-title", "followup-questions"],
  });

  if (current?.type !== "playbook") {
    return null;
  }

  const data = current.payload as {
    title: string;
    objective: string;
    scope: "narrow" | "moderate" | "comprehensive";
    automationLevel: "manual" | "semi-auto" | "full-auto";
    steps: Array<{
      id: string;
      name: string;
      description: string;
      status: "pending" | "in-progress" | "completed" | "failed";
      duration: string;
      dependencies: string[];
      outputs: string[];
    }>;
    progress: number;
    estimatedTime: string;
    currentStep?: number;
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "in-progress":
        return <Circle className="h-4 w-4 text-blue-600 animate-pulse" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <BaseCanvas>
      <CanvasHeader
        title={data.title || "Research Playbook"}
        subtitle={data.objective}
        icon={PlayCircle}
      />

      <CanvasContent>
        {/* Overview */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 mb-6">
          <div className="space-y-1">
            <p className="text-sm font-medium">Progress</p>
            <div className="flex items-center gap-3">
              <Progress value={data.progress} className="w-32 h-2" />
              <span className="text-sm text-muted-foreground">
                {data.progress}%
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{data.scope} scope</Badge>
            <Badge variant="outline">
              <Zap className="h-3 w-3 mr-1" />
              {data.automationLevel}
            </Badge>
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              {data.estimatedTime}
            </Badge>
          </div>
        </div>

        {/* Steps */}
        <CanvasSection title="Execution Steps">
          <div className="space-y-3">
            {data.steps.map((step, index) => (
              <div
                key={step.id}
                className={`p-4 rounded-lg border transition-all ${
                  step.status === "in-progress"
                    ? "bg-primary/5 border-primary/50 shadow-sm"
                    : step.status === "completed"
                      ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                      : step.status === "failed"
                        ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
                        : "bg-card"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{statusIcon(step.status)}</div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <span className="text-muted-foreground">
                          Step {index + 1}:
                        </span>
                        {step.name}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {step.duration}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>

                    {/* Dependencies */}
                    {step.dependencies.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Dependencies:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {step.dependencies.map((dep) => (
                            <Badge
                              key={`${step.id}-dep-${dep}`}
                              variant="secondary"
                              className="text-xs"
                            >
                              {dep}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expected Outputs */}
                    {step.outputs.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Expected Outputs:
                        </p>
                        <ul className="space-y-0.5">
                          {step.outputs.map((output) => (
                            <li
                              key={`${step.id}-output-${output}`}
                              className="text-xs text-muted-foreground flex items-start"
                            >
                              <span className="mr-1.5 mt-0.5">→</span>
                              <span>{output}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CanvasSection>

        {/* Actions */}
        <CanvasSection title="Actions">
          <div className="flex gap-2">
            <Button size="sm" className="flex-1">
              <PlayCircle className="h-4 w-4 mr-2" />
              Run Playbook
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <Clock className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          </div>
        </CanvasSection>
      </CanvasContent>
    </BaseCanvas>
  );
}
