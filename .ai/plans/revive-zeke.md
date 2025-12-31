# Zeke Local Docker + Postgres Bootstrap Plan

> **Goal**: Get Zeke running locally with Docker and a self-hosted Postgres database, validate each engine provider, then resolve outstanding bugs.
>
> **Status**: COMPLETED - Migrated from Supabase to self-hosted PostgreSQL, MinIO, and Better Auth.

---

## Current State Summary

### Database
- **Current**: Self-hosted PostgreSQL via Docker
- **ORM**: Drizzle with migrations in `packages/db/migrations/`
- **Connection**: Singleton client in `packages/db/src/client.ts`
- **Storage**: MinIO (S3-compatible) via `@zeke/storage`
- **Auth**: Better Auth via `@zeke/auth`

### Engine Providers (ALL IMPLEMENTED)
| Provider | Status | Auth | Notes |
|----------|--------|------|-------|
| YouTube | Complete | API Key | Transcript fetching stubbed |
| arXiv | Complete | None | Fully functional |
| RSS | Complete | None | Regex parser (works) |
| Apple Podcasts | Complete | None | iTunes API + RSS |
| Semantic Scholar | Complete | None | Rate-limited free tier |

### Resolved Bugs
| ID | Issue | Status |
|----|-------|--------|
| 007 | RBAC returns `isAdmin: true` for all users | FIXED - Added `systemRole` enum and `getAdminStatus()` in `packages/db/src/queries/auth.ts` |
| 008 | MFA not configured | FIXED - Better Auth twoFactor plugin configured in `packages/auth/src/config.ts` |
| 009 | Stripe customer ID not stored in DB | FIXED - Added `stripeCustomerId` field to teams table and query functions |

---

## Phase 1: Local Docker + Postgres Infrastructure

### 1.1 Create Local Postgres Container

Add Postgres to the root `docker-compose.yml` for local development:

```yaml
# docker-compose.yml (root - local dev)
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    networks:
      - zeke-network

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: zeke
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./packages/db/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - zeke-network

networks:
  zeke-network:
    driver: bridge

volumes:
  postgres-data:
```

### 1.2 Create Postgres Init Script

Create `packages/db/init/00-extensions.sql`:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### 1.3 Update Environment Configuration

Create `.env.local` template:

```bash
# Database (local Docker Postgres)
DATABASE_PRIMARY_URL=postgresql://postgres:postgres@localhost:5432/zeke
DATABASE_SESSION_POOLER_URL=postgresql://postgres:postgres@localhost:5432/zeke
PGSSLMODE=disable

# Better Auth
BETTER_AUTH_SECRET=your-auth-secret-at-least-32-chars

# API
API_SECRET_KEY=your-api-secret-key-at-least-32-characters
NODE_ENV=development

# Redis
REDIS_URL=redis://localhost:6379

# AI (required for insights)
OPENAI_API_KEY=sk-...

# Trigger.dev (background jobs)
TRIGGER_PROJECT_ID=your-trigger-project-id
TRIGGER_SECRET_KEY=tr_dev_...

# Engine - YouTube (only required secret)
YOUTUBE_API_KEY=your-youtube-api-key
YOUTUBE_QUOTA_LIMIT=10000
YOUTUBE_QUOTA_RESET_HOUR=0
YOUTUBE_RATE_LIMIT_BUFFER=1000
```

### 1.4 Update DB Client for Local Mode

Modify `packages/db/src/client.ts` to handle local Postgres (no SSL):

```typescript
// Add to pool config detection
const sslConfig = process.env.PGSSLMODE === 'disable'
  ? false
  : { rejectUnauthorized: process.env.PGSSLMODE !== 'no-verify' };
```

### 1.5 Startup Script

Create `scripts/dev-local.sh`:

```bash
#!/bin/bash
set -e

echo "Starting local infrastructure..."

# Start Postgres + Redis
docker compose up -d postgres redis

# Wait for Postgres
echo "Waiting for Postgres..."
until docker compose exec -T postgres pg_isready -U postgres; do
  sleep 1
done

echo "Running migrations..."
cd packages/db && bun run migrate:dev

echo "Starting services..."
cd ../..
bun dev
```

---

## Phase 2: Engine Validation (Engine-by-Engine)

### Validation Approach
For each engine:
1. Start the engine service
2. Run health check
3. Test content ingestion with known URLs
4. Verify normalized output structure

### 2.1 Start Engine Service

