-- =========================================================================
-- EMERGENCY FIX - BOLAO-PROD
-- =========================================================================
-- Purpose: Fix RLS 42501 "Permission Denied" error on group creation
-- Issue: SELECT policy circular subquery dependency
-- Date: Feb 13, 2026
-- 
-- Run this in: Supabase SQL Editor (Bolao-Prod)
-- =========================================================================

-- =========================================================================
-- STEP 1: Drop the problematic SELECT policy
-- =========================================================================
-- The current SELECT policy checks:
-- auth.uid() IN (SELECT user_id FROM user_groups WHERE group_id = groups.id)
-- 
-- This creates a circular dependency:
-- - During INSERT of a NEW group, this subquery tries to check user_groups
-- - But the group doesn't exist yet, so RLS blocks the query
-- - Result: INSERT fails with 42501 "Permission Denied"
-- =========================================================================

DROP POLICY IF EXISTS "users_can_select_groups" ON groups;

-- =========================================================================
-- STEP 2: Create a simplified SELECT policy WITHOUT the circular subquery
-- =========================================================================
-- New policy:
-- - Users can see public groups (is_private = false)
-- - Users can see groups they own (owner_user_id = auth.uid())
-- - Users can see groups via user_groups membership (handled at app level)
-- =========================================================================

CREATE POLICY "users_can_select_groups"
  ON groups
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (
      is_private = false
      OR owner_user_id = auth.uid()
    )
  );

-- =========================================================================
-- STEP 3: Verify the policies are now correct
-- =========================================================================
-- Run these queries to verify the fix was applied correctly

-- Query 1: Check INSERT policy (should NOT have changed)
SELECT 
  policyname,
  polcmd,
  pg_get_expr(with_check_qual, polrelid) as with_check
FROM pg_policy
WHERE polname = 'users_can_insert_groups'
  AND polobject IN (SELECT oid FROM pg_class WHERE relname = 'groups');

-- Expected output:
-- policyname: users_can_insert_groups
-- polcmd: a (INSERT)
-- with_check: (auth.role() = 'authenticated'::text) AND (owner_user_id = auth.uid())

-- Query 2: Check SELECT policy (should be the FIXED version)
SELECT 
  policyname,
  polcmd,
  pg_get_expr(qual, polrelid) as using_condition
FROM pg_policy
WHERE polname = 'users_can_select_groups'
  AND polobject IN (SELECT oid FROM pg_class WHERE relname = 'groups');

-- Expected output (should NOT include subquery about user_groups):
-- policyname: users_can_select_groups
-- polcmd: r (SELECT)
-- using_condition: (auth.role() = 'authenticated'::text) AND ((is_private = false) OR (owner_user_id = auth.uid()))

-- Query 3: Count policies to ensure no duplicates
SELECT COUNT(*) as policy_count 
FROM pg_policies 
WHERE tablename = 'groups';

-- Expected: Should be exactly 4 policies (INSERT, SELECT, UPDATE, DELETE)

-- =========================================================================
-- STEP 4: Test the fix (optional - can run from application)
-- =========================================================================
-- To verify the fix works, try this query as an authenticated user:
-- 
-- INSERT INTO groups (code, name, owner_user_id, initials, language_default, is_private, status)
-- VALUES ('TEST001', 'Test Group', auth.uid(), 'TST', 'pt', false, 'ACTIVE');
-- 
-- If this succeeds without 42501 error, the fix worked!

-- =========================================================================
-- END OF EMERGENCY FIX
-- =========================================================================
-- Summary:
-- ✅ Removed circular subquery from SELECT policy
-- ✅ Simplified SELECT logic: public groups OR owned groups
-- ✅ Maintained authentication requirement
-- ✅ INSERT and UPDATE/DELETE policies unchanged
-- 
-- Next step: 
-- 1. Restart dev server: npm run dev
-- 2. Test group creation in Production
-- 3. Verify group appears in "My Groups"
-- =========================================================================
