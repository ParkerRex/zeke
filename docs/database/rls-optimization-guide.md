# RLS Performance Optimization Guide

This document describes the RLS (Row Level Security) performance optimizations implemented to resolve Supabase Performance Advisor warnings in the ZEKE database.

## Overview

The optimizations address two main performance issues identified by Supabase Performance Advisor:

1. **Auth RLS Initialization Issues**: RLS policies re-evaluating `auth.<function>()` calls for each row
2. **Multiple Permissive Policies**: Multiple permissive policies for the same role/action causing performance degradation

## Performance Issues Resolved

### Auth Function Re-evaluation (8 tables)

**Problem**: RLS policies using `auth.uid()` directly cause the function to be called for every row being evaluated.

**Tables Affected**:
- `users` - User profile data
- `subscriptions` - User subscription information  
- `highlights` - User-created content highlights
- `source_metrics` - Source performance metrics (admin access)
- `platform_quota` - Platform usage quotas (admin access)
- `source_health` - Source health monitoring (admin access)
- `job_metrics` - Background job metrics (admin access)

**Solution**: Replace `auth.uid()` with `(SELECT auth.uid())` to cache the result per query.

### Multiple Permissive Policies (9 tables)

**Problem**: Multiple permissive policies for the same operation require PostgreSQL to evaluate all policies and combine results with OR logic.

**Tables Affected**:
- `clusters` - Story clustering data
- `contents` - Extracted content data
- `sources` - Content source definitions
- `stories` - Processed story data
- `story_embeddings` - Vector embeddings for stories
- `story_overlays` - AI analysis overlays
- `platform_quota` - Platform quotas (worker policies)
- `source_health` - Source health (worker policies)
- `job_metrics` - Job metrics (worker policies)

**Solution**: Consolidate overlapping policies into single policies with OR conditions.

## Migration Files

### 1. Auth Function Optimization
**File**: `20250914173416_optimize_rls_auth_functions.sql`

**Changes**:
- Optimizes `auth.uid()` calls in RLS policies
- Updates `is_admin_user()` function to cache `auth.uid()` result
- Splits combined policies into granular SELECT/INSERT/UPDATE/DELETE policies
- Maintains identical security behavior

### 2. Policy Consolidation  
**File**: `20250914173444_consolidate_permissive_policies.sql`

**Changes**:
- Consolidates multiple permissive policies into single optimized policies
- Creates `is_worker_role()` helper function for better caching
- Uses OR conditions within policies instead of multiple policy evaluation
- Maintains identical access control semantics

### 3. Rollback SQL (Not a Migration)
**File**: `docs/database/rollback-migrations/20250914173620_rollback_rls_optimizations.sql`

**Purpose**: Provides complete rollback to original policy structure if issues arise.
**Location**: Stored outside the migrations folder to prevent automatic execution.
**Usage**: Applied via rollback script or manual SQL execution only.

## Testing and Validation

### Automated Testing
Run the comprehensive test script:
```bash
./scripts/test-rls-optimization.sh
```

This script validates:
- Policy existence and counts
- Function optimizations
- Security behavior preservation
- Migration completeness

### Manual Validation Steps

1. **Policy Verification**:
```sql
-- Check policy counts per table
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename
ORDER BY tablename;
```

