# Zeke Database Schema

## Design Philosophy

This schema follows best practices from the template while adapting core concepts for research aggregation and insight application:

1. **Multi-tenancy via Teams**: Like the template, teams are the central organizing unit, enabling collaboration and data isolation
2. **Content-centric instead of Transaction-centric**: Replaces invoices/transactions with stories/highlights as the primary value objects
3. **Temporal precision**: Supports timestamps and source citations for trust and verifiability
4. **Applied insights**: Connects research to actionable outputs through playbooks and templates

## Core Design Decisions

### Why Teams-based Architecture
- **Collaboration**: Research insights are more valuable when shared across a team
- **Billing simplicity**: One subscription per team vs complex per-user pricing
- **Data isolation**: Teams can't see each other's proprietary research and playbooks
- **Growth path**: Solo users start with personal team, can invite others later

### Why Stories vs Individual Sources
- **Synthesis value**: The magic is in cross-source pattern detection
- **Deduplication**: Multiple sources often cover the same story/topic
- **User mental model**: People think in stories/topics, not individual URLs
- **Efficiency**: Process once, reference many times

### Why Highlights as First-class Citizens
- **Core value prop**: "Find the 2 minutes that matter in 10 hours of content"
- **Proof/trust**: Every insight must be grounded in source material
- **Navigation**: Users jump directly to relevant moments
- **Application**: Highlights become inputs for playbooks and outputs

## Schema Diagram

