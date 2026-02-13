-- Comprehensive RLS fix for groups table
-- This script ensures groups table has proper INSERT, SELECT, UPDATE, DELETE policies

-- First, check current RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'groups';

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "users_can_insert_groups" ON groups;
DROP POLICY IF EXISTS "users_can_select_groups" ON groups;
DROP POLICY IF EXISTS "users_can_update_own_groups" ON groups;
DROP POLICY IF EXISTS "users_can_delete_own_groups" ON groups;

-- Re-enable RLS on groups table (idempotent)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to insert groups
CREATE POLICY "users_can_insert_groups"
  ON groups
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND owner_user_id = auth.uid()
  );

-- Policy 2: Allow users to select groups (public read)
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

-- Policy 3: Allow owners to update their groups
CREATE POLICY "users_can_update_own_groups"
  ON groups
  FOR UPDATE
  WITH CHECK (
    auth.role() = 'authenticated'
    AND owner_user_id = auth.uid()
  );

-- Policy 4: Allow owners to delete their groups
CREATE POLICY "users_can_delete_own_groups"
  ON groups
  FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND owner_user_id = auth.uid()
  );

-- Verify policies were created
SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'groups';
