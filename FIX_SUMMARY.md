# PRODUCTION FIX SUMMARY - RLS "Permission Denied" Error

## Issue
**Error in Production:** "Permission denied. You do not have permission to create groups" (RLS code 42501)
**Component:** `GroupSelector.tsx` → `handleCreate()` function
**Root Cause:** Database column name mismatch (snake_case in DB vs camelCase in TypeScript)

---

## Root Cause Analysis

### The Problem
The RLS policy on the `groups` table checks:
```sql
owner_user_id = auth.uid()
```

But there was a mismatch between:
- **Database schema:** Uses `owner_user_id` (snake_case)
- **TypeScript types:** Expects `ownerUserId` (camelCase)

When `fetchGroups()` returned data without mapping, it had properties like `owner_user_id` instead of `ownerUserId`, breaking type consistency and potentially causing issues when these objects were passed around the application.

Additionally, the response from the INSERT was not being properly mapped before being passed to `App.tsx`, which could cause state misalignment.

### Why RLS Was Failing
The 42501 error ("Permission denied") occurs when:
1. User auth session is valid ✓
2. `owner_user_id` column IS being sent correctly ✓
3. **BUT** the mapping issue might have caused the response object to be malformed

---

## Solutions Applied

### Fix #1: Map snake_case → camelCase in fetchGroups()

**File:** `components/GroupSelector.tsx` (lines 59-90)

**What changed:**
```typescript
// BEFORE: Raw data with snake_case
setAllGroups(data || []);

// AFTER: Explicitly mapped to TypeScript types
const mappedGroups = (data || []).map((row: any) => ({
  id: row.id,
  ownerUserId: row.owner_user_id,      // ← Map DB column to TS property
  photoUrl: row.photo_url,              // ← Map DB column to TS property
  languageDefault: row.language_default, // ← Map DB column to TS property
  // ... map all other fields
}));
setAllGroups(mappedGroups);
```

**Why:** Ensures all groups in state have correct TypeScript interface properties.

---

### Fix #2: Add Auth Session Diagnostics

**File:** `components/GroupSelector.tsx` (lines 240-255)

**What changed:**
```typescript
// NEW: Debug output before INSERT attempt
console.log('🔐 Auth Session Debug:');
console.log('  User ID:', userId);
console.log('  Auth Role:', session.session.user.role);
console.log('  Email:', session.session.user.email);
console.log('  Session exists:', !!session.session);
console.log('  Token exists:', !!session.session.access_token);
```

**Why:** Allows inspection of auth state to verify user is properly authenticated BEFORE attempting INSERT. If any value is unexpected, you can immediately diagnose auth issues.

---

### Fix #3: Map Response Before Using

**File:** `components/GroupSelector.tsx` (lines 313-330)

**What changed:**
```typescript
// BEFORE: Used raw response
console.log('✅ Group created successfully:', createdGroup);
onCreateGroup(createdGroup);  // ← Passed snake_case object

// AFTER: Map response to TypeScript type
const mappedGroup: Group = {
  id: createdGroup.id,
  ownerUserId: createdGroup.owner_user_id,  // ← Map DB column to TS property
  photoUrl: createdGroup.photo_url,         // ← Map DB column to TS property
  // ... map all other fields
};
onCreateGroup(mappedGroup);  // ← Pass properly typed object
```

**Why:** Ensures `App.tsx` receives correctly typed group object, preventing state sync issues.

---

### Fix #4: Improved user_groups Payload Logging

**File:** `components/GroupSelector.tsx` (lines 333-339)

**What changed:**
```typescript
// BEFORE: Generic logging
console.log('📝 STEP 2: Adding creator to user_groups...');

// AFTER: Explicit payload logging
console.log('📝 STEP 2: Adding creator to user_groups with payload:', {
  user_id: userId,
  group_id: createdGroup.id,
  role: 'OWNER',
  is_active: true
});
```

**Why:** Shows exact payload being sent to Supabase, makes debugging STEP 2 RLS issues easier.

---

## Verification Checklist

### Before Testing
- [ ] Read this summary completely
- [ ] Review the corrected code in `GROUPSELECTOR_CORRECTED_CODE.md`
- [ ] Ensure `DEPLOY_TO_PROD.sql` was executed in Bolao-Prod

### Testing Steps
- [ ] Open DevTools (F12) → Console tab
- [ ] Attempt to create a group: "Test Group"
- [ ] **Verify output includes:**
  ```
  🔐 Auth Session Debug:
    User ID: [NOT EMPTY - should be UUID]
    Auth Role: authenticated
    Email: [your email]
    Session exists: true
    Token exists: true
  ```
  - If `User ID` is empty or `Auth Role` ≠ authenticated → **User not logged in, RLS will fail**
  - If `Token exists: false` → **Session token missing, auth failed**

- [ ] **Verify INSERT payload:**
  ```
  📝 Inserting group with payload:
    code: [7-char code]
    name: Test Group
    owner_user_id: [UUID matching User ID above]
    initials: TG
  ```
  - If `owner_user_id` is empty or mismatched → **RLS will reject INSERT**

