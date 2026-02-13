-- Verification and Debugging Queries for Groups Table

-- ====================================
-- 1. CHECK RLS STATUS
-- ====================================
-- Verify RLS is enabled on groups table
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'groups';

-- Expected output: 
-- | tablename | RLS Enabled |
-- |-----------|-------------|
-- | groups    | t           |


-- ====================================
-- 2. CHECK POLICIES
-- ====================================
-- List all policies on groups table
SELECT 
  policyname,
  cmd as "Operation",
  qual as "Using (Filter for SELECT/DELETE)",
  with_check as "With Check (for INSERT/UPDATE)"
FROM pg_policies 
WHERE tablename = 'groups'
ORDER BY cmd;

-- Expected output: 4 rows with commands INSERT, SELECT, UPDATE, DELETE


-- ====================================
-- 3. CHECK UNIQUE CONSTRAINTS
-- ====================================
-- Verify unique constraints on name and code
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'groups'
ORDER BY constraint_name;

-- Expected output: Should include UNIQUE constraints on 'name' and 'code'


-- ====================================
-- 4. CHECK TABLE STRUCTURE
-- ====================================
-- Verify all required columns exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'groups'
ORDER BY ordinal_position;

-- Expected columns:
-- id, code, name, description, photo_url, initials, 
-- language_default, owner_user_id, is_private, status, created_at, updated_at


-- ====================================
-- 5. VIEW CURRENT DATA
-- ====================================
-- See all groups (useful for debugging)
SELECT 
  id,
  code,
  name,
  owner_user_id,
  created_at,
  is_private,
  status
FROM groups
ORDER BY created_at DESC
LIMIT 20;


-- ====================================
-- 6. CHECK USER-GROUP RELATIONSHIPS
-- ====================================
-- See which users are in which groups
SELECT 
  ug.user_id,
  ug.group_id,
  g.name as group_name,
  ug.role,
  ug.joined_at
FROM user_groups ug
LEFT JOIN groups g ON ug.group_id = g.id
ORDER BY ug.joined_at DESC
LIMIT 20;


-- ====================================
-- 7. TEST INSERT PERMISSION (as authenticated user)
-- ====================================
-- This simulates what the app does when creating a group
-- Replace YOUR_USER_ID with actual UUID from auth.users
INSERT INTO groups (code, name, owner_user_id, status)
VALUES (
  'TEST1234',
  'Test Group ' || NOW()::text,
  'YOUR_USER_ID',
  'ACTIVE'
)
RETURNING id, code, name;

-- If this fails with "new row violates row-level security policy"
-- then the INSERT policy is missing or incorrect


-- ====================================
-- 8. VERIFY AUTH CONTEXT
-- ====================================
-- Check current auth session info (run after logging in)
SELECT auth.uid() as current_user_id;

-- This should return your UUID if you're logged in
-- If it returns NULL, you're not authenticated


-- ====================================
-- 9. CHECK FOR DUPLICATE NAMES
-- ====================================
-- Find any duplicate group names (should be 0 rows)
SELECT 
  name,
  COUNT(*) as count
FROM groups
GROUP BY name
HAVING COUNT(*) > 1;

-- Should return empty result (0 rows)


-- ====================================
-- 10. DETAILED POLICY VIEW
-- ====================================
-- See detailed policy definitions (PostgreSQL specific)
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual as "WHERE condition for SELECT/DELETE",
  with_check as "WITH CHECK for INSERT/UPDATE",
  cmd
FROM pg_policies
WHERE tablename = 'groups'
ORDER BY cmd;


-- ====================================
-- 11. COUNT STATISTICS
-- ====================================
-- Quick stats about the groups table
SELECT
  (SELECT COUNT(*) FROM groups) as total_groups,
  (SELECT COUNT(DISTINCT owner_user_id) FROM groups) as unique_owners,
  (SELECT COUNT(*) FROM user_groups) as total_memberships,
  (SELECT COUNT(DISTINCT user_id) FROM user_groups) as total_users_in_groups;


-- ====================================
-- 12. DEBUG: Show everything about specific group
-- ====================================
-- Use this to inspect a specific group and its members
-- Replace 'Test Group 1' with actual group name
SELECT 
  g.id,
  g.code,
  g.name,
  g.owner_user_id,
  g.is_private,
  g.status,
  g.created_at,
  COUNT(ug.user_id) as member_count
FROM groups g
LEFT JOIN user_groups ug ON g.id = ug.group_id
WHERE g.name = 'Test Group 1'
GROUP BY g.id, g.code, g.name, g.owner_user_id, g.is_private, g.status, g.created_at;


-- ====================================
-- 13. REFRESH POLICY CACHE (if needed)
-- ====================================
-- Sometimes PostgreSQL needs to refresh its policy cache
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;


-- ====================================
-- 14. EXPORT FOR DEBUGGING
-- ====================================
-- Get all relevant info as JSON for debugging
SELECT jsonb_build_object(
  'rls_enabled', (SELECT rowsecurity FROM pg_tables WHERE tablename = 'groups'),
  'policies', (SELECT jsonb_agg(row_to_json(t)) FROM (
    SELECT policyname, cmd FROM pg_policies WHERE tablename = 'groups'
  ) t),
  'constraints', (SELECT jsonb_agg(constraint_name) FROM (
    SELECT constraint_name FROM information_schema.table_constraints 
    WHERE table_name = 'groups'
  ) t),
  'row_count', (SELECT COUNT(*) FROM groups)
) as debug_info;
