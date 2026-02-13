-- RLS Fix for user_groups Table
-- Enable RLS and create comprehensive policies for INSERT, SELECT, UPDATE, DELETE

-- Step 1: Enable RLS on user_groups table
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies (if any) to ensure clean state
DROP POLICY IF EXISTS "users_can_insert_user_groups" ON user_groups;
DROP POLICY IF EXISTS "users_can_select_user_groups" ON user_groups;
DROP POLICY IF EXISTS "users_can_update_user_groups" ON user_groups;
DROP POLICY IF EXISTS "users_can_delete_user_groups" ON user_groups;

-- Step 3: CREATE INSERT POLICY
-- Allow authenticated users to insert themselves into user_groups
CREATE POLICY "users_can_insert_user_groups"
  ON user_groups
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()  -- Can only add themselves
  );

-- Step 4: CREATE SELECT POLICY
-- Allow authenticated users to see their own memberships and groups they're in
CREATE POLICY "users_can_select_user_groups"
  ON user_groups
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()  -- Can only see their own memberships
  );

-- Step 5: CREATE UPDATE POLICY
-- Allow authenticated users to update their own memberships
CREATE POLICY "users_can_update_user_groups"
  ON user_groups
  FOR UPDATE
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
  );

-- Step 6: CREATE DELETE POLICY
-- Allow authenticated users to delete their own memberships
CREATE POLICY "users_can_delete_user_groups"
  ON user_groups
  FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
  );

-- Verification: Check that RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'user_groups';

-- Verification: Check that policies are created
SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'user_groups';