```bash
# Terminal 1: Start infrastructure
docker compose up -d postgres redis

# Terminal 2: Start engine
cd apps/engine && bun run dev
# Runs on http://localhost:3010
```

### 2.2 YouTube Provider

**Test URLs:**
```bash
# Health check
curl http://localhost:3010/health | jq '.youtube'

# Ingest video
curl -X POST http://localhost:3010/ingest \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' | jq

# Ingest channel
curl -X POST http://localhost:3010/source \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/@veritasium"}' | jq
```

**Expected Output:**
- `sourceType: "youtube"`
- `contentType: "video"`
- Metadata includes: videoId, channelId, viewCount, duration
- `transcript: null` (expected - stubbed)

**Requirements:**
- `YOUTUBE_API_KEY` must be set

**Known Limitation:**
- Transcript extraction not implemented (returns undefined)

---

### 2.3 arXiv Provider

**Test URLs:**
```bash
# Health check
curl http://localhost:3010/health | jq '.arxiv'

# Ingest paper (Attention Is All You Need)
curl -X POST http://localhost:3010/ingest \
  -H "Content-Type: application/json" \
  -d '{"url": "https://arxiv.org/abs/1706.03762"}' | jq

# Ingest by raw ID
curl -X POST http://localhost:3010/ingest \
  -H "Content-Type: application/json" \
  -d '{"url": "2103.00020"}' | jq
```

**Expected Output:**
- `sourceType: "arxiv"`
- `contentType: "paper"`
- Metadata includes: arxivId, pdfUrl, categories, authors

**Requirements:**
- None (public API)

---

### 2.4 RSS Provider

**Test URLs:**
```bash
# Health check
curl http://localhost:3010/health | jq '.rss'

# Ingest Hacker News feed
curl -X POST http://localhost:3010/ingest \
  -H "Content-Type: application/json" \
  -d '{"url": "https://hnrss.org/frontpage"}' | jq

# Ingest specific blog
curl -X POST http://localhost:3010/ingest \
  -H "Content-Type: application/json" \
  -d '{"url": "https://feeds.feedburner.com/TechCrunch"}' | jq
```

**Expected Output:**
- `sourceType: "rss"`
- `contentType: "article"`
- Metadata includes: feedTitle, feedUrl, guid

**Requirements:**
- None (public feeds)

---

### 2.5 Apple Podcasts Provider

**Test URLs:**
```bash
# Health check
curl http://localhost:3010/health | jq '.podcast'

# Ingest The Daily
curl -X POST http://localhost:3010/ingest \
  -H "Content-Type: application/json" \
  -d '{"url": "https://podcasts.apple.com/us/podcast/the-daily/id1200361736"}' | jq

# Get podcast source info
curl -X POST http://localhost:3010/source \
  -H "Content-Type: application/json" \
  -d '{"url": "https://podcasts.apple.com/us/podcast/the-daily/id1200361736"}' | jq
```

**Expected Output:**
- `sourceType: "podcast"`
- `contentType: "audio"`
- Metadata includes: episodeId, podcastId, duration, artwork

**Requirements:**
- None (iTunes API is public)

---

### 2.6 Semantic Scholar Provider

**Test URLs:**
```bash
# Health check
curl http://localhost:3010/health | jq '."semantic-scholar"'

# Ingest Transformer paper
curl -X POST http://localhost:3010/ingest \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.semanticscholar.org/paper/204e3073870fae3d05bcbc2f6a8e263d9b72e776"}' | jq

# Ingest by DOI
curl -X POST http://localhost:3010/ingest \
  -H "Content-Type: application/json" \
  -d '{"url": "10.48550/arXiv.1706.03762"}' | jq
```

**Expected Output:**
- `sourceType: "semantic-scholar"`
- `contentType: "paper"`
- Metadata includes: citationCount, fieldsOfStudy, isOpenAccess

**Requirements:**
- None (rate-limited to 1 req/sec on free tier)

---

### 2.7 Engine Validation Checklist