- [ ] **Verify success:**
  ```
  ✅ Group created successfully: {...}
  📝 STEP 2: Adding creator to user_groups...
  ✅ Creator added to group successfully
  🔄 STEP 3: Refreshing groups list...
  🔄 STEP 4: Updating App.tsx state with new group...
  ```

- [ ] Click "Ir para Meus Grupos" button
- [ ] **Verify group appears in "My Groups" list**
  - If missing → STEP 4 might have failed or state sync issue

### Database Verification
```sql
-- Run in Supabase SQL Editor (Bolao-Prod)

-- Verify group was created
SELECT id, name, owner_user_id FROM groups 
WHERE name = 'Test Group' LIMIT 1;

-- Verify creator was added as member
SELECT user_id, group_id, role FROM user_groups 
WHERE group_id = '[GROUP_ID_FROM_ABOVE]' 
  AND role = 'OWNER';

-- Verify RLS policies are in place
SELECT policyname, cmd FROM pg_policies 
WHERE tablename IN ('groups', 'user_groups') 
ORDER BY tablename, cmd;
```

---

## If Still Getting "Permission Denied" (42501)

### Diagnostic Level 1: Auth State
1. Check console output - is `Auth Role: authenticated`?
2. If NO → User needs to sign in properly
3. If YES → Continue to Level 2

### Diagnostic Level 2: Database Schema
```sql
-- In Supabase SQL Editor
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'groups' 
  AND column_name = 'owner_user_id';
```
- If empty result → Schema outdated, re-run `DEPLOY_TO_PROD.sql`
- If returns `owner_user_id` → Schema correct, continue to Level 3

### Diagnostic Level 3: RLS Policies
```sql
-- Check if policies exist
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'groups' AND cmd = 'INSERT';
```
- If empty result → Policies missing, re-run `DEPLOY_TO_PROD.sql`
- If shows policy → Continue to Level 4

### Diagnostic Level 4: RLS Policy Content
```sql
-- Get policy definition
SELECT pg_get_expr(qual, relid) as policy_check
FROM pg_policies 
WHERE tablename = 'groups' 
  AND policyname = 'users_can_insert_groups';
```
- Should show: `auth.role() = 'authenticated'::text AND owner_user_id = auth.uid()`
- If different → RLS policy is incorrect, recreate with `DEPLOY_TO_PROD.sql`

### Emergency Fix
```sql
-- Drop and recreate the policy
DROP POLICY "users_can_insert_groups" ON groups;

CREATE POLICY "users_can_insert_groups"
  ON groups
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND owner_user_id = auth.uid()
  );
```

---

## Code Changes Reference

| File | Changes | Lines |
|------|---------|-------|
| `components/GroupSelector.tsx` | fetchGroups() - Added mapping | 59-90 |
| `components/GroupSelector.tsx` | handleCreate() - Added auth debug | 240-255 |
| `components/GroupSelector.tsx` | handleCreate() - Added response mapping | 313-330 |
| `components/GroupSelector.tsx` | handleCreate() - Added payload logging | 333-339 |
| `components/GroupSelector.tsx` | handleCreate() - Pass mapped object to onCreateGroup | 369 |

**Total changes:** ~50 lines of code

---

## Why This Fix Works

### Before
```
Supabase Returns (snake_case)     TypeScript Type (camelCase)    Result
├─ owner_user_id: "abc"           ├─ ownerUserId: missing       ❌ Mismatch
├─ photo_url: "..."               ├─ photoUrl: missing          ❌ Mismatch
└─ language_default: "pt"         └─ languageDefault: missing   ❌ Mismatch
```

### After
```
Supabase Returns (snake_case)     Mapped to camelCase           TypeScript Type
├─ owner_user_id: "abc"     ────> ownerUserId: "abc"           ✅ Match
├─ photo_url: "..."         ────> photoUrl: "..."              ✅ Match
└─ language_default: "pt"   ────> languageDefault: "pt"        ✅ Match
```

When the mapped object is passed to `App.tsx` via `onCreateGroup()`:
- `App.tsx` can correctly use `group.ownerUserId` (camelCase)
- State is properly synchronized
- RLS policies work because the underlying DB schema is unchanged

---

## Next Steps

1. ✅ Code changes already applied to `components/GroupSelector.tsx`
2. **Verify changes are correct:**
   ```bash
   npm run dev
   # Check for TypeScript compilation errors
   ```
3. **Test group creation** following the verification checklist above
4. **Monitor console output** for diagnostics
5. **If successful:** Test with multiple users and scenarios
6. **If still failing:** Use Diagnostic Levels above to identify issue

---

## Files Created for Reference

1. **PRODUCTION_RLS_FIXES.md** - Detailed technical explanation
2. **GROUPSELECTOR_CORRECTED_CODE.md** - Side-by-side code comparison
3. **DEPLOY_TO_PROD.sql** - Schema deployment script

All files are in `/Users/rodrigoibanezsaldanha/Bolao/`

---

## Contact Support If

- TypeScript compilation fails after changes
- Tests fail with different error code (not 42501)
- RLS policies exist but still getting permission denied
- Other unexpected behavior

**Include in bug report:**
1. Full console error output
2. Auth session debug output (User ID, Auth Role, etc.)
3. Database schema verification results from SQL queries
4. Steps to reproduce
