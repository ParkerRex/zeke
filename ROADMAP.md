# Zeke Product Roadmap

**Mission**: Give everyone pro-level research & applied-AI skills
**Vision**: From 10 hours � 5 minutes without missing what matters

---

## 💡 Design Principle: AI as Enhancement, Not Dependency

**Question**: How can we use string matching and regex where possible to match things without AI? How would we do this if we didn't have AI?

**Philosophy**:
- **Deterministic First**: Use regex, keyword matching, and rule-based systems for predictable patterns
- **AI for Nuance**: Reserve LLM calls for subjective analysis, semantic understanding, and context-dependent decisions
- **Cost Efficiency**: String operations are ~1000x faster and cheaper than AI API calls
- **Reliability**: Regex patterns don't hallucinate or require API availability

**Examples**:
- ✅ **Use Regex**: Extract version numbers (`v\d+\.\d+\.\d+`), git commit hashes, API endpoint patterns
- ✅ **Use String Matching**: Detect breaking changes via keywords ("BREAKING:", "deprecated", "removed")
- ✅ **Use Rule-Based**: Score urgency by counting exclamation marks, detecting "urgent" keywords
- ❌ **Use AI**: Analyze *why* a change matters, assess business impact, generate summaries

**Implementation Strategy**:
1. Start with regex/string matching for structure detection
2. Use AI only when semantic understanding is required
3. Cache AI results aggressively - never re-analyze the same content
4. Consider hybrid approaches: regex extracts candidates, AI filters for relevance

---

## <� Current State (Workable Prototype)

### What We Have
- - **Engine** - 5 content providers (YouTube, RSS, arXiv, Apple Podcasts, Semantic Scholar)
- **Jobs** - Insight generation, story clustering, playbook execution
- **Dashboard** - Story feeds, highlights, basic notifications (Novu)
- **Database** - Stories, highlights, playbooks, teams schema

### What's Working
- Manual content ingestion via URL
- AI-powered insight extraction (`why_it_matters`, `chili` scoring)
- System-generated highlights from analyzed content
- Basic notification infrastructure (repurposed from Midday)

---

## >� Strategic Architecture Decisions

### 1. User Preferences Philosophy

**For V1 (Workable Prototype):**
- **Hardcoded ICP preferences** - Assume all users are researchers/analysts/devs looking to use AI in their business
- **No user-facing preference UI** - Focus on proving value first
- **Smart defaults** based on manual research:
  - Track: Anthropic RSS, OpenAI blog, arXiv AI categories
  - Keywords: "agent sdk", "extended thinking", "new features", "breaking changes"
  - Highlight types: Code examples, git diffs, API changes, performance metrics

**For V2 (Post-validation):**
- Add preference UI for source tracking
- Collect business goals during onboarding (lightweight, not blocking)
- Build OAuth connections (OpenAI/Claude/Notion/GDrive/Asana) for context

### 2. The Content Flow

```
[Engine]
   � Ingests from tracked sources
[Jobs - Source Monitor]
   � Detects new content
[Jobs - Insight Extraction]
   � Generates "why_it_matters", highlights, git diffs
[Jobs - Story Clustering]
   � Groups related content across sources
[Jobs - Brief Generation]
   � Creates 1-liner, 2-liner, elevator pitch (40 sec read)
[Dashboard]
   � Surfaces brief with time-saved metrics
[Notification]
   � Alerts user via Novu (email/in-app/Slack)
[Playbooks]
   � User applies insights to business goals
```

### 3. Artifacts Hierarchy

```typescript
Brief (40 sec read)
   � Expand
Story (5 min deep-dive)
   � Contains
Highlights (git diffs, code examples, quotes)
   � Powers
Playbooks (actionable next steps)
```

---

## =✅ Phase 1: Automatic Content Discovery (Weeks 1-2) - COMPLETE

**Goal**: Prove the "set it and forget it" value prop
**Status**: ✅ Complete (2025-09-30)
**Commits**: ee8b3b5, 612f591, 3f72792, 63b4d7f, 8320a85

### Week 1: Source Monitoring - ✅ DONE

**Leverage existing architecture:**
- ✅ `sources` table exists
- ✅ `source_connections` for team subscriptions
- ✅ `rawItems` for discovered content
- ✅ Drizzle queries: `packages/db/src/queries/sources.ts`, `raw-items.ts`

**Tasks:**