```markdown
## Engine Validation Status (COMPLETED 2025-12-31)

- [x] Infrastructure running (Redis)
- [x] Engine starts without errors
- [x] `/health` returns 200 - all providers healthy

### Providers
- [x] YouTube
  - [x] Health check passes
  - [x] Video ingestion works (Rick Astley - 1.7B views, 214s duration)
  - [ ] Channel source works (not tested)
- [x] arXiv
  - [x] Health check passes
  - [x] Paper ingestion works (Attention Is All You Need - 8 authors, categories)
  - [ ] Paper ingestion works (raw ID) (not tested)
- [x] RSS
  - [x] Health check passes
  - [x] Feed ingestion works (HN frontpage - got latest article)
  - [ ] Article extraction works (not tested)
- [x] Apple Podcasts
  - [x] Health check passes
  - [x] Episode ingestion works (The Daily - 1249s duration, artwork)
  - [ ] Podcast source works (not tested)
- [x] Semantic Scholar
  - [x] Health check passes
  - [x] Paper ingestion works (Transformer paper - 159K citations)
  - [ ] DOI resolution works (not tested)
```

### Validation Run Log (2025-12-31)

**Health Check Response:**
```json
{
  "status": "ok",
  "providers": {
    "youtube": {"status": "healthy"},
    "rss": {"status": "healthy"},
    "arxiv": {"status": "healthy"},
    "podcast": {"status": "healthy"},
    "semantic-scholar": {"status": "healthy"}
  }
}
```

**Sample Outputs:**
- YouTube: Got video metadata, 1.7B views, thumbnails, channel info
- arXiv: Got paper abstract, PDF URL, categories, 8 authors
- RSS: Got latest HN article with URL, author, timestamp
- Podcasts: Got episode with 20min duration, artwork URL, audio URL
- Semantic Scholar: Got paper with 159K citations, venue, fields of study

---

## Phase 3: API + Dashboard Validation

### 3.1 Start Full Stack

```bash
# After Phase 2 validation
bun dev  # Starts API (3003) + Dashboard (3001)
```

### 3.2 API Health Checks

```bash
# Basic health
curl http://localhost:3003/health | jq

# Connection pool stats
curl http://localhost:3003/health/pools | jq
```

### 3.3 Dashboard Access

1. Open http://localhost:3001
2. Verify auth flow works
3. Check console for errors

---

## Phase 4: Bug Fixes

### 4.1 Bug 007: RBAC Admin Privileges (P1)

**Problem:** `getAdminFlag()` returns `{ isAdmin: true }` for ALL users

**Location:** `packages/supabase/src/queries/index.ts`

**Fix Steps:**

1. **Check if role field exists in users table**
   ```bash
   # In Drizzle Studio or psql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'users';
   ```

2. **Add role field if missing** (`packages/db/src/schema.ts`):
   ```typescript
   export const userRole = pgEnum('user_role', ['user', 'admin', 'super_admin']);

   // In users table
   role: userRole('role').default('user').notNull(),
   ```

3. **Create migration:**
   ```bash
   cd packages/db && bun run generate
   ```

4. **Implement actual check:**
   ```typescript
   export async function getAdminFlag() {
     const supabase = await createClient();
     const { data: { user } } = await supabase.auth.getUser();

     if (!user) return { isAdmin: false };

     const result = await db
       .select({ role: users.role })
       .from(users)
       .where(eq(users.id, user.id))
       .limit(1);

     const role = result[0]?.role;
     return { isAdmin: role === 'admin' || role === 'super_admin' };
   }
   ```

