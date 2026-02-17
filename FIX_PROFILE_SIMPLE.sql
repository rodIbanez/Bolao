-- SIMPLIFIED TRIGGER FIX FOR PROFILE DISCREPANCY
-- This version accepts that the frontend sends NO metadata during signup
-- Profile defaults are used; users update their profile via ProfileSetup form
-- 
-- METADATA KEY FINDINGS:
-- - Frontend signUp call: Only sends email + password (NO metadata)
-- - user_metadata is READ after login but NOT SET during signup
-- - Result: NEW.raw_user_meta_data is empty in trigger execution
-- - Solution: Accept defaults, let ProfileSetup form update profiles later

-- Step 1: Drop old trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Drop old function
DROP FUNCTION IF EXISTS handle_new_user();

-- Step 3: Create improved trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    name,
    surname,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    'User',           -- Default value; will be updated via ProfileSetup form
    '',               -- Default value; will be updated via ProfileSetup form
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();
