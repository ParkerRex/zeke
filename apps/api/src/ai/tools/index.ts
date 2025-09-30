import { tool } from "ai";
import { getStoryHighlights } from "./get-story-highlights";
import { summarizeSources } from "./summarize-sources";
import { draftBrief } from "./draft-brief";
import { webSearch } from "./web-search";
import { researchToolMetadata } from "./research-registry";

/**
 * Research tools for the AI assistant
 * These tools enable the assistant to analyze stories, generate summaries,
 * create briefs, and search for information
 */

// Create tool functions that get context from the AI context
import { getContext } from "../context";

export const researchTools = {
  getStoryHighlights: tool({
    description: researchToolMetadata.getStoryHighlights.description,
    parameters: researchToolMetadata.getStoryHighlights.parameters,
    execute: async (input: any) => {
      const context = getContext();
      const result = await getStoryHighlights(input, {
        teamId: context.user.teamId,
        userId: context.user.id,
      });
      return result.success ? result.data : { error: result.error };
    },
  }),

  summarizeSources: tool({
    description: researchToolMetadata.summarizeSources.description,
    parameters: researchToolMetadata.summarizeSources.parameters,
    execute: async (input: any) => {
      const context = getContext();
      const result = await summarizeSources(input, {
        teamId: context.user.teamId,
        userId: context.user.id,
      });
      return result.success ? result.data : { error: result.error };
    },
  }),

  draftBrief: tool({
    description: researchToolMetadata.draftBrief.description,
    parameters: researchToolMetadata.draftBrief.parameters,
    execute: async (input: any) => {
      const context = getContext();
      const result = await draftBrief(input, {
        teamId: context.user.teamId,
        userId: context.user.id,
      });
      return result.success ? result.data : { error: result.error };
    },
  }),

  webSearch: tool({
    description: researchToolMetadata.webSearch.description,
    parameters: researchToolMetadata.webSearch.parameters,
    execute: async (input: any) => {
      const context = getContext();
      const result = await webSearch(input, {
        teamId: context.user.teamId,
        userId: context.user.id,
      });
      return result.success ? result.data : { error: result.error };
    },
  }),

  // Placeholder tools for future implementation
  planPlaybook: tool({
    description: researchToolMetadata.planPlaybook.description,
    parameters: researchToolMetadata.planPlaybook.parameters,
    execute: async (input) => {
      return {
        message: "Playbook planning will be available soon",
        input,
      };
    },
  }),

  linkInsights: tool({
    description: researchToolMetadata.linkInsights.description,
    parameters: researchToolMetadata.linkInsights.parameters,
    execute: async (input) => {
      return {
        message: "Insight linking will be available soon",
        input,
      };
    },
  }),
};

// Export metadata for UI and documentation
export { researchToolMetadata } from "./research-registry";
export type { ResearchToolName, ToolResult } from "./research-registry";
