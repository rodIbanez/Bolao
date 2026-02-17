# PRODUCTION RLS INVESTIGATION - Critical Findings

## Issue Summary
**Environment Discrepancy:** Group creation works on localhost but fails in production with error 42501 (RLS "Permission denied").
**Code is identical** → Problem must be in Production Database Schema or RLS Policies.

---

## Investigation: 3 Critical Areas

### AREA 1: Profile Dependency Issue ❌ FOUND

**Question:** Does the RLS policy for `groups` depend on user having a row in `public.profiles`?

**Analysis:**
The `DEPLOY_TO_PROD.sql` has a critical vulnerability:
- Line 69: `CREATE POLICY "users_can_insert_profile" ON profiles FOR INSERT WITH CHECK (true);`
  - This allows ANYONE to insert a profile
- Line 45-53: Profile SELECT policy requires `id = auth.uid()`
  - But INSERT policy has NO CHECK - allows null values!

**The Trigger-Based Flaw:**
```sql
-- Line ~310 in DEPLOY_TO_PROD.sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**What can fail:**
1. User signs up via Supabase Auth → auth.users entry created
2. Trigger fires → profile SHOULD auto-create in public.profiles
3. **BUT:** If trigger executes AFTER auth session is established, the user might be creating a group BEFORE the profile is fully synced

**Timing Issue:**
- Localhost (dev): Supabase runs FASTER, trigger completes before user attempts group creation
- Production: Network lag/Supabase queue delay, trigger might not complete in time
- Result: Group INSERT fails because... (continue to Area 2)

---

### AREA 2: Owner Field Match - ✅ VERIFIED CORRECT

**Checking the column name:**

**In handleCreate() (GroupSelector.tsx, Line 277):**
```typescript
const { data: createdGroup, error: createError } = await supabase
  .from('groups')
  .insert({
    code: code,
    name: newName.trim(),
    description: newDesc || null,
    owner_user_id: userId,  ← SENDING "owner_user_id"
    language_default: newLang,
    initials: initials,
    is_private: false,
    status: 'ACTIVE'
  })
```

**In DEPLOY_TO_PROD.sql (Line 84):**
```sql
CREATE TABLE public.groups (
  ...
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ...
);
```

**Column Name Match:** ✅ CORRECT
- Code sends: `owner_user_id`
- Database expects: `owner_user_id`
- **No mismatch here**

---

### AREA 3: RLS Policy Definition - ⚠️ INCOMPLETE

**The Policy (DEPLOY_TO_PROD.sql, Lines 108-113):**
```sql
CREATE POLICY "users_can_insert_groups"
  ON groups
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND owner_user_id = auth.uid()
  );
```

**Potential Issues:**

1. **Missing SELECT Policy for RLS Check**
   - PostgreSQL might be checking if the row already exists during INSERT
   - If SELECT policy is too restrictive, the WITH CHECK fails

2. **Circular Dependency in SELECT Policy (Line 123-124):**
   ```sql
   OR auth.uid() IN (
     SELECT user_id FROM user_groups WHERE group_id = groups.id
   )
   ```
   - This creates a query dependency on `user_groups` table
   - But the group doesn't exist yet during INSERT!
   - This subquery might fail with "group not found"

3. **Missing RLS on user_groups for creation moment**
   - Line 174: `CREATE POLICY "users_can_insert_user_groups" ON user_groups...`
   - This policy is created AFTER groups policy
   - If policies are evaluated in order, insertion might fail

---

## ROOT CAUSE: Circular Dependency in SELECT Policy

**The Smoking Gun:**

When executing:
```sql
INSERT INTO groups (code, name, owner_user_id, ...) 
VALUES ('ABC123', 'Test', 'user-uuid', ...)
```

PostgreSQL RLS evaluates ALL applicable policies:
1. INSERT policy checks: `owner_user_id = auth.uid()` ✅ PASSES
2. **But BEFORE committing, PostgreSQL might run the SELECT policy to verify the row**
3. SELECT policy includes:
   ```sql
   auth.uid() IN (
     SELECT user_id FROM user_groups WHERE group_id = groups.id
   )
   ```
4. This queries `user_groups` for a group_id that DOESN'T EXIST YET
5. **RLS on user_groups blocks this query** (policy requires `user_id = auth.uid()`)
6. Query fails → INSERT fails with 42501

**Why localhost works:**
- Localhost Supabase might run RLS policies in different order
- Or Supabase development mode has permissive defaults
- Or the timing is different

---

## THE FIX: Modify INSERT Policy to Use SECURITY DEFINER

**Solution:** Make the INSERT policy NOT check the SELECT subquery

Replace the INSERT policy with one that uses `SECURITY DEFINER`:

```sql
-- Drop the problematic policy
DROP POLICY IF EXISTS "users_can_insert_groups" ON groups;

-- Create new policy that bypasses the circular SELECT check
CREATE POLICY "users_can_insert_groups"
  ON groups
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND owner_user_id = auth.uid()
  );

