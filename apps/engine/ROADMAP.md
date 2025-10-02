# Engine Categorization Roadmap

## Vision: Multi-Dimensional Content Taxonomy

Research content needs **multi-dimensional classification**, not hierarchical finance categories. Content can be simultaneously:
- **Domain**: AI/ML → LLMs → Prompt Engineering
- **Format**: Tutorial, Case Study, Research Paper, Product Update
- **Audience**: Developer, Product Manager, Founder, Researcher
- **Intent**: Learn, Implement, Evaluate, Monitor
- **Highlight Kind**: code_change, api_change, metric, quote

---

## Current State

### ✅ What Works
- **Pattern-based extraction**: Regex for code blocks, git diffs, API endpoints (sub-100ms, zero cost)
- **Scoring algorithm**: 40-30-20-10 weighting (keyword-kind-authority-freshness)
- **Database schema**: `story_categories` (controlled vocab) + `story_tags` (folksonomy)
- **Provider metadata**: YouTube categories, arXiv classifications, RSS topics

### 🚧 What Needs Improvement
- **Hardcoded ICP_KEYWORDS**: Should be team-configurable domain taxonomy
- **No domain classification**: Engine returns raw metadata, no semantic hints
- **Mixed query patterns**: API conflates semantic (domain) with temporal (trending)
- **Underutilized schema**: `story_categories` table exists but isn't populated

### 🗑️ What's Being Removed
- **`@zeke/categories` package**: Finance-oriented (Revenue, COGS, Tax Rates) - 100% irrelevant

---

## The Architecture

```
┌─────────────────────────────────────────────────────────┐
│ ENGINE (Cloudflare Worker) - THIS LAYER                 │
│                                                          │
│ YouTube → Extract metadata → Suggest domains            │
│ arXiv   → Parse categories  → Map to taxonomy           │
│ RSS     → Analyze content   → Infer topics              │
│                                                          │
│ Output: ContentItem + suggestedCategories               │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ JOBS (Trigger.dev)                                      │
│                                                          │
│ 1. Extract highlights (code_change, api_change, etc.)   │
│ 2. Score relevance (40-30-20-10 algorithm)             │
│ 3. Auto-categorize (domain matching via embeddings)    │
│ 4. Generate tags (AI-extracted topics)                 │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ DATABASE                                                │
│                                                          │
│ stories → story_category_links → story_categories       │
│        └→ story_tags (folksonomy)                       │
│        └→ highlights (with kind + relevance_score)      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ API (TRPC)                                              │
│                                                          │
│ • stories.byDomain({ domain, subdomain })               │
│ • stories.byTag({ tag })                                │
│ • stories.trending() [time-based]                       │
│ • stories.signals() [pinned]                            │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation (Engine Layer)

### Goal: Enhance providers to suggest categories from metadata

#### 1.1 Update Type Definitions

**File**: `src/providers/types.ts`

Add to `ContentItem` interface:
```typescript
interface ContentItem {
  // ... existing fields
  domains?: string[];        // ["ai", "developer-tools", "productivity"]
  suggestedCategories?: {
    fields: string[];        // ["machine-learning", "nlp"]
    format: ContentFormat;
    audience: string[];      // ["developers", "ml-engineers"]
  };
}

type ContentFormat =
  | "tutorial"
  | "case-study"
  | "paper"
  | "product-update"
  | "news"
  | "documentation";