5. **Set initial admin(s):**
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-admin@email.com';
   ```

**Validation:**
- Non-admin user cannot access admin routes
- Admin user can access admin routes
- No regressions in auth flow

---

### 4.2 Bug 008: MFA Supabase Configuration (P1)

**Problem:** MFA UI exists but backend not enabled

**Location:** `apps/dashboard/src/components/mfa-list.tsx`

**Fix Steps:**

1. **If using Supabase Cloud:**
   - Go to Supabase Dashboard > Authentication > Providers
   - Enable "Phone" or configure TOTP
   - Set MFA enrollment policy

2. **If using local Supabase:**
   - Update `supabase/config.toml`:
     ```toml
     [auth.mfa]
     enabled = true

     [auth.mfa.totp]
     enroll_enabled = true
     verify_enabled = true
     ```
   - Restart local Supabase: `supabase stop && supabase start`

3. **Test MFA flow:**
   - Enroll a TOTP factor
   - Verify factor works
   - Remove factor
   - Re-enroll to confirm full cycle

4. **Remove TODO comment** from `mfa-list.tsx`

**Validation:**
- MFA enrollment completes successfully
- Login with MFA works
- MFA removal works

---

### 4.3 Bug 009: Stripe Customer ID Storage (P2)

**Problem:** Webhook receives customer ID but can't store it

**Location:** `apps/dashboard/src/app/api/webhooks/route.ts` (lines 71, 112)

**Fix Steps:**

1. **Add field to schema** (`packages/db/src/schema.ts`):
   ```typescript
   // In teams table
   stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).unique(),
   ```

2. **Create migration:**
   ```bash
   cd packages/db && bun run generate
   # Review migration, then:
   bun run migrate:dev
   ```

3. **Add query function** (`packages/db/src/queries/teams.ts`):
   ```typescript
   export async function setStripeCustomerId(teamId: string, customerId: string) {
     return db
       .update(teams)
       .set({ stripeCustomerId: customerId })
       .where(eq(teams.id, teamId));
   }

   export async function getTeamByStripeCustomer(customerId: string) {
     return db
       .select()
       .from(teams)
       .where(eq(teams.stripeCustomerId, customerId))
       .limit(1);
   }
   ```

4. **Update webhook handler** (`apps/dashboard/src/app/api/webhooks/route.ts`):
   ```typescript
   // In handleCheckoutSessionCompleted (line 71)
   await setStripeCustomerId(teamId, customerId);

   // In resolveTeamId (line 112)
   const team = await getTeamByStripeCustomer(customerId);
   if (team[0]) return team[0].id;
   ```

5. **Remove TODO comments**

**Validation:**
- New checkout stores customer ID
- Subscription events resolve team correctly
- Existing teams without customer ID don't break

---

## Phase 5: Full Integration Test

### 5.1 End-to-End Checklist

```markdown
## Full Stack Validation

### Infrastructure
- [ ] Docker Postgres running and healthy
- [ ] Redis running
- [ ] Migrations applied successfully

### Engine (port 3010)
- [ ] All 5 providers healthy
- [ ] Content ingestion works for each type

### API (port 3003)
- [ ] Health check passes
- [ ] Pool stats show connections
- [ ] tRPC endpoints respond

### Dashboard (port 3001)
- [ ] Login works
- [ ] Can view stories
- [ ] Can trigger ingestion

### Bug Fixes
- [ ] RBAC working (non-admins blocked)
- [ ] MFA enrollment works
- [ ] Stripe customer ID stored
```

---

## Execution Order

```
Week 1: Infrastructure + Engine Validation
├── Day 1-2: Phase 1 (Docker + Postgres setup)
├── Day 3-4: Phase 2 (Engine-by-engine validation)
└── Day 5: Phase 3 (API + Dashboard validation)

Week 2: Bug Fixes
├── Day 1: Bug 007 (RBAC) - P1
├── Day 2: Bug 008 (MFA) - P1
├── Day 3: Bug 009 (Stripe) - P2
└── Day 4-5: Integration testing + cleanup
```

---

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| Modify | `docker-compose.yml` | Add Postgres service |
| Create | `packages/db/init/00-extensions.sql` | Postgres extensions |
| Create | `.env.local` | Local environment template |
| Create | `scripts/dev-local.sh` | Dev startup script |
| Modify | `packages/db/src/schema.ts` | Add role + stripeCustomerId |
| Modify | `packages/supabase/src/queries/index.ts` | Fix getAdminFlag |
| Modify | `packages/db/src/queries/teams.ts` | Add Stripe queries |
| Modify | `apps/dashboard/src/app/api/webhooks/route.ts` | Store customer ID |
| Modify | `apps/dashboard/src/components/mfa-list.tsx` | Remove TODO |

---

## Success Criteria

1. **Infrastructure**: `docker compose up` starts Postgres + Redis, migrations run
2. **Engine**: All 5 providers pass health checks and return valid content
3. **API**: Health endpoint returns healthy, pool stats show active connections
4. **Dashboard**: User can log in, view content, trigger ingestion
5. **RBAC**: Only designated admins can access admin functions
6. **MFA**: Users can enroll, verify, and remove MFA factors
7. **Stripe**: Checkout creates team with stored customer ID

---

## Rollback Plan

If local Postgres causes issues:
1. Switch `DATABASE_PRIMARY_URL` back to Supabase cloud
2. Set `PGSSLMODE=require`
3. All code changes are backwards-compatible

---

## Notes

- YouTube transcript extraction remains stubbed (not blocking)
- RSS uses regex parser (works, but could be improved later)
- Semantic Scholar has rate limits on free tier (1 req/sec)
- Consider adding `supabase` local container later for full auth parity
