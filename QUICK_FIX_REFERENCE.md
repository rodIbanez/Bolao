# QUICK REFERENCE - Production RLS Fix

## Problem
```
Error: "Permission denied. You do not have permission to create groups"
Code: 42501 (RLS policy rejected INSERT)
Component: GroupSelector.tsx handleCreate()
```

## Root Cause
**snake_case ↔ camelCase mismatch between PostgreSQL schema and TypeScript types**

Database sends: `owner_user_id`, `photo_url`, `language_default`  
TypeScript expects: `ownerUserId`, `photoUrl`, `languageDefault`

## Solution Applied
✅ Added mapping layer in `fetchGroups()` - converts all snake_case to camelCase  
✅ Added mapping layer in `handleCreate()` - maps response before sending to App.tsx  
✅ Added auth diagnostics - logs session details before INSERT  
✅ Added payload logging - shows exact data being sent to Supabase  

## Files Changed
**components/GroupSelector.tsx**
- Line 59-90: `fetchGroups()` - Added explicit mapping
- Line 240-255: `handleCreate()` - Added auth diagnostics
- Line 313-330: `handleCreate()` - Added response mapping
- Line 333-339: `handleCreate()` - Enhanced STEP 2 logging
- Line 369: `handleCreate()` - Pass mapped group to `onCreateGroup()`

## Verification Steps

### Step 1: Check TypeScript Compilation
```bash
npm run dev
# Should start without errors
```

### Step 2: Test Group Creation
1. Open DevTools (F12) → Console
2. Click "Create Group"
3. Enter "Test Group" and submit
4. Check console for auth debug output:
   ```
   🔐 Auth Session Debug:
     User ID: [UUID]
     Auth Role: authenticated  ← Must be "authenticated"
     Email: [user email]
     Session exists: true
     Token exists: true
   ```

### Step 3: Verify INSERT Payload
Look for:
```
📝 Inserting group with payload:
  code: ABCD123
  name: Test Group
  owner_user_id: [matches User ID above]  ← CRITICAL
  initials: TG
```

### Step 4: Verify Success
Should see all 4 steps:
```
✅ Group created successfully
📝 STEP 2: Adding creator to user_groups...
🔄 STEP 3: Refreshing groups list...
🔄 STEP 4: Updating App.tsx state...
```

### Step 5: Check "My Groups"
Click "Ir para Meus Grupos" → "Test Group" should appear

## Database Verification
```sql
-- Run in Supabase SQL Editor (Bolao-Prod)

-- 1. Check schema
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'groups' 
  AND column_name IN ('owner_user_id', 'photo_url', 'language_default');

-- 2. Check policies
SELECT policyname FROM pg_policies 
WHERE tablename = 'groups' AND cmd = 'INSERT';

-- 3. Verify group exists
SELECT id, name, owner_user_id FROM groups 
WHERE name = 'Test Group';
```

## If Still Failing

### Check 1: Is user logged in?
```
Auth Role: authenticated?
```
- If NO → User must sign in properly
- If YES → Continue to Check 2

### Check 2: Are policies deployed?
```sql
SELECT COUNT(*) FROM pg_policies 
WHERE tablename IN ('groups', 'user_groups');
-- Should return 8 (4 per table)
```
- If < 8 → Run `DEPLOY_TO_PROD.sql` again
- If = 8 → Continue to Check 3

### Check 3: Is RLS enabled?
```sql
SELECT rowsecurity FROM pg_tables 
WHERE tablename = 'groups';
-- Should return: t (true)
```
- If false → Run `DEPLOY_TO_PROD.sql` to enable
- If true → Continue to Check 4

### Check 4: Does schema have correct columns?
```sql
SELECT EXISTS(
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'groups' 
    AND column_name = 'owner_user_id'
);
-- Should return: true
```
- If false → Schema outdated, run `DEPLOY_TO_PROD.sql`
- If true → Contact support

## Emergency Fix
```bash
# If all else fails:
# 1. Run DEPLOY_TO_PROD.sql again in Supabase SQL Editor
# 2. Restart dev server
npm run dev
# 3. Clear browser cache (Ctrl+Shift+Delete / Cmd+Shift+Delete)
# 4. Sign out and back in
# 5. Try creating group again
```

## Key Column Names Reference

| Purpose | Database | TypeScript |
|---------|----------|-----------|
| **Creator ID** | `owner_user_id` | `ownerUserId` |
| Photo | `photo_url` | `photoUrl` |
| Language | `language_default` | `languageDefault` |
| Private | `is_private` | `isPrivate` |
| Created | `created_at` | `createdAt` |
| Updated | `updated_at` | `updatedAt` |
| Group Member User | `user_id` | `userId` |
| Group Member Group | `group_id` | `groupId` |
| Group Member Active | `is_active` | `isActive` |

## Success Indicators ✅
- [x] Group created successfully log appears
- [x] All 4 STEPs complete without errors
- [x] Group appears in "My Groups" immediately
- [x] No RLS errors in console
- [x] Database shows group with correct owner_user_id

## Resources
- `FIX_SUMMARY.md` - Full technical explanation
- `PRODUCTION_RLS_FIXES.md` - Detailed RLS debugging guide
- `GROUPSELECTOR_CORRECTED_CODE.md` - Complete code blocks
- `DEPLOY_TO_PROD.sql` - Schema deployment script