```

#### 1.2 YouTube Provider Enhancement

**File**: `src/providers/youtube/transform.ts`

**What to add**:
- Map YouTube `categoryId` to domains:
  - 28 (Science & Tech) → ["technology"]
  - 27 (Education) → ["education", "tutorial"]
- Parse channel name for authority hints:
  - "Anthropic" → high authority on "ai", "claude"
  - "Google Cloud" → authority on "cloud", "infrastructure"
- Extract keywords from video description
- Detect format from title patterns:
  - "Tutorial:", "How to" → tutorial
  - "Case Study:", "How We Built" → case-study
  - "Introducing", "Announcing" → product-update

**Expected output**:
```typescript
{
  // ... existing ContentItem fields
  domains: ["ai", "developer-tools"],
  suggestedCategories: {
    fields: ["llm", "prompt-engineering"],
    format: "tutorial",
    audience: ["developers"]
  }
}
```

#### 1.3 arXiv Provider Enhancement

**File**: `src/providers/arxiv/transform.ts`

**What to add**:
- Parse arXiv categories (they're perfect for this!):
  - `cs.AI` → ["ai", "computer-science"]
  - `cs.CL` → ["nlp", "computational-linguistics"]
  - `cs.SE` → ["software-engineering"]
- Map MSC codes if present
- Extract primary subject as domain
- Format is always "paper"
- Infer audience from category:
  - cs.* → ["researchers", "developers"]
  - math.* → ["researchers", "mathematicians"]

**Expected output**:
```typescript
{
  // ... existing ContentItem fields
  domains: ["ai", "nlp"],
  suggestedCategories: {
    fields: ["transformers", "attention-mechanisms"],
    format: "paper",
    audience: ["researchers", "ml-engineers"]
  }
}
```

#### 1.4 RSS Provider Enhancement

**File**: `src/providers/rss/transform.ts`

**What to add**:
- Extract `<category>` tags from RSS feed
- Parse domain from feed URL:
  - techcrunch.com → ["business", "startups"]
  - anthropic.com/news → ["ai", "product-updates"]
- Detect format from article structure:
  - Has code blocks → "tutorial"
  - Has "Interview with" → "interview"
  - Short post → "news"

**Expected output**:
```typescript
{
  // ... existing ContentItem fields
  domains: ["ai", "business"],
  suggestedCategories: {
    fields: ["startups", "funding"],
    format: "news",
    audience: ["founders", "investors"]
  }
}
```

#### 1.5 Apple Podcasts Provider Enhancement

**File**: `src/providers/apple-podcasts/transform.ts`

**What to add**:
- Use iTunes genre categories
- Parse show description for topics
- Extract guest names for context
- Format is always "podcast"

#### 1.6 Semantic Scholar Provider Enhancement

**File**: `src/providers/semantic-scholar/transform.ts`

**What to add**:
- Use `fieldsOfStudy` from API response (perfect taxonomy!)
- Extract venue/conference for domain hints:
  - "NeurIPS" → ["machine-learning", "ai"]
  - "SIGMOD" → ["databases"]
- Format is "paper"
- Audience is "researchers"

---

## Phase 2: Taxonomy Configuration

### Goal: Replace hardcoded ICP_KEYWORDS with flexible domain taxonomy

#### 2.1 Create Taxonomy Package

**New file**: `packages/taxonomy/src/index.ts`

```typescript
interface Domain {
  slug: string;              // "ai-ml"
  name: string;              // "AI & Machine Learning"
  keywords: string[];        // ["agent", "claude", "llm", ...]
  children?: Domain[];       // Recursive hierarchy
  color?: string;            // For UI representation
  description?: string;
}

interface TaxonomyConfig {
  version: string;
  domains: Domain[];
  formats: ContentFormat[];
  audiences: string[];
}