- [x] **Seed ICP sources** (migration or seed script) ✅
  - Created `packages/jobs/src/config/icp-sources.ts` with 9 sources
  - Created `packages/jobs/scripts/seed-icp-sources.ts` seeding script
  ```typescript
  // packages/db/seed/icp-sources.ts
  const ICP_SOURCES = [
    { type: 'rss', name: 'Anthropic News', url: 'https://www.anthropic.com/news' },
    { type: 'rss', name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml' },
    { type: 'youtube_channel', name: 'Lex Fridman', url: 'https://www.youtube.com/...' },
    // Add to sources table, auto-connect to all teams
  ];
  ```

- [x] **Jobs: Source Monitor Task** ✅
  - Created `packages/jobs/src/tasks/sources/pull/youtube.ts`
  - Created `packages/jobs/src/tasks/sources/ingest/from-youtube.ts`
  - Implemented scheduled YouTube channel monitoring
  ```typescript
  // packages/jobs/src/tasks/sources/monitor-sources.ts
  export const monitorSources = schemaTask({
    id: "monitor-sources",
    run: async () => {
      const sourceQueries = createSourceQueries(db);
      const rawItemQueries = createRawItemQueries(db);

      // Get active sources
      const rssSources = await sourceQueries.getRssSources();

      for (const source of rssSources) {
        // Call engine
        const response = await engineClient.ingest({ url: source.url });

        // Upsert rawItem (dedupes by source_id + external_id)
        await rawItemQueries.upsertRawItem({
          source_id: source.id,
          external_id: response.data.id,
          url: response.data.url,
          title: response.data.title,
          published_at: response.data.publishedAt,
          metadata: response.data.metadata,
        });
      }
    }
  });
  ```

- [ ] **Add to trigger.config.ts** (scheduled cron)
  ```typescript
  schedules: [
    {
      id: "monitor-sources-hourly",
      cron: "0 * * * *",  // Every hour
      task: "monitor-sources",
    },
  ]
  ```

### Week 2: Brief Generation - ✅ DONE

**Leverage existing:**
- ✅ `storyOverlays` table with `why_it_matters`, `citations`
- ✅ `insights/generate.ts` already creates analysis
- ✅ `stories/summarize.ts` creates summaries

**Tasks:**

- [x] **Extend storyOverlays** (Drizzle schema) ✅
  - Added brief_one_liner, brief_two_liner, brief_elevator
  - Added time_saved_seconds, brief_generated_at
  - Migration: `packages/db/migrations/0001_bitter_gauntlet.sql`
  ```typescript
  // packages/db/src/schema.ts - Add to storyOverlays table
  export const storyOverlays = pgTable("story_overlays", {
    // ... existing fields
    why_it_matters: text("why_it_matters"),
    citations: jsonb("citations"),

    // NEW brief fields
    brief_one_liner: text("brief_one_liner"),
    brief_two_liner: text("brief_two_liner"),
    brief_elevator: text("brief_elevator"),
    time_saved_seconds: integer("time_saved_seconds"),
    original_length_minutes: integer("original_length_minutes"),
  });
  ```

- [x] **Jobs: Brief generation** ✅
  - Created `packages/jobs/src/tasks/briefs/generate.ts`
  - Integrated Claude Sonnet 4.5 for 3-variant brief generation
  - Wired into `analyzeStory` pipeline (parallel execution)
  ```typescript
  // packages/jobs/src/tasks/insights/generate.ts
  // Add to existing generateAnalysis() prompt:
  const systemPrompt = `
  Extract insights AND generate briefs:
  1. why_it_matters (existing)
  2. brief_one_liner: <25 words, hook for Twitter
  3. brief_two_liner: <50 words, exec summary
  4. brief_elevator: 150-200 words, 40 sec read
  5. time_saved: original_minutes - 0.7 (40 sec brief)
  `;

  // Store in storyOverlay via existing upsertStoryOverlay()
  ```

- [ ] **Dashboard: Brief Card Component**
  ```typescript
  // apps/dashboard/src/components/story-card-brief.tsx
  <Card>
    <Badge>New • 2 hours ago</Badge>
    <h3>{brief.one_liner}</h3>
    <p className="text-muted">{brief.two_liner}</p>
    <div className="flex justify-between">
      <span>Read brief: 40 sec</span>
      <span className="text-muted">vs {originalMinutes} min</span>
    </div>
    <Button onClick={expandStory}>Read full story →</Button>
  </Card>
  ```

