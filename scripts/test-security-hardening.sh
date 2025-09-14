#!/bin/bash

# Security Hardening Test Script
# This script validates that security fixes have been properly applied
# and that all functions are now secure against search path attacks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 Security Hardening Validation${NC}"
echo "=================================================="

# Function to run security test
run_security_test() {
    local test_name="$1"
    local sql="$2"
    local expected_result="$3"
    
    echo -e "\n${YELLOW}🔍 Testing: $test_name${NC}"
    
    result=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "$sql" 2>/dev/null | xargs)
    
    if [[ "$result" == "$expected_result" ]]; then
        echo -e "${GREEN}✅ PASS: $test_name${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL: $test_name${NC}"
        echo -e "Expected: $expected_result"
        echo -e "Got: $result"
        return 1
    fi
}

# Function to test search path security
test_search_path_security() {
    local function_name="$1"
    
    echo -e "\n${YELLOW}🔍 Testing search_path security for: $function_name${NC}"
    
    # Check if function has search_path = '' setting
    result=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "
    SELECT
        CASE
            WHEN proconfig IS NOT NULL AND 'search_path=\"\"' = ANY(proconfig) THEN 'SECURE'
            ELSE 'VULNERABLE'
        END
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = '$function_name';
    " 2>/dev/null | xargs)
    
    if [[ "$result" == "SECURE" ]]; then
        echo -e "${GREEN}✅ SECURE: $function_name has search_path = ''${NC}"
        return 0
    else
        echo -e "${RED}❌ VULNERABLE: $function_name missing search_path = ''${NC}"
        return 1
    fi
}

echo -e "\n${BLUE}🛡️ Function Search Path Security Tests${NC}"
echo "============================================"

# Test all critical functions for search_path security
CRITICAL_FUNCTIONS=(
    "is_admin_user"
    "is_worker_role" 
    "handle_new_user"
    "get_youtube_sources"
    "refresh_source_metrics"
    "tg_refresh_metrics_on_raw_items"
    "tg_refresh_metrics_on_contents"
    "tg_refresh_metrics_on_stories"
)

FAILED_TESTS=0

for func in "${CRITICAL_FUNCTIONS[@]}"; do
    if ! test_search_path_security "$func"; then
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
done

echo -e "\n${BLUE}🔍 Function Security Context Verification${NC}"
echo "============================================"

# Test 1: Verify SECURITY DEFINER functions have search_path
run_security_test "SECURITY DEFINER functions with search_path" "
SELECT COUNT(*)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('is_admin_user', 'is_worker_role', 'handle_new_user')
  AND p.prosecdef = true
  AND proconfig IS NOT NULL
  AND 'search_path=\"\"' = ANY(proconfig);
" "3"

# Test 2: Verify SECURITY INVOKER functions have search_path
run_security_test "SECURITY INVOKER functions with search_path" "
SELECT COUNT(*) 
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('get_youtube_sources', 'refresh_source_metrics', 
                   'tg_refresh_metrics_on_raw_items', 'tg_refresh_metrics_on_contents', 
                   'tg_refresh_metrics_on_stories')
  AND p.prosecdef = false
  AND proconfig IS NOT NULL
  AND 'search_path=\"\"' = ANY(proconfig);
" "5"

# Test 3: Verify no functions are missing search_path
run_security_test "No critical functions missing search_path" "
SELECT COUNT(*) 
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('is_admin_user', 'is_worker_role', 'handle_new_user',
                   'get_youtube_sources', 'refresh_source_metrics',
                   'tg_refresh_metrics_on_raw_items', 'tg_refresh_metrics_on_contents', 
                   'tg_refresh_metrics_on_stories')
  AND (proconfig IS NULL OR NOT ('search_path=\"\"') = ANY(proconfig));
" "0"

echo -e "\n${BLUE}🔧 Vector Extension Security Tests${NC}"
echo "============================================"

# Test 4: Verify vector extension is in extensions schema
run_security_test "Vector extension in extensions schema" "
SELECT COUNT(*) 
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname = 'vector' AND n.nspname = 'extensions';
" "1"

# Test 5: Verify no vector extension in public schema
run_security_test "No vector extension in public schema" "
SELECT COUNT(*) 
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname = 'vector' AND n.nspname = 'public';
" "0"

