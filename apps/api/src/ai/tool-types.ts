import { openai } from "@ai-sdk/openai";
import type { InferUITools } from "ai";
import { getContext } from "./context";
import { researchTools } from "./tools";

// Tool registry function - this creates the actual tool implementations
export const createToolRegistry = () => {
  const context = getContext();

  return {
    // Research tools for stories, insights, and briefs
    getStoryHighlights: researchTools.getStoryHighlights,
    summarizeSources: researchTools.summarizeSources,
    draftBrief: researchTools.draftBrief,
    planPlaybook: researchTools.planPlaybook,
    linkInsights: researchTools.linkInsights,

    // Web search with location context
    webSearch: openai.tools.webSearch({
      searchContextSize: "medium",
      userLocation: {
        type: "approximate",
        country: context.user.country ?? undefined,
        city: context.user.city ?? undefined,
        region: context.user.region ?? undefined,
      },
    }),
  };
};

// Infer the UI tools type from the registry
export type UITools = InferUITools<ReturnType<typeof createToolRegistry>>;
