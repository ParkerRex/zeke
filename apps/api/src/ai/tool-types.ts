import type { InferUITools } from "ai";
import { researchTools } from "./tools/registry";

// Tool registry function - this creates the actual tool implementations
export const createToolRegistry = () => {
  return {
    // Research tools for stories, insights, and briefs
    getHighlights: researchTools.getHighlights,
    getSummaries: researchTools.getSummaries,
    getBrief: researchTools.getBrief,
    getPlaybook: researchTools.getPlaybook,
    linkInsights: researchTools.linkInsights,
  } as any;
};

// Infer the UI tools type from the registry
export type UITools = InferUITools<ReturnType<typeof createToolRegistry>>;