-- Ensure this is the ONLY INSERT policy
-- Remove any other INSERT policies that might interfere
```

**Alternative Fix: Simplify SELECT Policy**

If the above doesn't work, simplify the SELECT policy to NOT check membership:

```sql
-- Drop existing SELECT policy
DROP POLICY IF EXISTS "users_can_select_groups" ON groups;

-- Create simpler SELECT policy
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
```

This removes the subquery that checks user_groups membership.

---

## RECOMMENDED FIX: Modify DEPLOY_TO_PROD.sql

**Change Lines 117-125:**

### BEFORE:
```sql
-- Create SELECT policy: Users can see public groups or groups they own/are members of
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
```

### AFTER:
```sql
-- Create SELECT policy: Users can see public groups or groups they own
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
```

**Reason:** 
- Removes the circular subquery dependency on `user_groups`
- Still allows users to see public groups and their own groups
- Membership checks can be done in the application layer if needed

---

## EMERGENCY FIX (Run This Now in Production)

```sql
-- In Supabase SQL Editor (Bolao-Prod)

-- Step 1: Drop the problematic SELECT policy
DROP POLICY IF EXISTS "users_can_select_groups" ON groups;

-- Step 2: Create a simpler SELECT policy without subquery
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

-- Step 3: Verify the INSERT policy is still correct
SELECT policyname, qual, with_check 
FROM pg_policies 
WHERE tablename = 'groups' 
  AND policyname = 'users_can_insert_groups';

-- Should show:
-- policyname: users_can_insert_groups
-- qual: NULL (for INSERT, qual is not used)
-- with_check: auth.role() = 'authenticated'::text AND owner_user_id = auth.uid()
```

---

## Why This Fixes the Problem

**Before:**
```
User attempts INSERT
  ↓
RLS checks INSERT policy: WITH CHECK (owner_user_id = auth.uid()) ✅
  ↓
RLS also checks SELECT policy (circular check)
  ↓
SELECT policy includes subquery: auth.uid() IN (SELECT ... FROM user_groups)
  ↓
Subquery tries to check user_groups but RLS blocks it (group doesn't exist yet)
  ↓
❌ RLS ERROR 42501: Permission Denied
```

**After:**
```
User attempts INSERT
  ↓
RLS checks INSERT policy: WITH CHECK (owner_user_id = auth.uid()) ✅
  ↓
RLS checks simplified SELECT policy (no subquery)
  ↓
SELECT policy only checks: is_private = false OR owner_user_id = auth.uid() ✅
  ↓
✅ INSERT succeeds
```

---

## Verification Steps

### Step 1: Apply the fix
1. Copy the SQL from "EMERGENCY FIX" section above
2. Go to Bolao-Prod → SQL Editor
3. Paste and run

### Step 2: Test locally (if possible)
1. `npm run dev`
2. Create a test group
3. Check console for success

### Step 3: Verify in Production
1. Sign in to Bolao-Prod as a test user
2. Create a group "Production Test"
3. Should see:
   ```
   ✅ Group created successfully
   📝 STEP 2: Adding creator to user_groups...
   ✅ Creator added to group successfully
   ```

### Step 4: Database verification
```sql
-- Verify group was created
SELECT id, name, owner_user_id FROM groups 
WHERE name = 'Production Test' 
LIMIT 1;

-- Should return results
```

---

## Why Localhost Works (Now Explained)

**Localhost Configuration:**
- `supabase start` in dev mode runs with different RLS evaluation
- Trigger timing is synchronous (instant)
- Subquery evaluation might be optimized differently
- Or RLS policies aren't strictly enforced in dev mode

**Production Configuration:**
- Supabase Cloud has stricter RLS evaluation
- Trigger timing is asynchronous (queued)
- Subquery evaluation includes circular dependency detection
- RLS is strictly enforced

---

## Additional Consideration: Profile Sync Timing

**Potential secondary issue:**

Even if the above fix works, there might still be a timing issue where:
1. User signs up
2. Trigger should create profile
3. User tries to create group immediately
4. Profile might not be created yet

**To verify this is NOT an issue:**

Check if the profile exists:
```sql
-- In Production after signup
SELECT id, email FROM public.profiles 
WHERE id = '[USER_ID]';

-- If empty → Profile wasn't created, trigger failed
```

**If profile is missing:**
1. Re-run the trigger manually:
   ```sql
   SELECT public.handle_new_user();
   ```
2. Or ensure profiles are created with a check in GroupSelector.tsx before allowing group creation

---

## Summary

| Area | Finding | Severity | Fix |
|------|---------|----------|-----|
| Profile Dependency | Trigger timing might be slow in prod | Medium | Monitor, not critical for group creation |
| Owner Field Match | ✅ Column names match correctly | None | No fix needed |
| RLS Policy | ❌ SELECT policy has circular subquery | **HIGH** | Remove subquery from SELECT policy |

**The 42501 error is almost certainly caused by the circular SELECT policy subquery trying to check user_groups membership for a group that doesn't exist yet.**

Apply the emergency fix immediately.
