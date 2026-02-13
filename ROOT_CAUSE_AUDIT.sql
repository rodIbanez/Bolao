-- =========================================================================
-- ROOT CAUSE ANALYSIS: GROUP CREATION DATA INTEGRITY FAILURE
-- =========================================================================

-- THE PROBLEM IDENTIFIED:
-- 1. Group is created in Supabase with correct ID
-- 2. Creator is inserted into user_groups table
-- 3. BUT: The `fetchGroups()` query in GroupSelector.tsx only queries the
--    `groups` table directly - it does NOT join with user_groups
-- 4. The filtering happens in the FRONTEND: myGroups = allGroups.filter(g => userGroupIds.includes(g.id))
-- 5. Since userGroupIds comes from App.tsx state (user.groupIds), which is
--    NOT being updated when the group is created, the group never shows

-- THE MISSING LINK:
-- When handleCreate succeeds:
--   a) Group is in Supabase groups table ✓
--   b) Creator is in Supabase user_groups table ✓
--   c) BUT user.groupIds in App.tsx state is NOT updated ✗
--   d) So myGroups filter shows empty ✗

-- =========================================================================
-- FIX 1: ENSURE user_groups TABLE HAS CORRECT RLS
-- =========================================================================

ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_can_insert_user_groups" ON user_groups;
DROP POLICY IF EXISTS "users_can_select_user_groups" ON user_groups;
DROP POLICY IF EXISTS "users_can_update_user_groups" ON user_groups;
DROP POLICY IF EXISTS "users_can_delete_user_groups" ON user_groups;

CREATE POLICY "users_can_insert_user_groups"
  ON user_groups
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
  );

CREATE POLICY "users_can_select_user_groups"
  ON user_groups
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
  );

CREATE POLICY "users_can_update_user_groups"
  ON user_groups
  FOR UPDATE
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
  );

CREATE POLICY "users_can_delete_user_groups"
  ON user_groups
  FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
  );

-- =========================================================================
-- FIX 2: VERIFY groups TABLE RLS
-- =========================================================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_can_insert_groups" ON groups;
DROP POLICY IF EXISTS "users_can_select_groups" ON groups;
DROP POLICY IF EXISTS "users_can_update_own_groups" ON groups;
DROP POLICY IF EXISTS "users_can_delete_own_groups" ON groups;

CREATE POLICY "users_can_insert_groups"
  ON groups
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND owner_user_id = auth.uid()
  );

CREATE POLICY "users_can_select_groups"
  ON groups
  FOR SELECT
  USING (
    is_private = false
    OR owner_user_id = auth.uid()
    OR auth.uid() IN (
      SELECT user_id FROM user_groups WHERE group_id = groups.id
    )
  );

CREATE POLICY "users_can_update_own_groups"
  ON groups
  FOR UPDATE
  WITH CHECK (
    auth.role() = 'authenticated'
    AND owner_user_id = auth.uid()
  );

CREATE POLICY "users_can_delete_own_groups"
  ON groups
  FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND owner_user_id = auth.uid()
  );

-- =========================================================================
-- VERIFICATION QUERIES
-- =========================================================================

-- Check if policies exist
SELECT policyname, cmd FROM pg_policies WHERE tablename IN ('user_groups', 'groups');

-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('user_groups', 'groups');

-- Check table structure
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_groups' ORDER BY ordinal_position;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'groups' ORDER BY ordinal_position;

-- Check foreign key constraints
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_name IN ('user_groups', 'groups') AND constraint_name IS NOT NULL;

-- Check unique constraints
SELECT constraint_name, table_name, constraint_type FROM information_schema.table_constraints 
WHERE table_name IN ('user_groups', 'groups');