```mermaid
erDiagram
    TEAMS {
        string id PK
        string name
        string plan
        string stripe_customer_id
        string stripe_subscription_id
        string base_currency
        json settings
        timestamp created_at
        timestamp updated_at
    }
    
    USERS {
        string id PK
        string email
        string full_name
        string avatar_url
        json preferences
        timestamp last_active_at
        timestamp created_at
    }
    
    USERS_ON_TEAM {
        string id PK
        string team_id FK
        string user_id FK
        string role
        timestamp joined_at
    }
    
    USER_INVITES {
        string id PK
        string team_id FK
        string invited_by FK
        string email
        string role
        string token
        timestamp expires_at
        timestamp created_at
    }
    
    SOURCES {
        string id PK
        string team_id FK
        string url
        string type "youtube|podcast|paper|tweet|blog|doc"
        string title
        string author
        json metadata "channel_info|publication|etc"
        integer duration_seconds
        integer content_length
        string status "pending|processing|completed|failed"
        timestamp published_at
        timestamp ingested_at
        timestamp created_at
    }
    
    SOURCE_METRICS {
        string id PK
        string source_id FK
        integer view_count
        integer like_count
        integer comment_count
        integer share_count
        float velocity_per_hour "views in first 24h / 24"
        float relative_velocity "vs channel average"
        json platform_metrics "platform-specific data"
        timestamp last_updated
    }
    
    STORIES {
        string id PK
        string team_id FK
        string title
        string slug
        text executive_summary
        json key_themes
        float novelty_score
        float heat_score "computed from story_heat_scores"
        string status "draft|active|archived"
        timestamp created_at
        timestamp updated_at
    }
    
    STORY_HEAT_SCORES {
        string id PK
        string story_id FK
        float viral_score "0-100 based on velocity"
        float engagement_score "0-100 based on comments/likes"
        float controversy_score "0-100 based on comment sentiment variance"
        float authority_score "0-100 based on source credibility"
        float recency_weight "decay factor based on age"
        float composite_heat_score "weighted average"
        json score_components "detailed breakdown"
        timestamp computed_at
    }
    
    STORY_SOURCES {
        string id PK
        string story_id FK
        string source_id FK
        float relevance_score
        integer order_position
    }
    
    HIGHLIGHTS {
        string id PK
        string story_id FK
        string source_id FK
        string team_id FK
        string created_by FK
        text content
        text original_text
        string highlight_type "claim|insight|demo|contradiction|number|quote"
        integer start_time_seconds
        integer end_time_seconds
        string page_number
        string paragraph_id
        json evidence_metadata
        float confidence_score
        boolean is_verified
        timestamp created_at
    }
    
    STORY_CHAPTERS {
        string id PK
        string story_id FK
        string source_id FK
        string title
        text summary
        integer start_time_seconds
        integer end_time_seconds
        integer order_position
    }
    
    DIALOGS {
        string id PK
        string source_id FK
        string speaker
        text content
        integer start_time_seconds
        integer end_time_seconds
        float confidence_score
    }
    
    PLAYBOOKS {
        string id PK
        string team_id FK
        string created_by FK
        string name
        string slug
        text description
        string category "experiment|brief|campaign|outreach|content"
        json template_structure
        boolean is_public
        integer usage_count
        timestamp created_at
        timestamp updated_at
    }
    
    PLAYBOOK_RUNS {
        string id PK
        string playbook_id FK
        string story_id FK
        string team_id FK
        string run_by FK
        json inputs
        json outputs
        string status "draft|completed|published"
        timestamp created_at
    }
    
    OUTPUTS {
        string id PK
        string team_id FK
        string created_by FK
        string playbook_run_id FK
        string story_id FK
        string output_type "thread|post|email|brief|prd|deck"
        string title
        text content
        json citations
        string status "draft|review|published"
        string publish_url
        timestamp published_at
        timestamp created_at
    }
    
    CHATS {
        string id PK
        string team_id FK
        string user_id FK
        string story_id FK
        string context_type "story|source|highlight"
        string context_id FK
        timestamp created_at
    }
    
    CHAT_MESSAGES {
        string id PK
        string chat_id FK
        string role "user|assistant"
        text content
        json metadata
        timestamp created_at
    }
    
    TAGS {
        string id PK
        string team_id FK
        string name
        string slug
        string color
        integer usage_count
    }
    
    STORY_TAGS {
        string id PK
        string story_id FK
        string tag_id FK
        string team_id FK
    }
    
    HIGHLIGHT_TAGS {
        string id PK
        string highlight_id FK
        string tag_id FK
        string team_id FK
    }
    
    API_KEYS {
        string id PK
        string team_id FK
        string user_id FK
        string name
        string key_hash
        json scopes
        timestamp last_used_at
        boolean is_active
        timestamp expires_at
        timestamp created_at
    }
    
    ACTIVITIES {
        string id PK
        string team_id FK
        string user_id FK
        string activity_type
        string entity_type
        string entity_id
        json metadata
        timestamp created_at
    }
    
    SUBSCRIPTIONS {
        string id PK
        string team_id FK
        string plan_id FK
        string stripe_subscription_id
        string status "trialing|active|canceled|past_due"
        integer base_seats "included in plan"
        integer additional_seats "extra seats purchased"
        integer price_per_additional_seat_cents
        timestamp current_period_start
        timestamp current_period_end
        timestamp canceled_at
        timestamp created_at
    }
    
    SUBSCRIPTION_PLANS {
        string id PK
        string name
        string stripe_price_id
        string stripe_additional_seat_price_id
        integer base_price_cents
        integer per_seat_price_cents
        integer included_seats
        string currency
        string billing_period "monthly|yearly"
        json features
        integer max_sources_per_month
        integer max_stories_per_month
        integer max_outputs_per_month
        boolean is_active
    
    USAGE_METRICS {
        string id PK
        string team_id FK
        string metric_type "sources_processed|highlights_created|outputs_generated"
        integer count
        date period_date
        timestamp created_at
    }
    
    NOTIFICATION_SETTINGS {
        string id PK
        string team_id FK
        string user_id FK
        string notification_type
        string channel "email|in_app"
        boolean enabled
        json preferences
    }
    
    WEBHOOKS {
        string id PK
        string team_id FK
        string url
        string secret
        json events
        boolean is_active
        timestamp last_triggered_at
        timestamp created_at
    }
    
    STORY_EMBEDDINGS {
        string id PK
        string story_id FK
        string model_version "e.g., text-embedding-3-large"
        vector embedding "1536 or 3072 dimensions"
        string embedding_type "full|summary|title"
        timestamp created_at
    }
    
    HIGHLIGHT_EMBEDDINGS {
        string id PK
        string highlight_id FK
        string model_version
        vector embedding
        timestamp created_at
    }
    
    SOURCE_EMBEDDINGS {
        string id PK
        string source_id FK
        string model_version
        vector embedding
        string embedding_type "full|abstract|intro"
        timestamp created_at
    }
    
    SIMILAR_STORIES {
        string id PK
        string story_id FK
        string similar_story_id FK
        float similarity_score
        string similarity_type "embedding|topic|entity"
        timestamp computed_at
    }
    
    %% Relationships
    TEAMS ||--o{ USERS_ON_TEAM : "has members"
    USERS ||--o{ USERS_ON_TEAM : "belongs to teams"
    TEAMS ||--o{ USER_INVITES : "has invites"
    USERS ||--o{ USER_INVITES : "invited_by"
    
    TEAMS ||--o{ SOURCES : "owns"
    SOURCES ||--|| SOURCE_METRICS : "tracked by"
    SOURCES ||--o{ SOURCE_EMBEDDINGS : "has embeddings"
    
    TEAMS ||--o{ STORIES : "owns"
    STORIES ||--|| STORY_HEAT_SCORES : "scored by"
    STORIES ||--o{ STORY_EMBEDDINGS : "has embeddings"
    STORIES ||--o{ SIMILAR_STORIES : "similar to"
    STORIES ||--o{ STORY_SOURCES : "aggregates"
    SOURCES ||--o{ STORY_SOURCES : "contributes to"
    
    STORIES ||--o{ HIGHLIGHTS : "contains"
    SOURCES ||--o{ HIGHLIGHTS : "extracted from"
    TEAMS ||--o{ HIGHLIGHTS : "owns"
    USERS ||--o{ HIGHLIGHTS : "created"
    HIGHLIGHTS ||--o{ HIGHLIGHT_EMBEDDINGS : "has embeddings"
    
    STORIES ||--o{ STORY_CHAPTERS : "has"
    SOURCES ||--o{ STORY_CHAPTERS : "from"
    SOURCES ||--o{ DIALOGS : "has"
    
    TEAMS ||--o{ PLAYBOOKS : "owns"
    USERS ||--o{ PLAYBOOKS : "created"
    PLAYBOOKS ||--o{ PLAYBOOK_RUNS : "executed as"
    STORIES ||--o{ PLAYBOOK_RUNS : "applied to"
    TEAMS ||--o{ PLAYBOOK_RUNS : "owns"
    USERS ||--o{ PLAYBOOK_RUNS : "run by"
    
    TEAMS ||--o{ OUTPUTS : "owns"
    USERS ||--o{ OUTPUTS : "created"
    PLAYBOOK_RUNS ||--o{ OUTPUTS : "generates"
    STORIES ||--o{ OUTPUTS : "based on"
    
    TEAMS ||--o{ CHATS : "owns"
    USERS ||--o{ CHATS : "initiated"
    STORIES ||--o{ CHATS : "about"
    CHATS ||--o{ CHAT_MESSAGES : "contains"
    
    TEAMS ||--o{ TAGS : "owns"
    STORIES ||--o{ STORY_TAGS : "tagged with"
    TAGS ||--o{ STORY_TAGS : "applied to"
    HIGHLIGHTS ||--o{ HIGHLIGHT_TAGS : "tagged with"
    TAGS ||--o{ HIGHLIGHT_TAGS : "applied to"
    
    TEAMS ||--o{ API_KEYS : "owns"
    USERS ||--o{ API_KEYS : "created"
    
    TEAMS ||--o{ ACTIVITIES : "tracks"
    USERS ||--o{ ACTIVITIES : "performs"
    
    TEAMS ||--o{ SUBSCRIPTIONS : "has"
    SUBSCRIPTION_PLANS ||--o{ SUBSCRIPTIONS : "subscribed to"
    TEAMS ||--o{ USAGE_METRICS : "tracks"
    
    TEAMS ||--o{ NOTIFICATION_SETTINGS : "has"
    USERS ||--o{ NOTIFICATION_SETTINGS : "configures"
    TEAMS ||--o{ WEBHOOKS : "configures"
```

