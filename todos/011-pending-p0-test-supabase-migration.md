---
status: pending
priority: p0
issue_id: "011"
tags: [testing, migration, verification, quality-assurance]
dependencies: ["010"]
---

# Test Supabase Removal Migration

## Problem Statement
The Supabase removal migration (issue #010) has been completed with all imports updated, but the migration has not been tested end-to-end. Critical functionality including authentication, file storage, and database access needs verification to ensure the migration was successful and no functionality was broken.

## Findings
- Migration completed in commit `cbbe43f`
- 28 files updated with new imports:
  - `@zeke/auth` for authentication (Better Auth)
  - `@zeke/storage` for file storage (MinIO)
  - `@zeke/db` for database queries (Drizzle ORM)
- No end-to-end testing performed yet
- Critical user flows need verification:
  - User authentication (login, logout, session management)
  - MFA enrollment and verification
  - File uploads and downloads
  - Database transactions
  - API routes and webhooks

## Proposed Solutions

### Option 1: Comprehensive Manual Testing (Recommended)
- **Implementation**:
  1. Test authentication flows
     - User registration
     - User login/logout
     - Session persistence
     - Password reset (if applicable)
  2. Test MFA functionality
     - MFA enrollment
     - TOTP verification
     - MFA factor removal
  3. Test file storage
     - File uploads (inbox, vault)
     - File downloads
     - File deletion
     - Storage bucket access
  4. Test database operations
     - User queries
     - Team queries
     - Transaction helpers
     - Data persistence
  5. Test API routes
     - `/api/checkout` (Stripe integration)
     - `/api/webhooks` (Stripe webhooks)
     - `/api/pipeline/trigger`
     - `/api/proxy`
  6. Test tRPC endpoints
     - Client-side tRPC calls
     - Server-side tRPC procedures
  7. Verify no broken imports or runtime errors
- **Pros**:
  - Catches real-world issues
  - Validates user experience
  - Tests integration points
  - Identifies edge cases
- **Cons**:
  - Time-consuming
  - May not catch all edge cases
  - Requires running environment
- **Effort**: Medium (3-6 hours)
- **Risk**: Low (testing only)

### Option 2: Automated Testing Suite
- **Implementation**: Write integration and e2e tests for migrated functionality
- **Pros**: Repeatable, comprehensive, regression protection
- **Cons**: Time-intensive, requires test infrastructure
- **Effort**: Large (8+ hours)
- **Risk**: Low

### Option 3: Gradual Production Rollout with Monitoring
- **Implementation**: Deploy to staging/production with comprehensive monitoring
- **Pros**: Real-world validation
- **Cons**: Risk of production issues, requires rollback plan
- **Effort**: Medium
- **Risk**: Medium-High

## Recommended Action
Implement Option 1: Comprehensive Manual Testing, followed by Option 2 for long-term regression protection

## Technical Details
- **Test Environments**:
  - Local development environment
  - Staging environment (if available)
- **Key Components to Test**:
  - Authentication: Better Auth integration
  - Storage: MinIO file operations
  - Database: Drizzle ORM queries
  - API Routes: Stripe webhooks, checkout flow
  - tRPC: Client and server procedures
  - MFA: Enrollment and verification flows
  - File uploads: Inbox and vault functionality

## Resources
- Migration issue: #010
- Better Auth documentation
- MinIO client documentation
- Drizzle ORM query examples
- Commit diff: `git show cbbe43f`

## Acceptance Criteria
- [ ] Set up local development environment with Better Auth, MinIO, PostgreSQL
- [ ] Test user authentication (register, login, logout)
- [ ] Test session persistence and management
- [ ] Test MFA enrollment flow (enroll-mfa.tsx)
- [ ] Test MFA verification flow (verify-otp-action.ts)
- [ ] Test MFA factor listing (mfa-list.tsx)
- [ ] Test file upload to inbox (inbox-upload-zone.tsx)
- [ ] Test file upload to vault (vault-upload-zone.tsx)
- [ ] Test file download from storage
- [ ] Test database user queries (select-user.tsx)
- [ ] Test team operations (get-teams-data.ts, team invites)
- [ ] Test transaction helpers (transaction-helpers.ts)
- [ ] Test Stripe checkout flow (api/checkout/route.ts)
- [ ] Test Stripe webhook handling (api/webhooks/route.ts)
- [ ] Test tRPC client calls (trpc/client.tsx)
- [ ] Test tRPC server procedures (trpc/server.tsx)
- [ ] Verify no runtime errors in console
- [ ] Verify no broken imports
- [ ] Document any issues found
- [ ] Fix any bugs discovered during testing

## Work Log

### 2025-12-31 - Issue Created
**By:** Claude Task Manager
**Actions:**
- Created testing task for Supabase migration
- Identified critical flows to test
- Categorized as P0 (CRITICAL) - migration must be verified
- Estimated effort: Medium (3-6 hours)

**Rationale:**
- Large refactoring across 28 files requires thorough testing
- Authentication, storage, and database are critical systems
- Migration affects core user functionality
- Testing ensures no regression or broken functionality

## Notes
This is a blocking task for the Supabase migration (issue #010). The migration cannot be considered complete until all critical flows are tested and verified working.

**Related Issues:**
- #010 - Supabase Removal Migration (resolved)
- #008 - MFA Configuration (needs update for Better Auth)
- #007 - RBAC Implementation (location reference outdated)