---

## =✅ Phase 2: Personalized Highlights (Weeks 3-4) - COMPLETE

**Goal**: Surface the exact details users care about (like manual highlights)
**Status**: ✅ Complete (2025-09-30)
**Commits**: 3f72792, 63b4d7f, 8320a85

### Week 3: Enhanced Insight Extraction - ✅ DONE

**Leverage existing:**
- ✅ `highlights` table with `kind` enum (insight, quote, action, question)
- ✅ `packages/db/src/queries/highlights.ts` - CRUD operations
- ✅ Highlight extraction in `insights/generate.ts`

**Tasks:**

- [x] **Extend highlight kinds** (Drizzle enum) ✅
  - Added code_example, code_change, api_change, metric to enum
  - Migration applied successfully
  ```typescript
  // packages/db/src/schema.ts
  export const highlightKind = pgEnum("highlight_kind", [
    "insight",     // existing
    "quote",       // existing
    "action",      // existing
    "question",    // existing
    "code_example", // NEW - code snippets
    "code_change",  // NEW - git diffs
    "api_change",   // NEW - API updates
    "metric",       // NEW - performance numbers
  ]);
  ```

- [x] **Jobs: Enhanced extraction** ✅
  - Created `packages/jobs/src/tasks/insights/extract-structured.ts`
  - Created `packages/jobs/src/tasks/insights/extract-highlights.ts`
  - Pattern-based extraction (regex, no ML needed)
  ```typescript
  // packages/jobs/src/tasks/insights/helpers.ts
  function extractStructuredHighlights(content: string) {
    return {
      codeExamples: extractCodeBlocks(content),
      apiChanges: extractAPIChanges(content),
      metrics: extractNumbers(content),
      // Store each as separate highlight with appropriate kind
    };
  }
  ```

- [ ] **Notification Types** (extend existing)
  ```typescript
  // packages/notifications/src/notification-types.ts
  export const researchNotificationTypes = [
    {
      type: "new_content_brief",
      channels: ["in_app", "email"],
      category: "research",
      showInSettings: true,
    },
    {
      type: "breaking_change_detected",
      channels: ["in_app", "email", "slack"],
      category: "research",
      showInSettings: true,
      order: 1,
    },
  ];
  // Merge into allNotificationTypes array
  ```

### Week 4: Smart Relevance Scoring - ✅ DONE

**Dashboard Integration**: ✅ DONE
- Added `getPrioritizedHighlights()` and `getHighlightsByKind()` query helpers
- Added tRPC procedures: `highlight.prioritized` and `highlight.byKind`
- Created React hooks: `usePrioritizedHighlights()`, `useHighlightsByKind()`
- Wired into `/insights` page with relevance score display

**Leverage existing:**
- ✅ `sources.authority_score` field exists
- ✅ `highlights.metadata` for storing scores
- ✅ Embedding-based similarity in `storyEmbeddings`

**Tasks:**

- [x] **Add relevance scoring to highlights** ✅
  - Created `packages/jobs/src/tasks/insights/score-relevance.ts`
  - Algorithm: 40% keyword + 30% kind + 20% authority + 10% freshness
  - Wired into pipeline with 2s delay after extraction
  ```typescript
  // packages/jobs/src/tasks/insights/score-relevance.ts
  export const scoreHighlights = schemaTask({
    id: "score-highlights",
    run: async ({ storyId }) => {
      const highlights = await getHighlightsByStory(storyId);

      for (const highlight of highlights) {
        const score = calculateRelevance({
          kind: highlight.kind,
          keywords: ICP_KEYWORDS, // hardcoded
          sourceAuthority: highlight.story.source.authority_score,
          freshness: daysSincePublished(highlight.story.published_at),
        });

        // Update highlight metadata
        await updateHighlightMetadata(highlight.id, { relevance_score: score });
      }
    }
  });

  const ICP_KEYWORDS = ['agent', 'sdk', 'api', 'breaking', 'extended thinking'];
  ```

- [ ] **Dashboard: Priority Feed Query**
  ```typescript
  // packages/db/src/queries/highlights.ts - add method
  async getPrioritizedHighlights(teamId: string) {
    return db
      .select()
      .from(highlights)
      .innerJoin(stories, eq(highlights.story_id, stories.id))
      .where(eq(teamStoryStates.team_id, teamId))
      .orderBy(
        sql`(${highlights.metadata}->>'relevance_score')::float DESC`,
        desc(stories.published_at)
      );
  }
  ```

