import { getBrief } from "./get-brief";
import { getHighlights } from "./get-highlights";
import { getPlaybook } from "./get-playbook";
import { getSummaries } from "./get-summaries";
import { linkInsights } from "./link-insights";
import { toolSchemas } from "./schema";

export const toolMetadata = {
  getHighlights: {
    name: "getHighlights",
    title: "Story Highlights",
    description:
      "Retrieve and analyze story highlights, key insights, and trending topics from ingested content.",
    parameters: toolSchemas.getHighlights,
    relatedTools: ["getSummaries", "linkInsights"],
  },
  getSummaries: {
    name: "getSummaries",
    title: "Summarize Sources",
    description:
      "Generate comprehensive summaries from multiple sources with key takeaways and insights.",
    parameters: toolSchemas.getSummaries,
    relatedTools: ["getHighlights", "getBrief"],
  },
  getBrief: {
    name: "getBrief",
    title: "Draft Brief",
    description:
      "Create a research brief or content outline based on collected insights and stories.",
    parameters: toolSchemas.getBrief,
    relatedTools: ["getSummaries", "getPlaybook"],
  },
  getPlaybook: {
    name: "getPlaybook",
    title: "Plan Playbook",
    description:
      "Design and plan a research playbook for systematic analysis of a topic or competitor.",
    parameters: toolSchemas.getPlaybook,
    relatedTools: ["getBrief", "linkInsights"],
  },
  linkInsights: {
    name: "linkInsights",
    title: "Link Insights",
    description:
      "Connect and correlate insights across stories, highlights, and goals to identify patterns.",
    parameters: toolSchemas.linkInsights,
    relatedTools: ["getHighlights", "getPlaybook"],
  },
} as const;

export type ToolName = keyof typeof toolMetadata;

export const researchTools = {
  getHighlights,
  getSummaries,
  getBrief,
  getPlaybook,
  linkInsights,
} as const;
