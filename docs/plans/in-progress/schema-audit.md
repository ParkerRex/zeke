# Schema Audit Report: Current vs Proposed ERD

## Executive Summary
This audit compares the existing Drizzle schema at `packages/db/src/schema.ts` against the proposed ERD in `docs/plans/in-progress/db-proposed-er.md`.

## Tables Analysis

### ✅ Existing Tables (Match Proposed)
- `users` - Core user table exists
- `teams` - Multi-tenant foundation exists  
- `teamMembers` - Team membership exists
- `teamInvites` - Invitation system exists
- `customers` - Customer tracking exists (but needs fields)
- `sources` - Content sources exist
- `rawItems` - Raw content ingestion exists
- `contents` - Content storage exists
- `stories` - Story entities exist
- `storyEmbeddings` - Vector embeddings exist
- `storyOverlays` - AI analysis exists
- `highlights` - Highlight system exists (needs expansion)
- `clusters` - Story clustering exists (named differently)
- `products` - Stripe products exist
- `prices` - Stripe pricing exists
- `subscriptions` - Stripe subscriptions exist

### ❌ Missing Tables (Need Creation)
- `user_profiles` - User preferences/job titles
- `customer_tags` - Customer categorization
- `customer_tag_assignments` - M:N customer-tag links
- `team_goals` - Customer journey tracking
- `source_connections` - Team-specific source configs
- `story_clusters` - Proper cluster table (vs current `clusters`)
- `story_assets` - External media references
- `authors` - Content author entities
- `story_authors` - M:N story-author links
- `story_categories` - Content categorization
- `story_category_links` - M:N story-category links
- `story_chapters` - Chapter segmentation
- `story_turns` - Dialog/transcript turns
- `highlight_references` - Turn-level citations
- `highlight_tags` - Highlight categorization
- `team_highlight_states` - Team-specific highlight state
- `team_story_states` - Team-specific story state (pins, ratings)
- `story_notes` - Collaborative annotations
- `playbook_templates` - Reusable playbook patterns
- `playbook_template_steps` - Template step definitions
- `playbooks` - Instantiated playbooks
- `playbook_steps` - Playbook execution steps
- `playbook_step_highlights` - Step-highlight links
- `playbook_outputs` - Generated deliverables
- `assistant_threads` - Chat conversation containers
- `assistant_thread_sources` - Thread context sources
- `assistant_messages` - Chat messages
- `message_source_links` - Message citations

### 🔧 Tables Needing Updates
1. **customers** - Missing: persona, status, owner_id, context fields
2. **teams** - Missing: slug, owner_id, plan_code fields  
3. **stories** - Missing: cluster_id, primary_source_id relationships
4. **highlights** - Missing: chapter_id, kind, confidence, is_generated fields

### 🗑️ Tables to Consider Removing
- `platformQuota` - Platform instrumentation (may keep for ops)
- `sourceHealth` - Source monitoring (may keep for ops)
- `sourceMetrics` - Source analytics (may keep for ops)
- `jobMetrics` - Worker monitoring (may keep for ops)

## Field-Level Gaps

### Critical Missing Fields
1. **teams table**:
   - `slug` (unique identifier for URLs)
   - `owner_id` (team ownership)
   - `plan_code` (subscription tier)

2. **stories table**:
   - `cluster_id` (clustering relationship)
   - `primary_source_id` (source attribution)
   - `kind` field exists but may need enum expansion

3. **highlights table**:
   - `chapter_id` (chapter association)
   - `start_seconds`, `end_seconds` (timestamp ranges)
   - `confidence` (AI confidence score)
   - `is_generated` (AI vs human flag)

## Relationship Gaps

### Missing Foreign Keys
1. Story → Cluster relationship
2. Story → Source (primary) relationship
3. Highlight → Chapter relationship
4. Highlight → Team (optional) relationship
5. Team → Owner (user) relationship

### Missing Join Tables
1. Story ↔ Author (many-to-many)
2. Story ↔ Category (many-to-many)
3. Customer ↔ Tag (many-to-many)
4. Playbook Step ↔ Highlight (many-to-many)

## Implementation Priority

### Phase 1: Core Schema Updates (Required for MVP)
1. Update existing tables with missing fields
2. Create team state tables (`team_story_states`, `team_highlight_states`)
3. Create story structure tables (`story_chapters`, `story_turns`)
4. Create highlight reference system (`highlight_references`)

### Phase 2: Playbook System
1. Create playbook templates and instantiation tables
2. Create playbook step and output tracking
3. Link highlights to playbook steps

### Phase 3: Assistant Integration
1. Create assistant thread system
2. Create message and source linking
3. Enable chat-based workflows

### Phase 4: Analytics & Metadata
1. Create author and category systems
2. Create customer goals and tags
3. Add engagement tracking views

## Migration Considerations

### Data Preservation
- Existing `stories`, `highlights`, `users`, `teams` data must be preserved
- Current `clusters` table may need renaming to `story_clusters`
- Subscription data must maintain Stripe sync

### Breaking Changes
- Team relationships will change (add owner_id)
- Highlight scoping will change (add optional team_id)
- Story clustering will use new structure

### Backwards Compatibility
- Keep `DatabaseWithPrimary` type alias
- Maintain existing query interfaces where possible
- Phase deprecations of old patterns

## Open Questions

1. **Team State Management**: Should `team_state` be deferred as mentioned in the plan?
2. **Media Storage**: Confirm all media stays external (YouTube, etc.) via `story_assets.external_url`?
3. **RLS Policies**: How should new tables inherit/implement row-level security?
4. **Search Indexes**: Which fields need full-text search or vector indexes?
5. **Soft Deletes**: Should we use soft deletes for audit trails?

## Recommended Next Steps

1. **Create migration plan**: Draft Drizzle migrations for schema changes
2. **Update type definitions**: Ensure TypeScript types align with new schema
3. **Test RLS policies**: Verify security model with new tables
4. **Update queries**: Implement query stubs from proposed ERD
5. **Worker updates**: Modify ingestion to populate new tables

## Notes for Implementation

- Use TODO comments for deferred work (e.g., `team_state`)
- Maintain snake_case for consistency with existing schema
- Include proper indexes for foreign keys and common queries
- Add created_at/updated_at timestamps to all tables
- Consider using UUIDs for all primary keys