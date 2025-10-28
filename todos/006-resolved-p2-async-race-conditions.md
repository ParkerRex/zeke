---
status: resolved
priority: p2
issue_id: "006"
tags: [reliability, async, data-integrity]
dependencies: []
---

# Race Conditions in Async Operations

## Problem Statement
Multiple async operations are executed in parallel using Promise.all without proper transaction boundaries. If one operation fails, others may succeed, leaving the system in an inconsistent state. This affects user deletion and other multi-step operations.

## Findings
- Uncoordinated async operations
- Location: `apps/api/src/trpc/routers/user.ts:27`
- Operations include:
  - deleteUser from database
  - supabase.auth.admin.deleteUser
  - resend contacts removal
- No rollback mechanism if partial failure
- Could leave orphaned data

## Proposed Solutions

### Option 1: Implement Saga Pattern (Recommended)
- **Implementation**: Create compensating transactions for rollback
  ```typescript
  try {
    const dbResult = await deleteUser(db, userId);
    try {
      await supabase.auth.admin.deleteUser(userId);
      try {
        await resend?.contacts.remove({...});
      } catch (e) {
        // Compensate: recreate auth user
        await rollbackAuthUser(userId);
        throw e;
      }
    } catch (e) {
      // Compensate: restore DB user
      await rollbackDbUser(dbResult);
      throw e;
    }
  }
  ```
- **Pros**:
  - Maintains consistency
  - Clear rollback path
  - Handles distributed transactions
- **Cons**:
  - More complex code
  - Requires compensating actions
- **Effort**: Medium (2-4 hours)
- **Risk**: Medium

### Option 2: Sequential Execution
- **Implementation**: Execute operations one by one
- **Pros**:
  - Simpler error handling
  - Easy to implement
- **Cons**:
  - Slower performance
  - Still needs rollback logic
- **Effort**: Small
- **Risk**: Low

### Option 3: Database Transaction + Outbox
- **Implementation**: Use DB transaction with outbox pattern for external services
- **Pros**:
  - Guaranteed consistency
  - Reliable external calls
- **Cons**:
  - Requires infrastructure changes
  - More complex
- **Effort**: Large
- **Risk**: Medium

## Recommended Action
Implement saga pattern with compensating transactions

## Technical Details
- **Affected Files**:
  - `apps/api/src/trpc/routers/user.ts`
  - Similar patterns in other routers
- **Related Components**: User management, authentication
- **Database Changes**: Possible audit table for rollback

## Resources
- Saga pattern documentation
- Distributed transaction patterns
- TypeScript async error handling

## Acceptance Criteria
- [ ] Implement saga pattern for user deletion
- [ ] Add compensating transactions
- [ ] Test partial failure scenarios
- [ ] Ensure data consistency maintained
- [ ] Document rollback procedures
- [ ] Apply pattern to similar operations
- [ ] Add monitoring for partial failures

## Work Log

### 2025-10-28 - Initial Discovery
**By:** Claude Triage System
**Actions:**
- Identified race condition in user deletion
- Found lack of transaction coordination
- Categorized as P2 data integrity issue

**Learnings:**
- Promise.all without transactions is risky
- Distributed operations need coordination
- Compensating actions ensure consistency

## Notes
Source: Security analysis triage session on 2025-10-28
Important for data integrity and system reliability