## New Features: Heat Scores, Embeddings, and Per-Seat Pricing

### Heat Score Mechanics
The heat score system provides multi-dimensional relevance ranking:

**Components:**
1. **Viral Score (0-100)**: Based on view velocity in first 24 hours vs channel/author average
2. **Engagement Score (0-100)**: Comments, likes, shares relative to view count
3. **Controversy Score (0-100)**: Sentiment variance in comments (disagreement = higher score)
4. **Authority Score (0-100)**: Source credibility (verified accounts, citation count, h-index)
5. **Recency Weight (0-1)**: Exponential decay with configurable half-life

**Calculation:**
```sql
-- Computed hourly via background job
composite_heat_score = 
  (viral_score * 0.3) +
  (engagement_score * 0.25) +
  (controversy_score * 0.2) +
  (authority_score * 0.15) +
  (recency_weight * 0.1)
```

**Source Metrics Collection:**
- YouTube: Views, likes, comments via API
- Twitter/X: Impressions, retweets, quote tweets
- Papers: Citation count, Altmetric score
- Podcasts: Download velocity, review ratings

### Embedding-Based Similarity System

**Three-Layer Embedding Strategy:**
1. **Story Embeddings**: Full content, summary, and title embeddings for finding similar stories
2. **Highlight Embeddings**: Individual insight embeddings for semantic search
3. **Source Embeddings**: Original content embeddings for deduplication