2. **Function Optimization Check**:
```sql
-- Verify is_admin_user function is optimized
SELECT prosrc FROM pg_proc 
WHERE proname = 'is_admin_user' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

3. **Access Control Testing**:
- Test user access to own data (users, subscriptions, highlights)
- Test admin access to admin tables (source_metrics, platform_quota, etc.)
- Test worker role access to pipeline tables
- Test authenticated user read access to public content

## Performance Impact Assessment

### Expected Improvements

1. **Query Performance**:
   - Reduced function call overhead for large result sets
   - Better query plan optimization due to stable function evaluation
   - Improved cache utilization for auth context

2. **Policy Evaluation**:
   - Faster permission resolution for large result sets
   - Reduced policy evaluation overhead
   - Better query plan optimization due to simplified policy structure

3. **Resource Usage**:
   - Lower CPU usage for auth function calls
   - Reduced memory allocation for policy evaluation
   - Better connection pool efficiency

### Measurement Approach

Before and after optimization, measure:

1. **Query Execution Time**:
```sql
-- Example: Measure story list query performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM stories LIMIT 100;
```

2. **Policy Evaluation Overhead**:
```sql
-- Check policy evaluation in query plans
EXPLAIN (ANALYZE, VERBOSE) 
SELECT * FROM clusters WHERE cluster_key = 'example';
```

3. **Function Call Frequency**:
Monitor `auth.uid()` call frequency in database logs during typical operations.

## Security Verification

### Access Control Matrix

| Table | Admin | Worker | Authenticated | Anonymous |
|-------|-------|--------|---------------|-----------|
| users | No | No | Own data only | No |
| subscriptions | No | No | Own data only | No |
| highlights | No | No | Own data only | No |
| source_metrics | Yes | No | No | No |
| platform_quota | Yes | Yes (all ops) | No | No |
| source_health | Yes | Yes (all ops) | No | No |
| job_metrics | Yes | Yes (all ops) | No | No |
| clusters | Yes | Yes (all ops) | Read only | No |
| contents | Yes | Yes (all ops) | Read only | No |
| sources | Yes | Yes (all ops) | Read active only | No |
| stories | Yes | Yes (all ops) | Read only | No |
| story_embeddings | Yes | Yes (all ops) | Read only | No |
| story_overlays | Yes | Yes (all ops) | Read only | No |

### Security Validation Tests

1. **User Isolation**: Verify users can only access their own data
2. **Admin Privileges**: Verify admin users have appropriate access
3. **Worker Permissions**: Verify worker role has correct pipeline access
4. **Public Content**: Verify authenticated users can read public content
5. **Anonymous Access**: Verify anonymous users are properly restricted

## Rollback Procedures

### Important: Rollback Migration Location
The rollback SQL is stored in `docs/database/rollback-migrations/` to prevent automatic execution during normal migrations. **Never place rollback migrations in the main migrations folder** as they would auto-execute and undo your optimizations.

### Emergency Rollback
If critical issues arise immediately after deployment:

```bash
# Local environment rollback
./scripts/rollback-rls-optimizations.sh

# Production environment rollback
./scripts/rollback-rls-optimizations.sh --production
```

This script will:
1. Create a backup before rollback
2. Apply the rollback SQL directly (not as a migration)
3. Verify the rollback was successful
4. Regenerate database types

### Manual Rollback (Alternative)
If you prefer manual control, you can apply the rollback SQL directly:

```bash
# Local
supabase db query --local "$(cat docs/database/rollback-migrations/20250914173620_rollback_rls_optimizations.sql)"

# Production
supabase db query --linked "$(cat docs/database/rollback-migrations/20250914173620_rollback_rls_optimizations.sql)"
```

### Partial Rollback
If only specific tables have issues, manually revert policies:

```sql
-- Example: Revert users table to original policies
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

CREATE POLICY "Can view own user data." ON public.users
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Can update own user data." ON public.users
  FOR UPDATE TO authenticated USING (auth.uid() = id);
```

### Re-applying Optimizations After Rollback
After a rollback, if you want to re-apply the optimizations:

```bash
# The optimization migrations are still in the migrations folder
# They will be re-applied on next migration run
pnpm db:migrate
```

## Deployment Checklist

### Pre-deployment
- [ ] Run local testing with `./scripts/test-rls-optimization.sh`
- [ ] Verify application functionality with optimized policies
- [ ] Create database backup
- [ ] Document current performance baseline

### Deployment
- [ ] Apply migrations during low-traffic period
- [ ] Monitor application logs for errors
- [ ] Verify policy counts and structure
- [ ] Test critical user flows

### Post-deployment
- [ ] Monitor query performance improvements
- [ ] Verify no security regressions
- [ ] Document performance gains
- [ ] Update monitoring dashboards

## Troubleshooting

### Common Issues

1. **Policy Not Found Errors**:
   - Verify migration applied completely
   - Check policy names match application expectations

2. **Access Denied Errors**:
   - Verify user roles and permissions
   - Check `is_admin_user()` and `is_worker_role()` functions

3. **Performance Regression**:
   - Check query plans for policy evaluation
   - Verify function optimization applied correctly

### Debug Queries

```sql
-- List all policies for a table
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Check function definitions
SELECT proname, prosrc FROM pg_proc WHERE proname IN ('is_admin_user', 'is_worker_role');

-- Analyze query performance
EXPLAIN (ANALYZE, BUFFERS, VERBOSE) YOUR_QUERY_HERE;
```

## Conclusion

These RLS optimizations provide significant performance improvements while maintaining identical security behavior. The changes are designed to be safe, reversible, and thoroughly tested.

For questions or issues, refer to the troubleshooting section or consult the database team.
