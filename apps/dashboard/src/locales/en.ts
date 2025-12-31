// en.ts
export default {
  navigation: {
    today: "Today",
    sources: "Sources",
    stories: "Stories",
    insights: "Insights",
    briefs: "Briefs",
    playbooks: "Playbooks",
    watchlists: "Watchlists",
    settings: {
      root: "Settings",
      workspace: "Workspace",
      team: "Team",
      notifications: "Notifications",
      developer: "Developer",
    },
  },
  status: {
    loading: "Loading…",
    loadError: "Unable to load data right now.",
    retry: "Retry",
    comingSoon: "We're finishing this experience—thanks for your patience.",
    openStory: "Select a story to inspect its details.",
  },
  today: {
    title: "Today's Top Stories",
    description: "Today's top AI and tech stories with contextual insights.",
  },
  stories: {
    title: "Stories",
    description:
      "Browse AI-powered news stories with contextual insights and summaries.",
    discoverHeading: "Discover stories",
    searchPlaceholder: "Search stories (title or URL)…",
    filter: {
      all: "All",
      youtube: "YouTube",
      arxiv: "arXiv",
      podcast: "Podcast",
      reddit: "Reddit",
      hn: "HN",
      article: "Article",
    },
    loadMore: "Load More",
    showingCount: "Showing {shown} of {total} stories",
    personalizedTitle: "Personalized News Feed",
    gatedTitle:
      "Sign up to unlock access to the Personalized News Feed and much more",
    signupCta: "Sign Up",
    settingsAria: "Settings",
  },
  news: {
    topTitle: "Top News",
    latestTitle: "Latest News",
    showMore: "Show More",
    hypeScore: "Hype score",
    hypeLabel: "Hype",
    coverage: "{value}% {label} coverage",
    coverageLabel: "left",
    sources: {
      one: "{count} source",
      other: "{count} sources",
    },
    timeAgo: "{time} ago",
    chiliAria: "spiciness",
  },
  watchlists: {
    header: "Watchlists",
    empty: "Create a list of entities to follow. Coming soon.",
  },
  insights: {
    header: "Insights",
    intro1:
      "Insight review will live here—surfacing highlights, linking them back to supporting sources, and queuing any follow-up tasks. The data contracts are in place, and the dashboard will light up once the new Trigger.dev insight tasks finish landing.",
    intro2:
      "Until then, this space reminds us that stories flow into insights, and the UI will reflect Zeke's research-focused vocabulary.",
  },
  sources: {
    header: "Sources",
    intro1:
      "This is where teams will connect RSS feeds, newsletters, research hubs, and other inputs for the ingestion pipeline. We're still wiring the new Trigger.dev tasks and Cloudflare worker routes, so the UI is a placeholder for now.",
    intro2:
      "As soon as the provider onboarding flow lands, you'll be able to add sources here and watch ZEKE collect, normalize, and route stories through the new job system.",
  },
  briefs: {
    header: "Briefs",
    intro1:
      "Playbooks and summaries will output into briefs—structured packets that teams can share or export. We're still wiring the reporting pipelines, so consider this a placeholder while the new story → insight → brief workflow takes shape.",
  },
  playbooks: {
    header: "Playbooks",
    intro1:
      "Playbooks will let you string together Trigger.dev tasks—collecting sources, generating insights, and publishing briefs on a schedule. The UI will land once the new job orchestration is stable; for now we're keeping a placeholder while the workflow takes shape.",
  },
  overlay: {
    whyItMatters: "Why it matters",
    hype: "Hype",
    confidence: "confidence",
    sources: "Sources",
    share: "Share",
  },
  tabs: {
    one: "Closed {count} tab",
    other: "Closed {count} tabs",
    undo: "Undo",
  },
  support: {
    success: "Support ticket sent.",
    error: "Something went wrong please try again.",
    subjectLabel: "Subject",
    subjectPlaceholder: "Summary of the problem you have",
    areaLabel: "Area",
    areaPlaceholder: "Select area",
    areas: {
      stories: "Stories",
      insights: "Insights",
      watchlists: "Watchlists",
      sources: "Sources",
      briefs: "Briefs",
      playbooks: "Playbooks",
      integrations: "Integrations",
      general: "General",
    },
    severityLabel: "Severity",
    severityPlaceholder: "Select severity",
    severities: {
      low: "Low",
      normal: "Normal",
      high: "High",
      urgent: "Urgent",
    },
    messageLabel: "Message",
    messagePlaceholder:
      "Describe the issue you're facing, along with any relevant information. Please be as detailed and specific as possible.",
    submit: "Submit",
  },
  feedback: {
    trigger: "Feedback",
    thanksTitle: "Thank you for your feedback!",
    thanksBody: "We will be back with you as soon as possible",
    textareaPlaceholder:
      "Ideas to improve this page or issues you are experiencing.",
    send: "Send",
  },
};
