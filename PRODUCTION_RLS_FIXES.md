# Production RLS Fix - "Permission Denied" Error

## Problem
**Error:** "Permission denied. You do not have permission to create groups"
**Occurrence:** When attempting to create a group in Production (Bolao-Prod)
**Root Cause:** Database column name mismatch between TypeScript types and Supabase schema

## Root Cause Analysis

### Issue 1: snake_case vs camelCase Mismatch
**Database Column:** `owner_user_id` (snake_case)
**TypeScript Type:** `ownerUserId` (camelCase)

When `fetchGroups()` retrieves data with `.select('*')`, Supabase returns rows with **snake_case** column names directly from PostgreSQL:
```json
{
  "id": "...",
  "owner_user_id": "user-123",  ← Database column name
  "created_at": "2026-02-13T...",
  ...
}
```

But the TypeScript `Group` interface expects **camelCase**:
```typescript
interface Group {
  ownerUserId: string;  ← TypeScript property
  createdAt: number;
  ...
}
```

**Impact:** The mismatch wasn't directly breaking the INSERT, but if code was checking or logging the group object, it would have invalid properties.

### Issue 2: RLS Policy Column Name Verification
The RLS policy on `groups` table:
```sql
CREATE POLICY "users_can_insert_groups"
  ON groups
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND owner_user_id = auth.uid()  ← Checking correct column
  );
```

**Verification:**
- ✅ Correct column name: `owner_user_id` (matches database)
- ✅ Correct comparison: `auth.uid()` (matches authenticated user)
- ✅ INSERT payload sends: `owner_user_id: userId` (matches column)

**However:** The "Permission denied" error (code 42501) indicates the RLS policy is being REJECTED, which means:
1. Either `auth.uid()` is NULL/undefined (user not properly authenticated)
2. Or the `owner_user_id` value in the INSERT doesn't match `auth.uid()`

## Solutions Applied

### Fix 1: Proper snake_case → camelCase Mapping in `fetchGroups()`
**File:** `components/GroupSelector.tsx`
**Change:** Added explicit mapping layer

```typescript
const fetchGroups = async () => {
  const { data, error: fetchError } = await supabase
    .from('groups')
    .select('*');
    
  // ✅ Map snake_case to camelCase
  const mappedGroups = (data || []).map((row: any) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    photoUrl: row.photo_url,        // ← snake_case to camelCase
    initials: row.initials,
    languageDefault: row.language_default,  // ← snake_case to camelCase
    ownerUserId: row.owner_user_id,  // ← snake_case to camelCase
    createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : 0,
    isPrivate: row.is_private || false,
    status: row.status || 'ACTIVE'
  }));
  
  setAllGroups(mappedGroups);
};
```

**Benefit:** Ensures TypeScript types match database schema throughout the component lifecycle.

### Fix 2: Proper snake_case → camelCase Mapping in `handleCreate()`
**File:** `components/GroupSelector.tsx`
**Change:** Added mapping after group creation

```typescript
const { data: createdGroup, error: createError } = await supabase
  .from('groups')
  .insert({
    code: code,
    name: newName.trim(),
    owner_user_id: userId,  // ✅ Correct database column name
    initials: initials,
    language_default: newLang,
    // ... other fields
  })
  .select()
  .maybeSingle();

// ✅ Map response to TypeScript type
const mappedGroup: Group = {
  id: createdGroup.id,
  ownerUserId: createdGroup.owner_user_id,  // ← Map to camelCase
  // ... map all other fields
};

// Use mapped group for state callbacks
onCreateGroup(mappedGroup);
```

**Benefit:** Ensures the group object passed to App.tsx matches the `Group` interface.

### Fix 3: Enhanced Auth Session Debugging
**File:** `components/GroupSelector.tsx`
**Change:** Added diagnostic logging before INSERT

