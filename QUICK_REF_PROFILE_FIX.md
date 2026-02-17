# PROFILE DISCREPANCY FIX - QUICK REFERENCE

## Problem
```
❌ PROD: Profiles show name="User", surname="" 
✅ DEV: Profiles show correct name/surname
Code is identical → Issue is in database/trigger
```

## Root Cause
```
Trigger function only captured 'name', not 'surname'
When user signed up, surname was never set, defaulted to ''
UPDATE logic never ran to fix it
```

## Solution
```sql
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
  v_surname TEXT;
  v_full_name TEXT;
  v_name_parts TEXT[];
BEGIN
  -- Extract from multiple metadata sources
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'fullName',
    NULL
  );

  -- Split full name
  IF v_full_name IS NOT NULL AND v_full_name != '' THEN
    v_name_parts := string_to_array(TRIM(v_full_name), ' ');
    v_name := v_name_parts[1];
    v_surname := CASE WHEN array_length(v_name_parts, 1) > 1 
      THEN array_to_string(v_name_parts[2:], ' ') ELSE '' END;
  ELSE
    -- Try first_name/last_name
    v_name := COALESCE(NEW.raw_user_meta_data->>'first_name', 'User');
    v_surname := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  END IF;

  IF v_surname IS NULL THEN v_surname := ''; END IF;

  -- Insert with surname
  INSERT INTO public.profiles (id, email, name, surname, preferred_team)
  VALUES (NEW.id, NEW.email, v_name, v_surname, 
          COALESCE(NEW.raw_user_meta_data->>'preferred_team', NULL))
  ON CONFLICT (id) DO UPDATE SET
    name = CASE WHEN profiles.name = 'User' AND EXCLUDED.name != 'User' 
      THEN EXCLUDED.name ELSE profiles.name END,
    surname = CASE WHEN profiles.surname = '' AND EXCLUDED.surname != '' 
      THEN EXCLUDED.surname ELSE profiles.surname END,
    preferred_team = COALESCE(EXCLUDED.preferred_team, profiles.preferred_team),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Deployment
1. Copy SQL above
2. Go to Bolao-Prod → SQL Editor
3. Paste and Run
4. Done ✅

## Verification

```sql
-- Check new trigger
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
-- Should return: on_auth_user_created

-- Test
SELECT id, email, name, surname FROM public.profiles WHERE name != 'User' LIMIT 5;
-- Should show real names with surnames (not defaults)
```

## Frontend Status
- ✅ ProfileSetup.tsx - Correct (uses name, surname)
- ✅ App.tsx - Correct (sends name, surname, preferred_team)
- ✅ RLS policies - Correct (UPDATE allowed)
- **No TypeScript changes needed**

## What Changed
| Item | Before | After |
|------|--------|-------|
| Insert fields | name only | name, surname, preferred_team |
| Metadata sources | 'name' | full_name, name, fullName, first_name/last_name |
| Name splitting | No | Yes (splits on space) |
| Update surname | No | Yes (smart update) |
| Result | Default values | Real names from metadata |

## Files
- `FIX_PROFILE_DISCREPANCY.sql` - Complete fix script
- `PROFILE_DISCREPANCY_AUDIT.md` - Full analysis
- `DEPLOY_TO_PROD.sql` - Updated (has new trigger)

## Time: 2 minutes ⏱️
- 1 min: Run SQL in Supabase
- 1 min: Verify in database
- Test with new signup

## Success
✅ New users: Get real name/surname (not defaults)  
✅ Existing users: Can still update profiles  
✅ Database: Shows proper data  
✅ RLS: Still enforced properly  
