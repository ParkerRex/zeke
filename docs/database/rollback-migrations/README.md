# Rollback Migrations

This directory contains rollback SQL files that are **NOT** automatically executed during normal migration runs.

## ⚠️ Important: Why This Directory Exists

Rollback migrations are stored here instead of in the main `apps/api/supabase/migrations/` folder to prevent them from being automatically executed when running `pnpm db:migrate`. 

If rollback migrations were placed in the main migrations folder, they would:
1. Auto-execute immediately after the optimizations
2. Undo the optimizations you just applied
3. Create confusion about the current database state

## 📁 Files in This Directory

### `20250914173620_rollback_rls_optimizations.sql`
Complete rollback for the RLS performance optimizations that:
- Reverts auth function optimizations back to original `auth.uid()` usage
- Restores multiple permissive policies structure
- Removes consolidated policies
- Restores original `is_admin_user()` function implementation

## 🚀 How to Use Rollback Migrations

### Option 1: Use the Rollback Script (Recommended)
```bash
# Local environment
./scripts/rollback-rls-optimizations.sh

# Production environment  
./scripts/rollback-rls-optimizations.sh --production
```

### Option 2: Manual Application
```bash
# Local
supabase db query --local "$(cat docs/database/rollback-migrations/20250914173620_rollback_rls_optimizations.sql)"

# Production
supabase db query --linked "$(cat docs/database/rollback-migrations/20250914173620_rollback_rls_optimizations.sql)"
```

## 🔄 Workflow After Rollback

After applying a rollback:

1. **Test Application**: Verify functionality is restored
2. **Investigate Issues**: Determine why the optimizations caused problems
3. **Fix and Re-apply**: Once issues are resolved, re-run `pnpm db:migrate` to re-apply optimizations

## 🛡️ Safety Measures

- **Automatic Backups**: The rollback script creates backups before applying changes
- **Verification**: Scripts verify the rollback was successful
- **Type Regeneration**: Database types are regenerated after rollback
- **No Auto-execution**: Files here never run automatically

## 📝 Adding New Rollback Migrations

When creating new rollback migrations:

1. **Never** place them in `apps/api/supabase/migrations/`
2. **Always** place them in this directory
3. **Include** comprehensive comments explaining what is being rolled back
4. **Test** the rollback thoroughly before committing
5. **Update** the rollback script if needed

## 🔍 Verifying Rollback Success

After rollback, verify:
```sql
-- Check original policies are restored
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('users', 'subscriptions', 'highlights')
ORDER BY tablename, policyname;

-- Check consolidated policies are removed  
SELECT COUNT(*) FROM pg_policies WHERE policyname LIKE '%_consolidated';

-- Check function definitions
SELECT proname, prosrc FROM pg_proc 
WHERE proname IN ('is_admin_user', 'is_worker_role');
```

## 📚 Related Documentation

- [RLS Optimization Guide](../rls-optimization-guide.md) - Complete optimization documentation
- [Migration Guidelines](../../rules/create-migration.md) - General migration best practices
- [Supabase Migration Docs](https://supabase.com/docs/guides/cli/local-development#database-migrations) - Official Supabase migration documentation