**Similarity Computation:**
```sql
-- Find similar stories using pgvector
SELECT similar_story_id, similarity_score
FROM similar_stories
WHERE story_id = $1
  AND similarity_score > 0.8
ORDER BY similarity_score DESC;
```

**Use Cases:**
- "More like this" recommendations
- Duplicate detection before processing
- Semantic search across all content
- Trend detection via embedding clusters

### Per-Seat Pricing Model

**Subscription Structure:**
```typescript
interface SubscriptionPlan {
  basePrice: number;        // e.g., $99/month
  includedSeats: number;     // e.g., 3 seats included
  perSeatPrice: number;      // e.g., $29/additional seat
  features: {
    maxSourcesPerMonth: number;
    maxStoriesPerMonth: number;
    maxOutputsPerMonth: number;
  };
}
```

**Billing Logic:**
1. Team starts with plan's included seats
2. Additional users trigger seat upgrades via Stripe subscription items
3. Seats auto-adjust monthly based on active users
4. Deactivated users don't count toward seat limit

**Example Pricing Tiers:**
- **Starter**: $99/mo, 3 seats included, +$29/seat
- **Growth**: $299/mo, 10 seats included, +$25/seat
- **Enterprise**: Custom pricing, unlimited seats

## Key Design Patterns

### 1. Content Ingestion Pipeline
```
URL → SOURCE (pending) → Processing → DIALOGS + CHAPTERS → HIGHLIGHTS → STORY aggregation
```
- Sources are processed asynchronously with status tracking
- Dialogs preserve speaker-aware transcripts for podcasts/videos
- Chapters provide navigable segments with summaries
- Highlights extract the valuable moments with precise timestamps/locations

### 2. Trust & Verification Layer
Every highlight includes:
- `original_text`: The exact quote from source
- `start_time_seconds`/`end_time_seconds`: For video/audio
- `page_number`/`paragraph_id`: For documents
- `confidence_score`: AI confidence in extraction
- `is_verified`: Human verification flag
- `evidence_metadata`: Additional proof (screenshots, etc.)

### 3. Story Synthesis
Stories aggregate multiple sources covering the same topic:
- Deduplication happens at story level
- `STORY_SOURCES` tracks which sources contribute
- Heat/novelty scores bubble up from source metrics
- Cross-source patterns emerge in `key_themes`

### 4. Applied Intelligence (Playbooks)
Playbooks turn insights into action:
- Templates define reusable structures (PRD, experiment plan, etc.)
- Runs capture specific applications to stories
- Outputs track what was actually created and published
- Citations link back to source highlights for trust

### 5. Chat Context System
The chat system maintains context awareness:
- Can be scoped to story, source, or specific highlight
- Preserves conversation history per context
- Enables "ask about this section" functionality shown in wireframe

### 6. Subscription & Usage Tracking
Follows SaaS best practices:
- Team-level subscriptions via Stripe
- Usage metrics for rate limiting and analytics
- Plan features stored as JSON for flexibility
- Graceful handling of canceled/past_due states

## Migration Strategy from Template

### What We Keep
- Team-based multi-tenancy pattern
- User roles and invites system
- API keys for programmatic access
- Activity tracking for audit trails
- Notification settings per user
- Tags for flexible categorization

### What We Replace
- `INVOICES` → `STORIES` (core value object)
- `TRANSACTIONS` → `HIGHLIGHTS` (atomic value units)
- `BANK_ACCOUNTS` → `SOURCES` (input streams)
- `CUSTOMERS` → Removed (teams are the customers)
- `TRACKER_PROJECTS` → `PLAYBOOKS` (work templates)

### What We Add
- Content-specific tables (DIALOGS, CHAPTERS)
- Trust layer (citations, timestamps, confidence)
- Synthesis layer (story aggregation)
- Application layer (playbook runs, outputs)
- Chat system for interactive exploration

