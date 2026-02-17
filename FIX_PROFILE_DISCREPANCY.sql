-- =========================================================================
-- PRODUCTION PROFILE DATA AUDIT & FIX
-- =========================================================================
-- Purpose: Fix profile data discrepancy between Dev and Prod
-- Issue: Profile names showing as "User" with empty surnames
-- Root Cause: Trigger only sets name, not surname; doesn't extract from metadata
-- Date: Feb 13, 2026
-- =========================================================================

-- =========================================================================
-- STEP 1: Audit Current Data State
-- =========================================================================
-- Check how many profiles have default values

SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN name = 'User' THEN 1 END) as profiles_with_default_name,
  COUNT(CASE WHEN surname = '' THEN 1 END) as profiles_with_empty_surname,
  COUNT(CASE WHEN name = 'User' AND surname = '' THEN 1 END) as profiles_with_both_defaults
FROM public.profiles;

-- Check email and names
SELECT id, email, name, surname, preferred_team, created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- =========================================================================
-- STEP 2: Update the Trigger Function (Smart Version)
-- =========================================================================
-- This improved trigger:
-- 1. Extracts full_name from metadata and splits into name/surname
-- 2. Tries first_name/last_name if available
-- 3. Falls back to "User" if nothing available
-- 4. Also captures preferred_team if in metadata

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
  v_surname TEXT;
  v_full_name TEXT;
  v_name_parts TEXT[];
BEGIN
  -- Extract full name from various possible metadata fields
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'fullName',
    NULL
  );

  -- If we have a full name, split it
  IF v_full_name IS NOT NULL AND v_full_name != '' THEN
    -- Split by space: first part is name, rest is surname
    v_name_parts := string_to_array(TRIM(v_full_name), ' ');
    v_name := v_name_parts[1];
    
    -- Join remaining parts as surname (if more than one word)
    IF array_length(v_name_parts, 1) > 1 THEN
      v_surname := array_to_string(v_name_parts[2:], ' ');
    ELSE
      v_surname := '';
    END IF;
  ELSE
    -- Try separate first_name and last_name fields
    v_name := COALESCE(NEW.raw_user_meta_data->>'first_name', NULL);
    v_surname := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    
    -- If still no name, use "User"
    IF v_name IS NULL OR v_name = '' THEN
      v_name := 'User';
    END IF;
  END IF;

  -- Ensure surname has a value (default to empty string)
  IF v_surname IS NULL THEN
    v_surname := '';
  END IF;

  -- Insert or update the profile
  INSERT INTO public.profiles (id, email, name, surname, preferred_team)
  VALUES (
    NEW.id,
    NEW.email,
    v_name,
    v_surname,
    COALESCE(NEW.raw_user_meta_data->>'preferred_team', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = CASE 
      WHEN profiles.name = 'User' AND EXCLUDED.name != 'User' THEN EXCLUDED.name
      ELSE profiles.name
    END,
    surname = CASE
      WHEN profiles.surname = '' AND EXCLUDED.surname != '' THEN EXCLUDED.surname
      ELSE profiles.surname
    END,
    preferred_team = COALESCE(EXCLUDED.preferred_team, profiles.preferred_team),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- STEP 3: Verify the trigger is in place
-- =========================================================================
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_schema = 'public';

-- =========================================================================
-- STEP 4: Verify RLS policies on profiles are correct
-- =========================================================================
SELECT polname as policyname, polcmd, pg_get_expr(polqual, polrelid) as using_condition
FROM pg_policy
WHERE polrelid IN (SELECT oid FROM pg_class WHERE relname = 'profiles' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
ORDER BY polname;

-- Expected output: Should show SELECT, UPDATE, and INSERT policies

-- =========================================================================
-- STEP 5: Verify columns exist in profiles table
-- =========================================================================
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Expected columns: id, email, name, surname, photo_url, preferred_team, created_at, updated_at

-- =========================================================================
-- STEP 6: Manual fix for existing profiles with default values (Optional)
-- =========================================================================
-- Uncomment below if you want to attempt to extract surnames from existing user data

-- UPDATE public.profiles
-- SET surname = 
--   CASE 
--     WHEN surname = '' AND name != 'User' 
--       THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
--     ELSE surname
--   END
-- WHERE surname = '' OR surname IS NULL;

-- =========================================================================
-- END OF AUDIT & FIX
-- =========================================================================
-- Summary:
-- ✅ Improved trigger now handles name/surname correctly
-- ✅ Tries multiple metadata fields
-- ✅ Smart fallback logic
-- ✅ Better RLS policy handling (only updates if value improves)
-- 
-- Next step:
-- 1. Run this script in Bolao-Prod SQL Editor
-- 2. Test new user signup - verify name/surname are captured
-- 3. Monitor profiles table for proper data entry
-- =========================================================================