# Test 6: Verify vector functionality still works
echo -e "\n${YELLOW}🔍 Testing: Vector functionality after migration${NC}"
vector_test_result=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "
SELECT extensions.vector_dims('[1,2,3]'::extensions.vector);
" 2>/dev/null | xargs)

if [[ "$vector_test_result" == "3" ]]; then
    echo -e "${GREEN}✅ PASS: Vector functionality works after migration${NC}"
else
    echo -e "${RED}❌ FAIL: Vector functionality broken after migration${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo -e "\n${BLUE}🛡️ RLS Policy Function Security Tests${NC}"
echo "============================================"

# Test 7: Verify RLS policies still work with secured functions
echo -e "\n${YELLOW}🔍 Testing: RLS policies work with secured is_admin_user function${NC}"
rls_test_result=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "
SELECT public.is_admin_user();
" 2>/dev/null | xargs)

if [[ "$rls_test_result" == "f" ]] || [[ "$rls_test_result" == "t" ]]; then
    echo -e "${GREEN}✅ PASS: is_admin_user function works after security hardening${NC}"
else
    echo -e "${RED}❌ FAIL: is_admin_user function broken after security hardening${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 8: Verify worker role function works
echo -e "\n${YELLOW}🔍 Testing: is_worker_role function works${NC}"
worker_test_result=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "
SELECT public.is_worker_role();
" 2>/dev/null | xargs)

if [[ "$worker_test_result" == "f" ]] || [[ "$worker_test_result" == "t" ]]; then
    echo -e "${GREEN}✅ PASS: is_worker_role function works after security hardening${NC}"
else
    echo -e "${RED}❌ FAIL: is_worker_role function broken after security hardening${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo -e "\n${BLUE}📊 Security Hardening Summary${NC}"
echo "============================================"

# Show final security status
echo "Function security status:"
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
SELECT 
    proname,
    prosecdef as is_security_definer,
    CASE 
        WHEN proconfig IS NOT NULL AND 'search_path=\"\"' = ANY(proconfig) THEN '✅ SECURE'
        ELSE '❌ VULNERABLE'
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('is_admin_user', 'is_worker_role', 'handle_new_user',
                   'get_youtube_sources', 'refresh_source_metrics',
                   'tg_refresh_metrics_on_raw_items', 'tg_refresh_metrics_on_contents', 
                   'tg_refresh_metrics_on_stories')
ORDER BY proname;
"

# Show extension security status
echo -e "\nExtension security status:"
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
SELECT 
    extname,
    nspname as schema_name,
    CASE 
        WHEN nspname = 'extensions' THEN '✅ SECURE'
        WHEN nspname = 'public' THEN '❌ VULNERABLE'
        ELSE '⚠️ UNKNOWN'
    END as security_status
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname = 'vector';
"

echo -e "\n${BLUE}🎯 Security Advisor Checklist${NC}"
echo "============================================"

echo -e "${YELLOW}Manual Verification Steps:${NC}"
echo "1. 🌐 Access Supabase Dashboard: https://supabase.com/dashboard"
echo "2. 🔒 Navigate to: Project → Settings → Security Advisor"
echo "3. ✅ Verify these warnings are RESOLVED:"
echo "   - Function Search Path Mutable warnings (8 functions)"
echo "   - Extension in Public Schema warning"
echo "4. 🛡️ Verify no new security warnings have appeared"

if [[ $FAILED_TESTS -eq 0 ]]; then
    echo -e "\n${GREEN}🎉 All Security Tests Passed!${NC}"
    echo "============================================"
    echo "✅ All critical functions have secure search_path settings"
    echo "✅ Vector extension moved to extensions schema"
    echo "✅ RLS policies continue to work correctly"
    echo "✅ No functionality has been broken"
    echo ""
    echo "The database is now hardened against:"
    echo "- Search path manipulation attacks"
    echo "- Function hijacking attacks"
    echo "- Privilege escalation vulnerabilities"
else
    echo -e "\n${RED}❌ Security Tests Failed: $FAILED_TESTS issues found${NC}"
    echo "============================================"
    echo "Please review the failed tests above and fix the issues"
    echo "before deploying to production."
    exit 1
fi