## Security Considerations

### Row-Level Security
All tables include `team_id` for RLS policies:
- Users can only access their team's data
- Cross-team sharing via public playbooks only
- Admins can access all team data for support

### API Scopes
API keys support granular scopes:
- `read:sources`: View sources and transcripts
- `write:highlights`: Create/edit highlights
- `execute:playbooks`: Run playbooks
- `publish:outputs`: Publish to external platforms

### PII Handling
- User emails hashed for privacy
- Source content encrypted at rest
- Deletion cascades properly configured
- GDPR-compliant data export available

## Performance Optimizations

### Indexes
Critical indexes for common queries:
- `stories.slug` for URL routing
- `highlights.source_id, start_time_seconds` for timeline views
- `sources.status, created_at` for processing queue
- `story_sources.story_id, relevance_score` for ranking

### Materialized Views
Consider for expensive aggregations:
- Story heat scores (aggregate from sources)
- User activity summaries
- Popular playbooks
- Citation graphs

### Partitioning Strategy
For scale:
- `activities` by month
- `chat_messages` by month
- `usage_metrics` by period_date
- `dialogs` by source_id (for large transcripts)

## Future Considerations

### Phase 2 Features
- **Collaboration**: Comments on highlights, shared playbooks
- **Advanced synthesis**: Entity extraction, knowledge graphs
- **Automation**: Scheduled source ingestion, auto-tagging
- **Analytics**: Team insights dashboard, ROI tracking

### Phase 3 Features
- **Marketplace**: Public playbook library
- **Integrations**: Direct publish to CMS/social
- **Federation**: Cross-team data sharing agreements
- **ML Pipeline**: Custom models per team's domain

## Implementation Notes

### Technology Recommendations
- **Database**: PostgreSQL with pgvector extension for embeddings
- **Vector Operations**: pgvector for similarity search, HNSW indexes for performance
- **Search**: Elasticsearch for full-text search across transcripts
- **Queue**: Redis + BullMQ for processing pipeline
- **Storage**: S3 for source files and generated outputs
- **Cache**: Redis for hot highlights, story data, and heat scores
- **Metrics Collection**: Scheduled jobs for YouTube/Twitter APIs
- **Embedding Generation**: OpenAI text-embedding-3-large or similar

### Embedding Implementation Details
```sql
-- Create vector extension and indexes
CREATE EXTENSION IF NOT EXISTS vector;

-- Story embeddings table with HNSW index
CREATE INDEX story_embeddings_vector_idx ON story_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Similarity search function
CREATE FUNCTION find_similar_stories(
  query_embedding vector(3072),
  limit_count int DEFAULT 10
) RETURNS TABLE(story_id uuid, similarity float) AS $$
  SELECT story_id, 1 - (embedding <=> query_embedding) AS similarity
  FROM story_embeddings
  ORDER BY embedding <=> query_embedding
  LIMIT limit_count;
$$ LANGUAGE SQL;
```

### Heat Score Implementation
```typescript
// Background job to update heat scores (runs hourly)
async function updateStoryHeatScores() {
  // Fetch latest metrics from external APIs
  const sourceMetrics = await fetchSourceMetrics();
  
  // Calculate component scores
  for (const story of activeStories) {
    const scores = {
      viral_score: calculateViralScore(story, sourceMetrics),
      engagement_score: calculateEngagementScore(story, sourceMetrics),
      controversy_score: await analyzeCommentSentiment(story),
      authority_score: calculateAuthorityScore(story.sources),
      recency_weight: calculateRecencyDecay(story.created_at)
    };
    
    // Compute weighted average
    const composite = 
      scores.viral_score * 0.3 +
      scores.engagement_score * 0.25 +
      scores.controversy_score * 0.2 +
      scores.authority_score * 0.15 +
      scores.recency_weight * 0.1;
    
    // Update database
    await upsertStoryHeatScore(story.id, scores, composite);
  }
  
  // Cache hot stories in Redis
  await cacheHotStories();
}
```

### Data Integrity Rules
1. Stories must have at least one source
2. Highlights must reference valid timestamps/locations
3. Playbook runs must complete or fail (no zombies)
4. Subscriptions must have valid Stripe IDs
5. Activities are append-only (no updates)

This schema provides a robust foundation for Zeke's research aggregation and insight application platform while maintaining the battle-tested patterns from your template.