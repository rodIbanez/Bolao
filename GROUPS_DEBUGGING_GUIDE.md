# Groups Table Debugging Guide

## Issue Summary
- UI shows "GRUPO 1" group loaded from localStorage
- Supabase groups table is empty
- Group creation/join operations failing with permission errors

## Root Cause
1. **localStorage vs Supabase mismatch**: GroupSelector.tsx was loading groups from localStorage (`JSON.parse(localStorage.getItem('wc_groups_db') || '[]')`) instead of fetching from Supabase
2. **Missing RLS policies**: groups table INSERT policy not properly configured
3. **Insert payload issues**: Old code tried to insert `id` (client-generated) which may conflict with RLS or cause issues

## Files Already Updated ✅

### 1. `components/GroupSelector.tsx`
**Changes Made:**
- Removed localStorage reading in initial state
- Added `useEffect` hook to fetch groups from Supabase on mount
- Updated `fetchGroups()` to query `supabase.from('groups').select('*')`
- Updated `handleCreate()` to:
  - Remove client-generated ID (let Supabase auto-generate)
  - Add detailed error logging with error.code, error.message, error.details
  - Check for error code '23505' (unique constraint) and '42501' (permission denied)
  - Call `fetchGroups()` after successful creation to refresh list
  - Use `setLoading(true/false)` for better UX
- Updated `handleJoin()` to:
  - Add detailed error logging
  - Use uppercase for group code comparison
  - Check for error codes and provide specific error messages
  - Call `fetchGroups()` after successful join

## Next Steps to Complete

### Step 1: Run RLS Fix SQL
Execute the SQL in `fix_groups_rls_comprehensive.sql` in your Supabase SQL editor:
1. Go to: https://wpipkzhqksdmarzvlnrm.supabase.co/project/default/sql
2. Create a new query
3. Copy the entire contents of `fix_groups_rls_comprehensive.sql`
4. Run the query
5. Verify all policies are created (check the output at the bottom)

**What this SQL does:**
- Disables and re-enables RLS on groups table
- Drops any existing policies
- Creates 4 new policies:
  1. INSERT: Users can create groups (must set owner_user_id to their own ID)
  2. SELECT: Users can view public groups or groups they own/are members of
  3. UPDATE: Users can only update groups they own
  4. DELETE: Users can only delete groups they own