---

## =🔧 Phase 2.5: OpenAI Responses API Migration & 3-Column Research UI (Current Sprint)

**Goal**: Complete OpenAI migration + Build the core research interface (wireframe vision)
**Status**: 🚧 In Progress (2025-09-30)
**Priority**: CRITICAL - This is the foundation for the product vision

### Authentication & Onboarding Setup - ✅ COMPLETE

**Priority**: HIGH - Required for production launch

**Tasks:**

- [x] **Setup OAuth Providers**
  - [x] Configure Apple Sign In (Apple Developer Console)
  - [x] Configure GitHub OAuth (GitHub App settings)
  - [x] Configure Google OAuth (Google Cloud Console)
  - [x] Update environment variables with client IDs/secrets
  - [x] Test OAuth flows in dashboard

- [x] **Setup OTP (One-Time Password) Authentication**
  - [x] Configure email-based OTP system
  - [x] Setup SMS OTP provider (optional fallback)
  - [x] Implement OTP verification UI
  - [x] Add rate limiting for OTP requests

- [x] **Transactional Email System**
  - [x] Setup email service provider (Resend/SendGrid/AWS SES)
  - [x] Design email templates:
    - [x] Welcome email (post-signup)
    - [x] OTP verification code
    - [x] Password reset
    - [x] Magic link authentication
    - [x] New brief notification
    - [x] Breaking change alert
  - [x] Configure email sending infrastructure
  - [x] Test email delivery and rendering
  - [x] Add unsubscribe management

### Backend: Fix OpenAI Responses API Integration - ✅ COMPLETE

**Status**: ✅ Complete (2025-09-30)

**What We Fixed:**
- ✅ `analyze-story` works perfectly with `responses.parse()` for structured JSON
- ✅ `generate-brief` now works with Responses API (removed incompatible parameters)
- ✅ Complete ingestion pipeline validated end-to-end
- Root cause: OpenAI Responses API parameter incompatibilities with gpt-5-nano model

**Tasks:**

- [x] **Convert generateAnalysis to OpenAI Responses API** ✅
  - Successfully using `client.openai.responses.parse()` with JSON schema
  - Validated with 2 successful test runs (13.4s and 10.1s)
  - File: `packages/jobs/src/utils/openai/generateAnalysis.ts:52-96`

- [x] **Fix OpenAI Responses API parameter format** ✅
  - Changed `response_format` root parameter to `text.format` nested structure
  - File: `packages/jobs/src/utils/openai/generateAnalysis.ts:58-93`
  - Fixed for OpenAI Responses API breaking change

- [x] **Remove max_tokens parameter** ✅
  - Removed `max_tokens` from generate-brief task (not supported in Responses API)
  - File: `packages/jobs/src/tasks/briefs/generate.ts:89-98`

- [x] **Remove temperature parameter for gpt-5-nano** ✅
  - Removed `temperature: 0.7` from generate-brief (not supported by gpt-5-nano)
  - File: `packages/jobs/src/tasks/briefs/generate.ts:89-98`

- [x] **Validate complete pipeline with test story** ✅
  - Triggered full ingest → fetch → analyze → brief → highlights → score
  - All tasks completed successfully:
    - ingest-oneoff: 334ms
    - fetch-content: 760ms
    - analyze-story: 2s
    - generate-brief: 13.2s
    - extract-highlights: 52ms
    - score-relevance: 31ms
  - Verified complete pipeline works with gpt-5-nano model

### Frontend: 3-Column Research Interface (Wireframe Implementation)

**Vision** (from wire-updated.png and wireframe.png):
```
┌─────────────┬──────────────────────────────────┬────────────────┐
│   STORIES   │        SOURCE VIEWER             │  CHAT ASSIST   │
│  (briefing) │    (with AI highlights)          │   (context)    │
├─────────────┼──────────────────────────────────┼────────────────┤
│             │                                  │                │
│ • Story 1   │  [Article/Video Content]        │  Chat with     │
│   One-liner │                                  │  assistant     │
│   Badge     │  ╔══════════════════════════╗   │  about this    │
│             │  ║ HIGHLIGHT: Code Example ║   │  story         │
│ • Story 2   │  ╚══════════════════════════╝   │                │
│   One-liner │                                  │  > Ask about   │
│             │  More content...                 │    breaking    │
│ • Story 3   │                                  │    changes     │
│             │  ╔══════════════════════════╗   │                │
│             │  ║ HIGHLIGHT: API Change   ║   │                │
│             │  ╚══════════════════════════╝   │                │
└─────────────┴──────────────────────────────────┴────────────────┘
```