// Default taxonomy for AI/developer tools companies
export const DEFAULT_TAXONOMY: TaxonomyConfig = {
  version: "1.0",
  domains: [
    {
      slug: "ai-ml",
      name: "AI & Machine Learning",
      keywords: [
        "agent", "claude", "gpt", "llm", "large language model",
        "prompt engineering", "extended thinking", "chain of thought",
        "embeddings", "rag", "retrieval", "fine-tuning"
      ],
      children: [
        {
          slug: "llm",
          name: "Large Language Models",
          keywords: ["gpt", "claude", "llama", "gemini", "opus", "sonnet"]
        },
        {
          slug: "computer-vision",
          name: "Computer Vision",
          keywords: ["image recognition", "object detection", "yolo", "segmentation"]
        }
      ],
      color: "#00D084"
    },
    {
      slug: "developer-tools",
      name: "Developer Tools",
      keywords: [
        "ide", "editor", "vscode", "cursor", "github copilot",
        "debugging", "testing", "ci/cd", "devops"
      ],
      color: "#8ED1FC"
    },
    {
      slug: "saas-business",
      name: "SaaS & Business",
      keywords: [
        "product-led growth", "plg", "onboarding", "activation",
        "monetization", "pricing", "retention", "churn"
      ],
      color: "#FF6B6B"
    }
  ],
  formats: ["tutorial", "case-study", "paper", "product-update", "news", "documentation"],
  audiences: ["developers", "founders", "product-managers", "researchers", "ml-engineers"]
};
```

#### 2.2 Database Schema for Team Taxonomies

**Migration**: `packages/db/migrations/add_team_taxonomies.sql`

```sql
-- Store team-specific taxonomy configurations
CREATE TABLE team_taxonomies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  config JSONB NOT NULL,  -- TaxonomyConfig JSON
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, version)
);

-- Seed default taxonomy for existing teams
INSERT INTO team_taxonomies (team_id, version, config)
SELECT id, '1.0', '...' FROM teams;
```

#### 2.3 Update Scoring to Use Team Taxonomy

**File**: `packages/jobs/src/tasks/insights/score-relevance.ts`

**Replace**:
```typescript
import { ICP_KEYWORDS } from "../../config/icp-sources";
const keywordMatches = ICP_KEYWORDS.filter(keyword => ...);
```

**With**:
```typescript
import { getTeamTaxonomy } from "@zeke/db/queries";
const taxonomy = await getTeamTaxonomy(db, teamId);
const allKeywords = taxonomy.domains.flatMap(d => d.keywords);
const keywordMatches = allKeywords.filter(keyword => ...);
```

---

## Phase 3: Database Seeding

### Goal: Populate `story_categories` with initial taxonomy

#### 3.1 Create Seed Script

**File**: `packages/db/scripts/seed-categories.ts`

```typescript
import { DEFAULT_TAXONOMY } from "@zeke/taxonomy";

// Insert domains as categories
for (const domain of DEFAULT_TAXONOMY.domains) {
  await db.insert(storyCategories).values({
    slug: domain.slug,
    name: domain.name,
    description: domain.description
  });

  // Insert child categories
  for (const child of domain.children || []) {
    await db.insert(storyCategories).values({
      slug: child.slug,
      name: child.name,
      description: child.description
    });
  }
}
```

#### 3.2 Auto-Categorization Job

**File**: `packages/jobs/src/tasks/stories/auto-categorize.ts`

```typescript
// After content ingestion:
// 1. Get suggestedCategories from engine
// 2. Match against story_categories table
// 3. Insert into story_category_links
// 4. Generate story_tags from AI analysis
```

---

## Phase 4: API Enhancement

### Goal: Add semantic browsing endpoints

#### 4.1 New TRPC Endpoints

**File**: `apps/api/src/trpc/routers/stories.ts`

```typescript
// Browse stories by domain
byDomain: protectedProcedure
  .input(z.object({
    domain: z.string(),
    subdomain: z.string().optional(),
    limit: z.number().default(20)
  }))
  .query(async ({ input, ctx }) => {
    // Query story_category_links
  }),

// Browse by tag
byTag: protectedProcedure
  .input(z.object({
    tag: z.string(),
    limit: z.number().default(20)
  }))
  .query(async ({ input, ctx }) => {
    // Query story_tags
  }),

// Get category stats
categoryStats: protectedProcedure
  .query(async ({ ctx }) => {
    // Return counts per category
  })