### Step 2: Verify the Fix
1. Open browser DevTools (F12)
2. Open Application > Local Storage
3. Check if `wc_groups_db` exists - if it does, it contains old fake data
4. Optional: Delete it to avoid confusion (but it shouldn't affect Supabase)
5. Go to the app and try creating a new group
6. Watch the console for detailed logging:
   - "🔍 Checking if group name already exists: [NAME]"
   - "✅ Group name is available. Creating group..."
   - "📝 Inserting group with payload: {...}"
   - "✅ Group created successfully: {...}" OR "❌ SUPABASE ERROR: ..."

### Step 3: Troubleshooting Common Errors

**Error: "Permission denied" (42501)**
- Means INSERT policy is missing or incorrect
- Solution: Re-run `fix_groups_rls_comprehensive.sql`

**Error: "Duplicate key value violates unique constraint" (23505)**
- Means group name already exists
- This is expected and handled in the code

**Error: "new row violates row-level security policy"**
- Means INSERT check is failing (auth.uid() or owner_user_id mismatch)
- Check that you're logged in and session.session.user.id is correct
- Add console.log for userId before insert

**Error: "Failed to execute INSERT" with no specific code**
- Could be missing fields in the insert payload
- Check that all fields match database schema exactly:
  - Required: code, name, owner_user_id
  - Optional: description, photo_url, language_default, is_private, status

### Step 4: Test All Scenarios

**Test 1: Create a new group**
1. Click "Create New Group"
2. Enter: Name = "Test Group 1", Description = "Test", Language = "EN"
3. Click Create
4. Expected: Group appears in list, console shows "✅ Group created successfully"
5. Verify in Supabase: https://wpipkzhqksdmarzvlnrm.supabase.co/project/default/editor/11898
   - Query: `SELECT * FROM groups WHERE name = 'Test Group 1';`

**Test 2: Try duplicate group name**
1. Try to create another group with same name "Test Group 1"
2. Expected: Error message "Group name already taken. Please choose a different name."

**Test 3: Join group by code**
1. Get code from created group (visible in group details)
2. Log in as different user
3. Click "Join Group by Code"
4. Enter the code
5. Expected: "Successfully joined group" message

**Test 4: Try invalid code**
1. Try to join with code "INVALID"
2. Expected: Error message "Invalid group code. Please check and try again."

## File Structure Reference
```
components/GroupSelector.tsx
├── fetchGroups() - Fetches from Supabase, not localStorage
├── generateGroupCode() - Generates unique 7-char codes
├── handleCreate() - Creates group in Supabase with error logging
├── handleJoin() - Joins group via code with error logging
└── ... other handlers
```

## Database Schema Reference
```
groups table:
- id (UUID, primary key, auto-generated)
- code (TEXT UNIQUE, required)
- name (TEXT UNIQUE, required)
- description (TEXT, nullable)
- photo_url (TEXT, nullable)
- initials (TEXT, nullable)
- language_default (TEXT, default 'EN')
- owner_user_id (UUID, required, refs auth.users.id)
- is_private (BOOLEAN, default false)
- status (TEXT, default 'ACTIVE')
- created_at (TIMESTAMP, auto-generated)
- updated_at (TIMESTAMP, auto-generated)

user_groups table:
- id (UUID, primary key, auto-generated)
- user_id (UUID, required, refs auth.users.id)
- group_id (UUID, required, refs groups.id)
- role (TEXT, default 'MEMBER')
- joined_at (TIMESTAMP, auto-generated)
- is_active (BOOLEAN, default true)
- UNIQUE(user_id, group_id) - prevents duplicate memberships
```

## Expected Console Output After Fix

### Successful Group Creation:
```
🔍 Checking if group name already exists: Test Group
✅ Group name is available. Creating group...
📝 Inserting group with payload: {
  code: "ABC1234",
  name: "Test Group",
  description: "My test group",
  owner_user_id: "550e8400-e29b-41d4-a716-446655440000",
  language_default: "EN",
  is_private: false,
  status: "ACTIVE"
}
✅ Group created successfully: {
  id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  code: "ABC1234",
  name: "Test Group",
  ... other fields
}
```

### Error Case (Permission Denied):
```
❌ SUPABASE ERROR creating group:
  Code: 42501
  Message: new row violates row-level security policy for table "groups"
  Details: null
  Full Error: {
    "code": "42501",
    "message": "new row violates row-level security policy for table \"groups\"",
    ...
  }
```

## Important Notes
- Do NOT manually generate UUIDs for groups - let Supabase create them
- Do NOT store groups in localStorage anymore - always fetch from Supabase
- The old localStorage data can cause confusion - consider clearing it after testing
- All error codes (23505, 42501, etc.) are PostgreSQL error codes that help identify the exact issue

## Database Verification Commands
Run these in Supabase SQL editor to verify your setup:

```sql
-- Check if groups table exists
SELECT * FROM information_schema.tables WHERE table_name = 'groups';

-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'groups';

-- Check policies
SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'groups';

-- Check unique constraints
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name = 'groups' AND constraint_type = 'UNIQUE';

-- Verify data
SELECT * FROM groups LIMIT 10;
SELECT * FROM user_groups LIMIT 10;
```

## Summary Checklist
- [ ] Read this entire guide
- [ ] Run `fix_groups_rls_comprehensive.sql` in Supabase
- [ ] Verify policies are created
- [ ] Restart dev server (`npm run dev`)
- [ ] Open console and test group creation
- [ ] Check console for detailed logging
- [ ] Verify group appears in Supabase
- [ ] Test join by code with another user
- [ ] Test duplicate name prevention
