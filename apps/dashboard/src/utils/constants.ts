export const Cookies = {
  PreferredSignInProvider: "preferred-signin-provider",
  StoriesColumns: "stories-columns",
  MfaSetupVisited: "mfa-setup-visited",
  BriefsColumns: "briefs-columns",
  InboxFilter: "inbox-filter-v2",
  TrackingConsent: "tracking-consent",
  InboxOrder: "inbox-order",
  HideConnectFlow: "hide-connect-flow",
  LastProject: "last-project",
  WeeklyCalendar: "weekly-calendar",
  AttentionBudget: "attention-budget",
  PlaybooksView: "playbooks-view",
  SelectedGoals: "selected-goals",
  EntityWatchlist: "entity-watchlist",
};

export const LocalStorageKeys = {
  HighlightLearningToastSeen: "highlight-learning-toast-seen",
  SourceOnboardingComplete: "source-onboarding-complete",
  GoalCaptureComplete: "goal-capture-complete",
  PlaybookTutorialSeen: "playbook-tutorial-seen",
  AttentionBudgetTutorialSeen: "attention-budget-tutorial-seen",
  BYOClaudeSetupSeen: "byo-claude-setup-seen",
};

export const STRINGS = {
  loading: "Loading...",
  loadError: "Unable to load data right now.",
  retry: "Retry",
  openAStory: "Select a story to inspect its details.",
  comingSoon: "We're finishing this experience—thanks for your patience.",
  noHighlights:
    "No highlights confirmed yet. Review your story feed to get started.",
  attentionSaved: "Hours saved this week",
  sourceConnected: "Source connected successfully",
  playbackLaunched: "Playbook launched",
  briefPublished: "Brief published",
  goalNotSet: "Set your goals to get personalized insights",
  entityTracking: "Now tracking this entity",
  benchmarkUpdate: "New benchmark data available",
  signalDetected: "High-value signal detected",
};

// Journey phases from feature mapping
export const JourneyPhases = {
  DISCOVER: "discover",
  TRIAGE: "triage",
  APPLY: "apply",
  PUBLISH: "publish",
} as const;

// Source types for Zeke's ingestion pipeline
export const SourceTypes = {
  RSS: "rss",
  YOUTUBE: "youtube",
  ARXIV: "arxiv",
  PODCAST: "podcast",
  REDDIT: "reddit",
  HN: "hn",
  ARTICLE: "article",
  LOOM: "loom",
  NOTION: "notion",
  NEWSLETTER: "newsletter",
  APPLE_NEWS: "apple_news",
  BYO_CLAUDE: "byo_claude",
} as const;

// Pipeline statuses for source processing
export const PipelineStatus = {
  INGESTING: "ingesting",
  ENRICHING: "enriching",
  ANALYZING: "analyzing",
  COMPLETE: "complete",
  FAILED: "failed",
} as const;

// Story states for team review
export const StoryState = {
  NEW: "new",
  REVIEWED: "reviewed",
  BOOKMARKED: "bookmarked",
  ARCHIVED: "archived",
} as const;

// Highlight confidence levels
export const ConfidenceLevel = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  UNCERTAIN: "uncertain",
} as const;

// Playbook status
export const PlaybookStatus = {
  DRAFT: "draft",
  READY: "ready",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

// Time savings calculations (in minutes)
export const TimeSavings = {
  AVERAGE_READING_SPEED: 250, // words per minute
  AVERAGE_VIDEO_WATCH_MULTIPLIER: 1.5, // videos often watched at 1.5x
  MANUAL_RESEARCH_MULTIPLIER: 10, // 10x time for manual research vs Zeke
} as const;
