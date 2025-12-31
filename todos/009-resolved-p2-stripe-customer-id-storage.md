---
status: pending
priority: p2
issue_id: "009"
tags: [database, schema, billing, stripe, integration]
dependencies: []
---

# Missing Stripe Customer ID Storage in Database

## Problem Statement
The Stripe webhook handler successfully processes checkout sessions and receives customer IDs, but cannot store them because the database schema doesn't have a field for `stripe_customer_id`. This prevents proper customer-to-team mapping, breaks subscription management, and requires manual intervention for billing issues.

## Findings
- **Primary Location**: apps/dashboard/src/app/api/webhooks/route.ts:71
- **Secondary Location**: apps/dashboard/src/app/api/webhooks/route.ts:112
- Webhook receives customer IDs but can only log them
- No database field to persist Stripe customer ID
- Customer-to-team mapping is broken
- Subscription events cannot resolve team without metadata
- Manual intervention needed for subscription management

**Current Code:**
```typescript
// Line 71
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const teamId = extractTeamId(session.metadata);
  const customerId = extractCustomerId(session.customer);

  if (!teamId || !customerId) return;

  // TODO: Store stripe customer ID when database schema is updated
  console.log(`Checkout completed for team ${teamId}, customer ${customerId}`);
}

// Line 112
async function resolveTeamId(supabase: Client, subscription: Stripe.Subscription): Promise<string | null> {
  const metadataTeamId = extractTeamId(subscription.metadata);
  if (metadataTeamId) return metadataTeamId;

  // TODO: Implement customer ID lookup when database schema is updated
  console.warn(`Cannot resolve team ID from customer for subscription ${subscription.id}`);
  return null;
}
```

**Problem Scenario:**
1. User completes Stripe checkout
2. Webhook receives `checkout.session.completed` event
3. Handler extracts `customerId` from session
4. Tries to store customer ID but no database field exists
5. Customer ID is logged but not persisted
6. Later subscription events arrive without team ID in metadata
7. Cannot map subscription to team via customer ID
8. Subscription update/cancellation fails
9. Manual database intervention required

## Proposed Solutions

### Option 1: Add stripe_customer_id to Teams Table (Recommended)
- **Implementation**:
  1. Create database migration to add `stripe_customer_id` field to teams table
  2. Add unique constraint on `stripe_customer_id` (one customer per team)
  3. Update `handleCheckoutSessionCompleted` to store customer ID
  4. Implement `resolveTeamId` lookup by customer ID
  5. Update team type definitions
  6. Test with Stripe test mode
- **Pros**:
  - Proper customer-to-team mapping
  - Enables subscription management without metadata
  - Supports Stripe dashboard operations
  - Future-proof for billing features
  - Clean data model
- **Cons**:
  - Requires database migration
  - Need to handle existing teams (backfill if needed)
- **Effort**: Medium (2-4 hours)
- **Risk**: Low (straightforward schema addition)

### Option 2: Separate Billing Table
- **Implementation**: Create separate `billing_customers` table
- **Pros**: Separates billing concerns, supports multiple customers per team
- **Cons**: More complex, likely overkill for current needs
- **Effort**: Medium-Large
- **Risk**: Medium

## Recommended Action
Implement Option 1: Add stripe_customer_id to teams table

## Technical Details
- **Affected Files**:
  - Database schema/migration files
  - apps/dashboard/src/app/api/webhooks/route.ts
  - Type definitions for teams
- **Related Components**:
  - Stripe webhook handlers
  - Subscription management
  - Team billing state
- **Database Changes**: Yes
  - Add `stripe_customer_id VARCHAR` to teams table
  - Add unique constraint
  - Consider index for lookup performance

**Proposed Schema Change:**
```sql
ALTER TABLE teams
ADD COLUMN stripe_customer_id VARCHAR(255) UNIQUE;

CREATE INDEX idx_teams_stripe_customer_id
ON teams(stripe_customer_id);
```

## Resources
- Stripe Customer object documentation
- Current webhook handler implementation
- Teams table schema
- Related TODO at line 221: plan_code schema update

## Acceptance Criteria
- [ ] Create database migration to add stripe_customer_id field
- [ ] Add unique constraint on stripe_customer_id
- [ ] Update teams type definitions
- [ ] Implement customer ID storage in handleCheckoutSessionCompleted
- [ ] Implement resolveTeamId lookup by customer ID
- [ ] Update updateTeamBillingState to use stored customer ID
- [ ] Test checkout flow stores customer ID correctly
- [ ] Test subscription events resolve team via customer ID
- [ ] Test subscription without metadata works via customer lookup
- [ ] Handle edge cases (missing customer ID, duplicate customers)
- [ ] Consider backfill strategy for existing teams if needed
- [ ] Remove TODO comments

## Work Log

### 2025-10-28 - Initial Discovery
**By:** Claude Triage System
**Actions:**
- Issue discovered during TODO triage
- Found 2 related TODOs in webhook handler
- Categorized as 🟡 P2 (IMPORTANT) - blocks proper billing
- Estimated effort: Medium (2-4 hours)

**Learnings:**
- Missing schema fields break integration features
- Stripe customer ID is essential for subscription management
- Current workaround relies on metadata being present
- Customer ID lookup enables Stripe dashboard operations

## Notes
Source: Triage session on 2025-10-28
Related to issue at line 221 (plan_code schema update). Consider addressing both schema changes together in a single migration.