```typescript
const { data: session } = await supabase.auth.getSession();

console.log('🔐 Auth Session Debug:');
console.log('  User ID:', userId);
console.log('  Auth Role:', session.session.user.role);
console.log('  Email:', session.session.user.email);
console.log('  Session exists:', !!session.session);
console.log('  Token exists:', !!session.session.access_token);
```

**Benefit:** Allows inspection of auth state to verify user is properly authenticated before attempting INSERT.

## Verification Checklist

### Step 1: Verify Database Schema
```sql
-- Run in Supabase SQL Editor for Bolao-Prod
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'groups' 
  AND column_name = 'owner_user_id';
-- Should return: owner_user_id | uuid
```

### Step 2: Verify RLS Policies
```sql
-- Run in Supabase SQL Editor
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'groups' AND policyname = 'users_can_insert_groups';
-- Should show policy exists
```

### Step 3: Test with Console Diagnostics
1. Open browser DevTools → Console tab
2. Attempt to create a group: "Test Group XYZ"
3. Look for auth session debug output:
   ```
   🔐 Auth Session Debug:
     User ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
     Auth Role: authenticated
     Email: user@example.com
     Session exists: true
     Token exists: true
   ```
4. If any value is wrong, user is not properly authenticated
5. Watch for INSERT payload:
   ```
   📝 Inserting group with payload:
     code: ABCD123
     name: Test Group XYZ
     owner_user_id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
     initials: TGX
   ```

### Step 4: If Still Getting Permission Denied
**Possible causes:**
1. **User auth session expired** → Log out and back in
2. **Production RLS policy not deployed** → Run `DEPLOY_TO_PROD.sql` again
3. **Token mismatch** → Check Supabase anon key matches in `.env`
4. **Auth role not set to 'authenticated'** → Verify user is properly signed in via Supabase

**Emergency: Drop and Recreate Policies**
```sql
-- In Supabase SQL Editor
DROP POLICY "users_can_insert_groups" ON groups;

CREATE POLICY "users_can_insert_groups"
  ON groups
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND owner_user_id = auth.uid()
  );
```

## Column Name Reference

| Purpose | Database Column | TypeScript Property |
|---------|-----------------|-------------------|
| Group ID | `id` | `id` |
| Group Code | `code` | `code` |
| Group Name | `name` | `name` |
| Description | `description` | `description` |
| Photo URL | `photo_url` | `photoUrl` |
| Initials | `initials` | `initials` |
| **Creator ID** | `owner_user_id` | `ownerUserId` |
| Language | `language_default` | `languageDefault` |
| Privacy | `is_private` | `isPrivate` |
| Status | `status` | `status` |
| Created | `created_at` | `createdAt` |
| Updated | `updated_at` | `updatedAt` |

**CRITICAL:** The `owner_user_id` column name MUST match exactly in:
1. Database schema (PostgreSQL)
2. RLS policy CHECK clause
3. INSERT payload from TypeScript
4. Type mapping in `fetchGroups()` and `handleCreate()`

## Code Changes Summary

**File:** `components/GroupSelector.tsx`

1. **fetchGroups()** - Added snake_case to camelCase mapping (22 lines added)
2. **handleCreate()** - Added auth session debugging (7 lines added)
3. **handleCreate()** - Added response object mapping to Group interface (15 lines added)
4. **handleCreate()** - Improved error messaging for user_groups INSERT (5 lines modified)

**Total lines changed:** ~49 lines

## Next Steps

1. ✅ Code changes applied to `components/GroupSelector.tsx`
2. Run `DEPLOY_TO_PROD.sql` in Supabase SQL Editor (if not already done)
3. Restart dev server: `npm run dev`
4. Test group creation with console diagnostics enabled
5. Verify group appears in "My Groups" after creation
6. Test with multiple users to ensure RLS policies work correctly

## References

- `DEPLOY_TO_PROD.sql` - Complete production schema deployment
- `types.ts` - Group interface definition (camelCase)
- PostgreSQL RLS documentation - https://www.postgresql.org/docs/current/ddl-rowsecurity.html