```

#### 4.2 Enhanced Dashboard Endpoint

Update `dashboardSummaries` to include category distribution:

```typescript
return {
  trending: { ... },
  signals: { ... },
  repoWatch: { ... },
  categoryBreakdown: [
    { category: "ai-ml", count: 45 },
    { category: "developer-tools", count: 32 },
    // ...
  ]
}
```

---

## Phase 5: Team Customization (Future)

### Goal: Let teams manage their own taxonomies

#### 5.1 Taxonomy Management UI
- Dashboard page to view current taxonomy
- Add/edit/remove domains
- Customize keywords per domain
- Preview scoring impact

#### 5.2 Embedding-Based Auto-Categorization
- Generate embeddings for category descriptions
- Classify content by similarity to category embeddings
- Fallback to keyword matching

#### 5.3 Taxonomy Versioning
- Track taxonomy changes over time
- Re-score existing content when taxonomy changes
- A/B test different taxonomies

---

## Success Metrics

### Phase 1 (Engine Enhancement)
- ✅ 95%+ of content has `suggestedCategories`
- ✅ Average 2-3 domains per content item
- ✅ Format detection accuracy >90%

### Phase 2 (Taxonomy Config)
- ✅ All teams have default taxonomy
- ✅ Scoring uses team taxonomy instead of hardcoded keywords
- ✅ New domains added without code changes

### Phase 3 (Database Seeding)
- ✅ 50+ categories in `story_categories`
- ✅ 80%+ of stories have at least 1 category
- ✅ 5+ tags per story on average

### Phase 4 (API Enhancement)
- ✅ `byDomain` endpoint returns results <200ms
- ✅ Dashboard shows category distribution
- ✅ Users can filter by domain + tag combinations

### Phase 5 (Team Customization)
- ✅ Teams can customize their taxonomy via UI
- ✅ Taxonomy changes re-score content automatically
- ✅ Embedding-based categorization >85% accuracy

---

## Migration Notes

### Removed Packages
- ✅ `@zeke/categories` - Finance-oriented, irrelevant to research content

### New Packages
- `@zeke/taxonomy` - Domain taxonomy definitions and utilities

### Database Changes
- Populate `story_categories` with domain taxonomy
- Add `team_taxonomies` table for custom configurations
- Use existing `story_tags` for folksonomy

### API Changes (Backward Compatible)
- New endpoints: `byDomain`, `byTag`, `categoryStats`
- Enhanced: `dashboardSummaries` includes category breakdown
- Existing endpoints unchanged

---

## Philosophy: Pattern-Based Intelligence

From README.md:
> The key insight behind Zeke's performance is knowing when NOT to use AI:
> - Regex patterns extract code blocks, git diffs, API endpoints → sub-100ms, zero cost
> - Keyword matching scores relevance → deterministic, instant
> - Claude/OpenAI only for creative work → brief generation, semantic analysis

**This roadmap preserves that philosophy:**
- ✅ Domain detection uses provider metadata (YouTube categories, arXiv classifications)
- ✅ Keyword matching stays deterministic (just team-configurable)
- ✅ LLM only for summarization and tag generation
- ✅ Pattern-based extraction unchanged (code_change, api_change, etc.)

**We're not replacing pattern-based extraction with LLMs. We're organizing the patterns into a flexible taxonomy.**

---

## Quick Wins (Start Here)

1. **Delete `packages/categories`** ✅
2. **Document existing schema** - Add comments to `story_categories` table
3. **Enhance YouTube provider** - Add domain suggestions (2-3 hours)
4. **Create taxonomy package** - Extract DEFAULT_TAXONOMY (1 hour)
5. **Seed categories** - Populate story_categories (30 min)

Then build incrementally: arXiv provider → RSS provider → auto-categorization job → API endpoints.

---

## Questions to Answer

- [ ] Should categories be hierarchical (parent-child) or flat with tags?
  - **Answer**: Flat categories + hierarchical taxonomy config (best of both)

- [ ] How to handle overlapping categories (content is both "ai" AND "developer-tools")?
  - **Answer**: Many-to-many via `story_category_links` (already in schema)

- [ ] Should we re-score existing content when taxonomy changes?
  - **Answer**: Yes, via background job (Phase 5)

- [ ] What's the migration path for existing stories?
  - **Answer**: Auto-categorization job based on existing highlights + keywords

---

**Last updated**: 2025-10-02
**Status**: Planning phase - implementation starts Phase 1
