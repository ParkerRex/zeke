---
status: ready
priority: p1
issue_id: "001"
tags: [configuration, security, validation]
dependencies: []
---

# Missing Environment Variable Validation

## Problem Statement
Over 150 locations access `process.env` directly without validation. Many use the `??` operator with weak fallbacks (empty strings) or no validation at all. This means the application may start with invalid/empty credentials, leading to silent failures in production and potential security bypasses.

## Findings
- 150+ locations using `process.env` directly
- Location examples:
  - `apps/engine/src/server/server.ts:8` - API_SECRET_KEY with empty string fallback
  - `apps/api/src/utils/auth.ts:28` - SUPABASE_JWT_SECRET with no validation
- Many critical secrets fall back to empty strings
- No startup validation ensuring required environment variables exist

## Proposed Solutions

### Option 1: Centralized Zod Schema Validation (Recommended)
- **Implementation**: Create environment validation module with Zod
  ```typescript
  const envSchema = z.object({
    API_SECRET_KEY: z.string().min(32),
    SUPABASE_JWT_SECRET: z.string().min(32),
    DATABASE_PRIMARY_URL: z.string().url(),
    // ... all required vars
  });

  export const env = envSchema.parse(process.env);
  ```
- **Pros**:
  - Type-safe environment access
  - Fail fast on startup if missing required vars
  - Clear error messages
  - Centralized configuration
- **Cons**:
  - Requires updating all 150+ locations
  - May require phased rollout
- **Effort**: Medium (2-8 hours)
- **Risk**: Low (improves reliability)

### Option 2: Wrapper Functions with Runtime Checks
- **Implementation**: Create helper functions that validate at runtime
- **Pros**: Can be adopted incrementally
- **Cons**:
  - Doesn't fail fast at startup
  - Less type safety
  - May still have runtime failures
- **Effort**: Medium
- **Risk**: Medium

## Recommended Action
[To be filled during approval]

## Technical Details
- **Affected Files**: 150+ files across all packages
- **Related Components**: All services using environment variables
- **Database Changes**: No

## Resources
- Zod documentation: https://zod.dev/
- Example implementations in similar projects
- Node.js best practices for environment variables

## Acceptance Criteria
- [ ] Create centralized environment validation module
- [ ] Define schema for all required environment variables
- [ ] Update all 150+ locations to use validated env object
- [ ] Add startup validation that fails fast if missing required vars
- [ ] Document all required environment variables
- [ ] Add example .env.example files for each package
- [ ] Tests pass with proper environment setup
- [ ] Application fails to start with clear error if missing required vars

## Work Log

### 2025-10-28 - Initial Discovery
**By:** Claude Triage System
**Actions:**
- Issue discovered during code security analysis
- Identified 150+ locations with direct process.env access
- Found critical security implications with empty string fallbacks
- Categorized as P1 (CRITICAL) due to security impact
- Estimated effort: Medium (2-8 hours)

**Learnings:**
- Many security issues stem from missing validation
- Empty string fallbacks for secrets are particularly dangerous
- Centralized validation prevents entire classes of bugs

## Notes
Source: Triage session on 2025-10-28
Critical security issue - should be prioritized after rotating exposed secrets