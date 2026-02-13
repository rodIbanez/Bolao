-- ============================================================================
-- COMPREHENSIVE PROFILES TABLE FIX
-- Includes: Table recreation, RLS, Trigger, and Self-Healing Policies
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP EXISTING TRIGGER (if any)
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================================================
-- STEP 2: BACKUP AND DROP EXISTING PROFILES TABLE
-- ============================================================================
-- Create a backup of existing data (optional, for reference)
CREATE TABLE IF NOT EXISTS profiles_backup AS SELECT * FROM profiles WHERE FALSE;
INSERT INTO profiles_backup SELECT * FROM profiles;

-- Drop the existing table
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================================
-- STEP 3: RECREATE PROFILES TABLE WITH CORRECT STRUCTURE
-- ============================================================================
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT DEFAULT 'User',
  surname TEXT DEFAULT '',
  photo_url TEXT,
  preferred_team TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- ============================================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES (CRITICAL FOR SELF-HEALING)
-- ============================================================================

-- Policy 1: Users can SELECT their own profile
CREATE POLICY "Profiles: Users can select own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Authenticated users can read all profiles (for leaderboard/friends)
CREATE POLICY "Profiles: Authenticated users can read all profiles"
  ON public.profiles
  FOR SELECT
  USING (auth.role() = 'authenticated_user');

-- Policy 3: Users can INSERT their own profile (SELF-HEALING)
CREATE POLICY "Profiles: Users can create own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND auth.role() = 'authenticated_user'
  );

-- Policy 4: Users can UPDATE their own profile
CREATE POLICY "Profiles: Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 5: Users can DELETE their own profile (optional)
CREATE POLICY "Profiles: Users can delete own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);

-- ============================================================================
-- STEP 6: CREATE TRIGGER FUNCTION FOR AUTO-SYNC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, surname)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'User'),
    COALESCE(new.raw_user_meta_data->>'surname', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    surname = COALESCE(EXCLUDED.surname, profiles.surname),
    updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- STEP 7: CREATE TRIGGER ON AUTH.USERS
-- ============================================================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 8: VERIFY SETUP
-- ============================================================================
-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_schema, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check RLS policies
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================================================
-- END OF PROFILES TABLE FIX
-- ============================================================================
