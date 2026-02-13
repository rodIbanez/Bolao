# GroupSelector.tsx - Corrected Code Blocks

## ✅ CORRECTED: fetchGroups() Function

```typescript
const fetchGroups = async () => {
  try {
    console.log('📡 Fetching groups from Supabase...');
    const { data, error: fetchError } = await supabase
      .from('groups')
      .select('*');

    if (fetchError) {
      console.error('❌ Error fetching groups:', fetchError);
      setAllGroups([]);
      return;
    }

    // 🔧 FIX: Map snake_case database columns to camelCase TypeScript types
    const mappedGroups = (data || []).map((row: any) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      photoUrl: row.photo_url,              // ← photo_url → photoUrl
      initials: row.initials,
      languageDefault: row.language_default || 'pt',  // ← language_default → languageDefault
      ownerUserId: row.owner_user_id,      // ← owner_user_id → ownerUserId (CRITICAL)
      createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
      updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : 0,
      isPrivate: row.is_private || false,
      status: row.status || 'ACTIVE'
    }));

    console.log('✅ Groups fetched:', mappedGroups.length, 'groups');
    setAllGroups(mappedGroups);
  } catch (err) {
    console.error('❌ Unexpected error fetching groups:', err);
    setAllGroups([]);
  }
};
```

---

## ✅ CORRECTED: handleCreate() INSERT PAYLOAD

**Location:** Lines ~250-280 in handleCreate()

```typescript
// ✅ Correct database column names in INSERT payload
const { data: createdGroup, error: createError } = await supabase
  .from('groups')
  .insert({
    code: code,
    name: newName.trim(),
    description: newDesc || null,
    owner_user_id: userId,           // ✅ CRITICAL: owner_user_id (snake_case, matches DB)
    language_default: newLang,       // ✅ language_default (snake_case, matches DB)
    initials: initials,
    is_private: false,               // ✅ is_private (snake_case, matches DB)
    status: 'ACTIVE'
  })
  .select()
  .maybeSingle();

if (createError) {
  console.error('❌ SUPABASE ERROR creating group:');
  console.error('  Code:', createError.code);
  console.error('  Message:', createError.message);
  console.error('  Details:', createError.details);
  
  if (createError.code === '42501') {
    setError('Permission denied. Check that you are logged in.');
    // TODO: Additional debugging - check auth session
  } else if (createError.code === '23505') {
    setError('Group name already taken.');
  } else {
    setError(`Error creating group: ${createError.message}`);
  }
  setLoading(false);
  return;
}
```

---

## ✅ CORRECTED: Response Mapping in handleCreate()

**Location:** Lines ~285-300 in handleCreate()

```typescript
console.log('✅ Group created successfully:', createdGroup);

// 🔧 FIX: Map snake_case response to camelCase TypeScript type
const mappedGroup: Group = {
  id: createdGroup.id,
  code: createdGroup.code,
  name: createdGroup.name,
  description: createdGroup.description,
  photoUrl: createdGroup.photo_url,              // ← photo_url → photoUrl
  initials: createdGroup.initials,
  languageDefault: createdGroup.language_default || 'pt',  // ← language_default → languageDefault
  ownerUserId: createdGroup.owner_user_id,      // ← owner_user_id → ownerUserId (CRITICAL)
  createdAt: createdGroup.created_at ? new Date(createdGroup.created_at).getTime() : 0,
  updatedAt: createdGroup.updated_at ? new Date(createdGroup.updated_at).getTime() : 0,
  isPrivate: createdGroup.is_private || false,
  status: createdGroup.status || 'ACTIVE'
};

// STEP 2: Add creator as member of the new group
console.log('📝 STEP 2: Adding creator to user_groups with payload:', {
  user_id: userId,           // ✅ user_id (snake_case, matches DB)
  group_id: createdGroup.id, // ✅ group_id (snake_case, matches DB)
  role: 'OWNER',
  is_active: true            // ✅ is_active (snake_case, matches DB)
});

const { error: memberError } = await supabase
  .from('user_groups')
  .insert({
    user_id: userId,
    group_id: createdGroup.id,
    role: 'OWNER',
    is_active: true
  });

// ... error handling ...

// STEP 3: Refresh groups list
console.log('🔄 STEP 3: Refreshing groups list...');
await fetchGroups();

// STEP 4: UPDATE APP STATE with MAPPED group object
console.log('🔄 STEP 4: Updating App.tsx state with new group...');
onCreateGroup(mappedGroup);  // ← Pass mapped object, not raw response
```

---

## ✅ CORRECTED: Auth Session Debug in handleCreate()

**Location:** Lines ~230-250 in handleCreate()