**Components to Build:**

- [ ] **LEFT: Story Feed Sidebar**
  - File: `apps/dashboard/src/components/research/story-feed-sidebar.tsx`
  - Shows stories with:
    - `brief_one_liner` (title/hook)
    - `brief_two_liner` (preview on hover)
    - Time saved badge ("Saved 3m 20s")
    - Publication time ("2h ago")
    - Source icon (Anthropic/OpenAI/etc)
  - State: Selected story ID
  - Click → Load story content in CENTER panel

- [ ] **CENTER: Source Content Viewer with Highlight Overlay**
  - File: `apps/dashboard/src/components/research/content-viewer.tsx`
  - Displays:
    - Original article HTML/text (from `contents.text_body`)
    - OR video player with transcript (from `contents.transcript_vtt`)
    - OR PDF viewer (from `contents.pdf_url`)
  - Highlight overlay:
    - Parse `highlights.quote` to find text position in content
    - Render colored overlays (yellow=insight, green=code, red=breaking)
    - Hover highlight → Show `highlight.summary` in tooltip
    - Click highlight → Expand details in sidebar or modal
  - File: `apps/dashboard/src/components/research/highlight-overlay.tsx`

- [ ] **RIGHT: Chat Assistant Panel**
  - File: `apps/dashboard/src/components/research/chat-panel.tsx`
  - Reuse existing `<Chat />` component from `apps/dashboard/src/components/chat/index.tsx`
  - Context: Current selected story
  - Pre-filled suggestions:
    - "Explain this code example"
    - "What are the breaking changes?"
    - "How does this affect my project?"
    - "Create a brief for my team"

