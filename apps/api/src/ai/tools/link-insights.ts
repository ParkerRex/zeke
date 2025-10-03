import type { LinkInsightsInput } from "./schema";
import type { ToolResult } from "./types";

/**
 * Insight linking tool - currently returns a stubbed response until jobs are connected
 */
export async function linkInsights(
  input: LinkInsightsInput,
  context: { teamId: string; userId: string },
): Promise<ToolResult> {
  const executionTime = Date.now();

  // TODO: call packages/jobs once we have an insight linking pipeline available
  return {
    success: true,
    data: {
      linkedInsights: input.insightIds ?? [],
      relatedGoals: input.goalIds ?? [],
      lookedForPatterns: input.lookForPatterns,
      minConfidence: input.minConfidence,
      notes: "Insight linking job integration pending",
    },
    metadata: {
      toolName: "linkInsights",
      executionTime,
    },
  };
}