```typescript
console.log('✅ Group name is available. Creating group...');

// 🔧 FIX: Get current user ID with enhanced diagnostics
const { data: session } = await supabase.auth.getSession();
if (!session?.session?.user?.id) {
  setError('You must be logged in to create a group.');
  setLoading(false);
  return;
}

const code = generateGroupCode(allGroups);
const userId = session.session.user.id;

// 🔧 NEW: Add auth session diagnostics to help debug RLS 42501 errors
console.log('🔐 Auth Session Debug:');
console.log('  User ID:', userId);
console.log('  Auth Role:', session.session.user.role);
console.log('  Email:', session.session.user.email);
console.log('  Session exists:', !!session.session);
console.log('  Token exists:', !!session.session.access_token);
```

---

## ❌ COMPARISON: What Was Wrong

### Before (Incorrect):
```typescript
// fetchGroups - No mapping, used raw snake_case
setAllGroups(data || []);  // ← Groups have owner_user_id instead of ownerUserId

// handleCreate - No mapping, passed raw response
onCreateGroup(createdGroup);  // ← Object has snake_case properties
```

### After (Correct):
```typescript
// fetchGroups - Explicit mapping
const mappedGroups = (data || []).map((row: any) => ({
  ownerUserId: row.owner_user_id,  // ← Correct camelCase
  // ... other mappings
}));
setAllGroups(mappedGroups);

// handleCreate - Explicit mapping
const mappedGroup: Group = {
  ownerUserId: createdGroup.owner_user_id,  // ← Correct camelCase
  // ... other mappings
};
onCreateGroup(mappedGroup);
```

---

## 🔍 Key Differences by Field

| Field | Database (snake_case) | TypeScript (camelCase) | Mapping in Code |
|-------|---------------------|----------------------|-----------------|
| **Creator ID** | `owner_user_id` | `ownerUserId` | ✅ `ownerUserId: row.owner_user_id` |
| Photo URL | `photo_url` | `photoUrl` | ✅ `photoUrl: row.photo_url` |
| Language | `language_default` | `languageDefault` | ✅ `languageDefault: row.language_default` |
| Privacy | `is_private` | `isPrivate` | ✅ `isPrivate: row.is_private` |
| Membership User | `user_id` | `userId` | ✅ (already handled in user_groups) |
| Membership Group | `group_id` | `groupId` | ✅ (already handled in user_groups) |

---

## 🧪 Testing After Apply

### Test 1: Console Output
1. Open DevTools → Console
2. Create group "Test Group"
3. Should see:
   ```
   🔍 Checking if group name already exists: Test Group
   ✅ Group name is available. Creating group...
   🔐 Auth Session Debug:
     User ID: xxxxxxxx-xxxx...
     Auth Role: authenticated
     Email: test@example.com
     Session exists: true
     Token exists: true
   📝 Inserting group with payload:
     owner_user_id: xxxxxxxx-xxxx...  ← Should match User ID above
   ✅ Group created successfully: {...}
   📝 STEP 2: Adding creator to user_groups...
   ✅ Creator added to group successfully
   🔄 STEP 3: Refreshing groups list...
   🔄 STEP 4: Updating App.tsx state with new group...
   ```

### Test 2: Group Visibility
1. After success screen closes, click "Ir para Meus Grupos"
2. "Test Group" should appear in "My Groups" list
3. If missing = state sync issue (STEP 4 failed)

### Test 3: Database Verification
```sql
-- In Supabase SQL Editor (Bolao-Prod)
SELECT id, name, owner_user_id FROM groups 
WHERE name = 'Test Group' 
LIMIT 1;

-- Should return:
-- id: xxxxxxxx-xxxx...
-- name: Test Group
-- owner_user_id: xxxxxxxx-xxxx... (matches current user)
```

---

## 📋 Deployment Checklist

- [ ] Code changes applied to `components/GroupSelector.tsx`
- [ ] `DEPLOY_TO_PROD.sql` executed in Bolao-Prod (if schema needs deployment)
- [ ] Dev server restarted: `npm run dev`
- [ ] Tested group creation with console diagnostics
- [ ] Verified group appears in "My Groups"
- [ ] Tested with multiple users
- [ ] Verified RLS policies prevent unauthorized access

---

## 🆘 If Still Getting Permission Denied

**Error:** "Permission denied" (code 42501)

**Diagnostic Steps:**
1. Check auth session debug output - if `Auth Role` ≠ `authenticated`, user not logged in
2. Verify `DEPLOY_TO_PROD.sql` was actually executed (check if policies exist):
   ```sql
   SELECT policyname FROM pg_policies 
   WHERE tablename = 'groups' 
     AND cmd = 'INSERT';
   ```
3. Verify RLS is enabled on `groups` table:
   ```sql
   SELECT rowsecurity FROM pg_tables 
   WHERE tablename = 'groups';
   -- Should return: t (true)
   ```
4. Re-run `DEPLOY_TO_PROD.sql` to recreate policies
5. Check Supabase project settings - verify correct environment (Dev vs Prod)
