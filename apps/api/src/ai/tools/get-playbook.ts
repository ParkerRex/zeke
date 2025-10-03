import type { GetPlaybookInput } from "./schema";
import type { ToolResult } from "./types";

/**
 * Playbook planning tool - currently stubbed until Trigger.dev jobs are wired up
 */
export async function getPlaybook(
  input: GetPlaybookInput,
  context: { teamId: string; userId: string },
): Promise<ToolResult> {
  const executionTime = Date.now();

  // TODO: call packages/jobs playbook pipeline when available and return real run data
  return {
    success: true,
    data: {
      objective: input.objective,
      scope: input.scope,
      timeline: input.timeline ?? "unspecified",
      automationLevel: input.automationLevel,
      assignedTo: context.userId,
      nextStep: "Connect Trigger.dev playbook pipeline",
    },
    metadata: {
      toolName: "getPlaybook",
      executionTime,
    },
  };
}
