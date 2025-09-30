/**
 * Analytics events for research dashboard and assistant flows
 * Tracks user interactions with insights, stories, and AI features
 */

export const ResearchEvents = {
  // Dashboard View Events
  DashboardView: {
    name: "Dashboard Viewed",
    channel: "dashboard",
    properties: {
      source: "direct" as "direct" | "navigation" | "refresh",
      hasNotifications: false as boolean,
    },
  },

  // Hero Module Events
  HeroSearch: {
    name: "Hero Search Performed",
    channel: "search",
    properties: {
      query: "" as string,
      category: "trending" as "trending" | "signals" | "repo-watch",
      resultsCount: 0 as number,
    },
  },

  StoryClicked: {
    name: "Story Clicked",
    channel: "stories",
    properties: {
      storyId: "" as string,
      source: "hero" as "hero" | "feed" | "search",
      chiliScore: 0 as number,
      position: 0 as number,
    },
  },

  // Assistant Events
  AssistantMessageSent: {
    name: "Assistant Message Sent",
    channel: "assistant",
    properties: {
      chatId: "" as string,
      messageLength: 0 as number,
      isFirstMessage: false as boolean,
      hasContext: false as boolean,
    },
  },

  AssistantToolInvoked: {
    name: "Assistant Tool Invoked",
    channel: "assistant",
    properties: {
      toolName: "" as string,
      chatId: "" as string,
      executionTime: 0 as number,
      success: false as boolean,
    },
  },

  AssistantFeedbackSubmitted: {
    name: "Assistant Feedback Submitted",
    channel: "assistant",
    properties: {
      chatId: "" as string,
      messageId: "" as string,
      type: "positive" as "positive" | "negative" | "other",
      hasComment: false as boolean,
    },
  },

  // Artifact Events
  ArtifactOpened: {
    name: "Artifact Opened",
    channel: "artifacts",
    properties: {
      type: "trend-analysis" as
        | "trend-analysis"
        | "research-brief"
        | "playbook"
        | "source-summary",
      source: "tool" as "tool" | "manual",
      chatId: "" as string,
    },
  },

  ArtifactInteraction: {
    name: "Artifact Interaction",
    channel: "artifacts",
    properties: {
      type: "" as string,
      action: "expand" as "expand" | "collapse" | "copy" | "share" | "export",
      artifactId: "" as string,
    },
  },

  // Quick Action Events
  QuickActionTriggered: {
    name: "Quick Action Triggered",
    channel: "actions",
    properties: {
      action: "source-intake" as
        | "source-intake"
        | "playbook-run"
        | "assistant-open",
      source: "header" as "header" | "keyboard" | "menu",
    },
  },

  SourceIngested: {
    name: "Source Ingested",
    channel: "ingestion",
    properties: {
      url: "" as string,
      priority: "normal" as "normal" | "high",
      source: "quick-action" as "quick-action" | "modal" | "api",
    },
  },

  PlaybookExecuted: {
    name: "Playbook Executed",
    channel: "playbooks",
    properties: {
      playbookId: "" as string,
      triggerSource: "manual" as "manual" | "scheduled" | "quick-action",
      hasContext: false as boolean,
    },
  },

  // Insights Feed Events
  InsightsFeedViewed: {
    name: "Insights Feed Viewed",
    channel: "insights",
    properties: {
      filters: {
        kind: "" as string,
        tags: [] as string[],
        goals: [] as string[],
      },
      sortBy: "recent" as "recent" | "relevant" | "confidence",
      pageNumber: 0 as number,
    },
  },

  InsightClicked: {
    name: "Insight Clicked",
    channel: "insights",
    properties: {
      insightId: "" as string,
      kind: "insight" as "insight" | "quote" | "action" | "question",
      confidence: 0 as number,
      position: 0 as number,
    },
  },

  InsightLinked: {
    name: "Insight Linked",
    channel: "insights",
    properties: {
      insightId: "" as string,
      linkedTo: "story" as "story" | "insight" | "goal",
      linkedCount: 0 as number,
    },
  },

  // Search Events
  SearchPerformed: {
    name: "Search Performed",
    channel: "search",
    properties: {
      query: "" as string,
      source: "modal" as "modal" | "header" | "inline",
      resultsCount: 0 as number,
      timeToResults: 0 as number,
    },
  },

  // Notification Events
  NotificationReceived: {
    name: "Notification Received",
    channel: "notifications",
    properties: {
      type: "insight" as "insight" | "playbook" | "ingestion" | "trending",
      priority: "high" as "high" | "medium" | "low",
    },
  },

  NotificationClicked: {
    name: "Notification Clicked",
    channel: "notifications",
    properties: {
      notificationId: "" as string,
      type: "" as string,
      ageInMinutes: 0 as number,
    },
  },

  // Performance Events
  PageLoadTime: {
    name: "Page Load Time",
    channel: "performance",
    properties: {
      page: "" as string,
      loadTimeMs: 0 as number,
      bootstrapTimeMs: 0 as number,
      hydrateTimeMs: "number",
    },
  },

  ApiResponseTime: {
    name: "API Response Time",
    channel: "performance",
    properties: {
      endpoint: "string",
      method: "string",
      responseTimeMs: "number",
      statusCode: "number",
    },
  },
};

// Type helpers for event properties
export type ResearchEventName = keyof typeof ResearchEvents;
export type ResearchEventProperties<T extends ResearchEventName> =
  (typeof ResearchEvents)[T]["properties"];

// Context enrichment for all events
export interface EventContext {
  teamId: string;
  userId: string;
  sessionId: string;
  timestamp: string;
  goalContext?: string[];
  subscriptionTier?: "free" | "trial" | "paid";
  deviceType?: "desktop" | "tablet" | "mobile";
  browserInfo?: {
    name: string;
    version: string;
  };
}