- [ ] **Layout Container: 3-Column Grid**
  - File: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/research/page.tsx`
  - Replace current Overview (chat-centric) with research layout
  - Responsive: Mobile stacks vertically, desktop shows 3 columns
  - State management: Zustand store or URL params for selected story

- [ ] **Brief Expansion Panel**
  - File: `apps/dashboard/src/components/research/brief-panel.tsx`
  - Shows `brief_elevator` (40-sec read)
  - "Read full story" → Expands CENTER panel
  - Time saved counter: `time_saved_seconds` from overlay

**State Management:**

- [ ] **Create Research Store**
  - File: `apps/dashboard/src/store/research.ts`
  - State:
    ```typescript
    {
      selectedStoryId: string | null;
      viewMode: 'brief' | 'full' | 'highlights';
      chatContext: StoryContext | null;
    }
    ```
  - Actions:
    - `selectStory(storyId)`
    - `toggleViewMode()`
    - `updateChatContext(story, highlights)`

**tRPC Queries Needed:**

- [ ] **Story with full data**
  - File: `apps/api/src/trpc/routers/stories.ts`
  - Procedure: `stories.getWithContent`
  - Returns:
    ```typescript
    {
      story: Story;
      overlay: StoryOverlay; // brief fields
      content: Content; // text_body, html_url, etc
      highlights: Highlight[]; // with kind, quote, summary
    }
    ```

- [ ] **Recent stories for feed**
  - Procedure: `stories.getRecent`
  - Returns: Story[] with brief_one_liner, brief_two_liner, time_saved

**Design System Components:**

- [ ] **HighlightBadge** - Color-coded by kind (code_example, api_change, etc)
- [ ] **TimeSavedBadge** - Shows "Saved 3m 20s" with icon
- [ ] **SourceIcon** - Logo for Anthropic/OpenAI/arXiv/etc
- [ ] **BriefCard** - Story card with one-liner and hover preview

### Testing & Validation

- [ ] **Create test data generator script**
  - File: `packages/jobs/scripts/generate-test-stories.ts`
  - Ingest 5 diverse URLs (blog, video, arxiv, podcast)
  - Validate all have briefs + highlights

- [ ] **Manual QA Checklist**
  - [ ] Story list loads with briefs
  - [ ] Clicking story loads content in center
  - [ ] Highlights render as overlays on content
  - [ ] Hover highlight shows tooltip
  - [ ] Click highlight opens detail
  - [ ] Chat assistant responds with story context
  - [ ] Time saved badges display correctly
  - [ ] Responsive layout works on mobile

---

## =� Phase 3: Story Clustering & Timeline (Week 5)

**Goal**: Connect the dots across multiple sources


### Week 5: Multi-Source Stories

**Leverage existing:**
- ✅ `storyClusters` table already exists! (id, title, description, metadata)
- ✅ `stories.cluster_id` foreign key for linking stories
- ✅ `storyEmbeddings` table for semantic similarity
- ✅ `packages/db/src/queries/stories.ts` - story operations

**Tasks:**

- [ ] **Jobs: Story Linker** (enhance existing clustering)
  ```typescript
  // packages/jobs/src/tasks/stories/cluster-stories.ts
  export const clusterRelatedStories = schemaTask({
    id: "cluster-related-stories",
    run: async ({ storyId }) => {
      const story = await getStoryWithEmbedding(storyId);

      // Find related stories using existing embedding similarity
      const relatedStories = await db
        .select()
        .from(stories)
        .innerJoin(storyEmbeddings, eq(stories.id, storyEmbeddings.story_id))
        .where(
          and(
            ne(stories.id, storyId),
            sql`cosine_similarity(${storyEmbeddings.embedding}, ${story.embedding}) > 0.85`,
            sql`${stories.published_at} - ${story.published_at} < INTERVAL '48 hours'`
          )
        );

      // Create or update cluster
      if (relatedStories.length > 0) {
        const cluster = await createOrUpdateCluster({
          title: generateClusterTitle(story, relatedStories),
          storyIds: [story.id, ...relatedStories.map(s => s.id)],
        });
      }
    }
  });
  ```

- [ ] **Jobs: Timeline Builder**
  ```typescript
  // packages/jobs/src/tasks/stories/build-timeline.ts
  export const buildStoryTimeline = schemaTask({
    id: "build-story-timeline",
    run: async ({ clusterId }) => {
      // Get all stories in cluster, ordered by published_at
      const stories = await db
        .select()
        .from(stories)
        .where(eq(stories.cluster_id, clusterId))
        .orderBy(asc(stories.published_at));

      // Update cluster metadata with timeline
      await db
        .update(storyClusters)
        .set({
          metadata: {
            timeline: stories.map(s => ({
              date: s.published_at,
              source: s.source_id,
              highlights: s.highlights.slice(0, 3),
              is_first_mention: s.id === stories[0].id,
            })),
          },
        })
        .where(eq(storyClusters.id, clusterId));
    }
  });
  ```

- [ ] **Dashboard: Story Timeline View**
  ```typescript
  // packages/db/src/queries/stories.ts - add method
  async getClusterTimeline(clusterId: string) {
    return db
      .select({
        date: stories.published_at,
        title: stories.title,
        source: sources.name,
        highlights: highlights.content,
      })
      .from(stories)
      .innerJoin(sources, eq(stories.source_id, sources.id))
      .leftJoin(highlights, eq(highlights.story_id, stories.id))
      .where(eq(stories.cluster_id, clusterId))
      .orderBy(asc(stories.published_at));
  }
  ```

---

## =� Phase 4: Playbooks & Applied AI (Weeks 6-8)

**Goal**: Turn insights into actionable business outcomes

### Week 6: Goal Schema

**Leverage existing:**
- ✅ `team_goals` table exists! (customers.id, title, success_metrics, doc_refs)
- ✅ Already have goal structure, just needs story linking

**Tasks:**

- [ ] **Add goal-story linking table** (Drizzle schema)
  ```typescript
  // packages/db/src/schema.ts
  export const goalStoryMatches = pgTable("goal_story_matches", {
    id: uuid("id").primaryKey().defaultRandom(),
    goal_id: uuid("goal_id")
      .notNull()
      .references(() => teamGoals.id, { onDelete: "cascade" }),
    story_id: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    relevance_score: numeric("relevance_score", { precision: 3, scale: 2 }),
    matched_at: timestamp("matched_at").defaultNow(),
  }, (table) => [
    uniqueIndex("goal_story_unique").using("btree", table.goal_id, table.story_id),
    index("goal_story_score_idx").using("btree", table.relevance_score),
  ]);
  ```

- [ ] **Jobs: Goal Matcher**
  ```typescript
  // packages/jobs/src/tasks/goals/match-stories.ts
  export const matchStoriesToGoals = schemaTask({
    id: "match-stories-to-goals",
    run: async ({ storyId }) => {
      const story = await getStoryWithHighlights(storyId);
      const goals = await getActiveGoals(); // from team_goals

      for (const goal of goals) {
        const score = calculateGoalRelevance({
          storyTitle: story.title,
          storyHighlights: story.highlights,
          goalTitle: goal.title,
          goalKeywords: extractKeywords(goal.description),
        });

        if (score > 0.7) {
          await insertGoalStoryMatch(goal.id, story.id, score);
          // Notify: "New story matches your goal: {goal.title}"
        }
      }
    }
  });
  ```

### Week 7: Playbook Templates
- [ ] **Hardcode Playbook Templates** for ICP
  ```typescript
  const PLAYBOOK_TEMPLATES = [
    {
      name: "Evaluate New AI Feature",
      steps: [
        "Read brief (40 sec)",
        "Review code examples",
        "Check breaking changes",
        "Test in sandbox",
        "Document decision",
      ],
      output: "Go/no-go recommendation with rationale"
    },
    {
      name: "Ship Integration",
      steps: [
        "Extract API endpoints from docs",
        "Review rate limits",
        "Generate starter code",
        "Plan error handling",
        "Create migration checklist",
      ],
      output: "Implementation PRD"
    },
  ];
  ```

- [ ] **Jobs: Playbook Instantiation**
  ```typescript
  // When user clicks "Apply to goal"
  //   1. Copy template
  //   2. Pre-fill with story highlights
  //   3. Generate context-aware next steps
  ```

### Week 8: OAuth Context (Foundation)

**Leverage existing:**
- ✅ Check if oauth connections already exist in schema
- ✅ Existing OAuth patterns in `apps/api/src/utils/oauth.ts`

**Tasks:**

- [ ] **Schema: OAuth Connections** (Drizzle)
  ```typescript
  // packages/db/src/schema.ts
  export const oauthConnections = pgTable("oauth_connections", {
    id: uuid("id").primaryKey().defaultRandom(),
    team_id: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // 'notion', 'gdrive', 'asana', 'openai'
    access_token_encrypted: text("access_token_encrypted").notNull(),
    refresh_token_encrypted: text("refresh_token_encrypted"),
    scopes: text("scopes").array(),
    metadata: jsonb("metadata"), // provider-specific data
    connected_at: timestamp("connected_at").defaultNow(),
    expires_at: timestamp("expires_at"),
  }, (table) => [
    uniqueIndex("team_provider_unique").using("btree", table.team_id, table.provider),
  ]);
  ```

- [ ] **Query helpers**
  ```typescript
  // packages/db/src/queries/oauth.ts
  async function getActiveConnection(teamId: string, provider: string) {
    return db
      .select()
      .from(oauthConnections)
      .where(
        and(
          eq(oauthConnections.team_id, teamId),
          eq(oauthConnections.provider, provider),
          gt(oauthConnections.expires_at, new Date())
        )
      )
      .limit(1);
  }
  ```

- [ ] **Future**: Pull context from connected tools
  - Notion: Existing docs, SOPs
  - GitHub: Current codebase, tech stack
  - Asana: Active projects, sprint goals

---

## =� Phase 5: Content Creation (Weeks 9-10)

**Goal**: Publish cited content from research

### Week 9: Brief � Content Templates
- [ ] **Jobs: Content Generator**
  ```typescript
  // Templates:
  //   - Twitter thread (8-12 tweets)
  //   - LinkedIn post (professional tone)
  //   - Internal brief (team update)
  //   - Email to customers (product update)
  // All with inline citations back to sources
  ```

### Week 10: Export & Publishing
- [ ] **Dashboard: Export UI**
  - Copy to clipboard
  - Export as Markdown
  - Send to Slack channel
  - (Future) Publish to CMS, newsletter tools

---

## <� UX Principles

### First-Time User Experience
1. **No setup required** - Immediately show hardcoded ICP content
2. **Instant value** - Show brief for latest Anthropic/OpenAI updates
3. **Time-saved metric** - "You just saved 3 hours by reading this 40-sec brief"
4. **Expand to deep-dive** - Click to see full story with highlights
5. **Gentle goal prompt** - After 3 briefs read: "What are you building? (optional)"

### Core Metrics Dashboard
```
This Month:
  127 briefs delivered
  47 hours saved
  23 stories clustered
  5 playbooks created
