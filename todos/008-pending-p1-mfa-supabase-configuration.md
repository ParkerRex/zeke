---
status: pending
priority: p1
issue_id: "008"
tags: [security, authentication, mfa, configuration]
dependencies: []
---

# MFA Not Enabled on Supabase Backend

## Problem Statement
Multi-factor authentication (MFA) functionality exists in the UI but is not enabled on the Supabase backend. The MFAList component attempts to display MFA factors, but the underlying Supabase project doesn't have MFA enabled, creating a security gap where MFA appears functional but provides no actual protection.

## Findings
- **Location**: apps/dashboard/src/components/mfa-list.tsx:15
- UI components for MFA management exist
- Supabase MFA APIs are being called (`supabase.auth.mfa.listFactors()`)
- Backend MFA configuration is missing in Supabase project
- Users may believe they have MFA protection when they don't
- Accounts remain vulnerable to credential compromise

**Current Code:**
```typescript
// TODO: enable MFA on supabase.
export async function MFAList() {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  // ...
}
```

**Problem Scenario:**
1. User navigates to MFA settings in dashboard
2. UI displays MFA management interface
3. User attempts to enable MFA
4. Backend MFA is not configured in Supabase
5. MFA appears to work but provides no actual security
6. Account remains vulnerable to credential-only attacks

## Proposed Solutions

### Option 1: Enable MFA in Supabase Project (Recommended)
- **Implementation**:
  1. Access Supabase project dashboard
  2. Navigate to Authentication > Providers
  3. Enable MFA providers (TOTP recommended)
  4. Configure MFA settings (enrollment policies, etc.)
  5. Test full MFA enrollment flow
  6. Test MFA verification during login
  7. Update documentation
- **Pros**:
  - Significantly improves account security
  - Protects against credential compromise
  - Industry standard security practice
  - Supabase provides built-in support
- **Cons**:
  - May affect existing user login flow
  - Need to communicate MFA availability to users
  - May need gradual rollout strategy
- **Effort**: Small (< 2 hours)
- **Risk**: Low (Supabase handles most complexity)

### Option 2: Remove MFA UI Until Backend Ready
- **Implementation**: Hide/remove MFA components until backend configured
- **Pros**: No false sense of security
- **Cons**: Delays security improvement, removes existing UI work
- **Effort**: Small
- **Risk**: Low

## Recommended Action
Implement Option 1: Enable MFA in Supabase project immediately

## Technical Details
- **Affected Files**:
  - apps/dashboard/src/components/mfa-list.tsx
  - apps/dashboard/src/components/remove-mfa-button.tsx (likely)
  - Any MFA enrollment/management components
- **Related Components**: Authentication flow, user settings
- **Database Changes**: No (Supabase handles MFA tables)
- **Configuration Changes**: Yes (Supabase project settings)

## Resources
- Supabase MFA documentation: https://supabase.com/docs/guides/auth/auth-mfa
- TOTP RFC: https://datatracker.ietf.org/doc/html/rfc6238
- MFA best practices

## Acceptance Criteria
- [ ] Access Supabase project dashboard
- [ ] Enable MFA in Authentication settings
- [ ] Configure TOTP as MFA provider
- [ ] Test MFA enrollment flow end-to-end
- [ ] Test MFA verification during login
- [ ] Test MFA factor removal
- [ ] Verify MFA factors are properly stored
- [ ] Update user documentation with MFA instructions
- [ ] Remove TODO comment
- [ ] Notify users of MFA availability

## Work Log

### 2025-10-28 - Initial Discovery
**By:** Claude Triage System
**Actions:**
- Issue discovered during security TODO triage
- Categorized as 🔴 P1 (CRITICAL) due to authentication security gap
- Estimated effort: Small (< 2 hours)
- Primarily configuration work, not code changes

**Learnings:**
- UI components exist but backend not configured
- MFA is essential for production security
- Supabase provides built-in MFA support
- Configuration-only task, relatively quick to resolve

## Notes
Source: Triage session on 2025-10-28
**CRITICAL**: This is a security gap where users may believe they have MFA protection when they don't. Should be enabled before production launch or communicated clearly to users.