```

### Notification Strategy
- **Instant**: Breaking changes, high-relevance new features (Slack + email)
- **Daily Digest**: Summary of new briefs (email)
- **Weekly Roundup**: Top stories, trends, recommended playbooks (email)

---

## =' Technical Debt to Address

### Notifications (Repurpose Midday)
- [ ] Clean up unused notification types (invoices, transactions, inbox)
- [ ] Add research-specific notification templates
- [ ] Test Slack webhook integration
- [ ] Add notification preference UI (per-type enable/disable)

### Schema Migrations
- [ ] Audit unused Midday tables (customers, transactions, invoices)
- [ ] Mark as deprecated or remove if truly unused
- [ ] Add indexes for story/highlight queries (performance)

### Jobs Infrastructure
- [ ] Set up recurring cron for source monitoring
- [ ] Add job failure alerts
- [ ] Build admin dashboard to view job runs

---

## <� Success Metrics (Phase 1-3)

### User Engagement
- **Weekly Active Users**: % who read at least 1 brief/week
- **Time Saved**: Sum of (original_length - brief_read_time)
- **Expansion Rate**: % who click "Read full story" after brief
- **Highlight Value**: % of highlights that get clicked/copied

### Content Pipeline
- **Ingestion Rate**: New content items/day
- **Processing Time**: URL � Brief ready (target: <5 min)
- **Clustering Accuracy**: % of stories correctly grouped
- **Notification Accuracy**: % of notifications marked relevant by user

### Business
- **Trial � Paid**: Conversion rate
- **Goal Completion**: % of users who define at least 1 goal
- **Playbook Usage**: % of briefs converted to playbooks

---

## =� Future Vision (Phase 6+)

### Advanced Personalization
- **Learning user preferences** from clicks, saves, shares
- **Dynamic keyword extraction** from goals
- **Team-level playbook library** (share & reuse)

### Platform Expansion
- **API/SDK** for embedding Zeke in other tools
- **Browser extension** (summarize & apply in-context)
- **Mobile app** (daily digest, push notifications)

### Data Products
- **Trend Reports**: "AI agents mentions up 300% this quarter"
- **Hype vs Reality Index**: Track announcements � actual adoption
- **Research Graph**: Entity/claim graph across people, labs, models

---

## >� North Star Metrics

1. **Time Saved per User per Month** - The core value prop
2. **Briefs Read per Week** - Engagement proxy
3. **Playbooks Created from Briefs** - Applied AI success
4. **Net Promoter Score** - "Would you recommend Zeke?"

---


## =� Implementation Notes

### Existing Assets to Leverage
- ✅ **Database tables already exist!** - `sources`, `rawItems`, `stories`, `storyClusters`, `highlights`, `teamGoals`
- ✅ **Drizzle queries ready** - `packages/db/src/queries/sources.ts`, `raw-items.ts`, `stories.ts`, `highlights.ts`
- ✅ **Jobs infrastructure** - `packages/jobs/src/tasks/insights/generate.ts`, `stories/summarize.ts`
- ✅ **Notification system** - `packages/notifications` with Novu integration ready
- ✅ **OAuth patterns** - `apps/api/src/utils/oauth.ts` for future integrations

### Key Pattern: Extend, Don't Create
- **Don't create new tables** - Extend existing ones with Drizzle migrations
- **Don't write SQL** - Use Drizzle's pgTable() and query builders
- **Don't reinvent queries** - Follow patterns in existing query files
- **Example**: Extend `storyOverlays` for briefs, extend `highlightKind` enum for code highlights

### Quick Wins (Ordered by Value)
1. **Week 1: Source monitoring job** - Use existing `sources`/`rawItems` tables + Engine API
2. **Week 2: Brief generation** - Extend `storyOverlays.why_it_matters` to brief fields
3. **Week 3: Enhanced highlights** - Extend `highlightKind` enum (code_example, code_change, api_change)
4. **Week 4: Relevance scoring** - Use existing `highlights.metadata` jsonb field
5. **Week 6: Goal linking** - `team_goals` exists! Just add linking table

### Avoid Scope Creep
- ⚠️ Don't build preference UI until we prove value with hardcoded ICP
- ⚠️ Don't build OAuth until users explicitly request specific integrations
- ⚠️ Don't build content publishing until playbooks generate adoption
- ✅ **Focus on**: Engine → Jobs → Briefs → Notifications → Dashboard

---

**Last Updated**: 2025-09-30
