-- ============================================================================
-- SECURITY AND TRIGGERS SETUP FOR BOLÃO APP
-- ============================================================================
-- This script:
-- 1. Creates a trigger to sync users from auth.users to profiles
-- 2. Enables RLS on all tables
-- 3. Creates appropriate policies for authenticated users
-- ============================================================================

-- ============================================================================
-- PART 1: USER SYNC TRIGGER
-- ============================================================================

-- Function to sync new users from auth.users to profiles table
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
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if it exists (for re-running this script)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PART 2: ENABLE RLS AND CREATE POLICIES
-- ============================================================================

-- ============================================================================
-- PROFILES TABLE - RLS & POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all profiles (so they can see friends/group members)
CREATE POLICY "Profiles: Allow authenticated users to read all profiles"
  ON public.profiles
  FOR SELECT
  USING (auth.role() = 'authenticated_user');

-- Policy: Users can update only their own profile
CREATE POLICY "Profiles: Allow users to update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users cannot delete profiles (only admins)
CREATE POLICY "Profiles: Prevent deletion"
  ON public.profiles
  FOR DELETE
  USING (false);

-- ============================================================================
-- GROUPS TABLE - RLS & POLICIES
-- ============================================================================

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all groups
CREATE POLICY "Groups: Allow authenticated users to read all groups"
  ON public.groups
  FOR SELECT
  USING (auth.role() = 'authenticated_user');

-- Policy: Authenticated users can create groups
CREATE POLICY "Groups: Allow authenticated users to create groups"
  ON public.groups
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated_user'
    AND auth.uid() = owner_user_id
  );

-- Policy: Users can update groups they own
CREATE POLICY "Groups: Allow users to update owned groups"
  ON public.groups
  FOR UPDATE
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- Policy: Users cannot delete groups (only admins)
CREATE POLICY "Groups: Prevent deletion"
  ON public.groups
  FOR DELETE
  USING (false);

-- ============================================================================
-- USER_GROUPS TABLE - RLS & POLICIES
-- ============================================================================

ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all user_groups (to see group memberships)
CREATE POLICY "UserGroups: Allow authenticated users to read all memberships"
  ON public.user_groups
  FOR SELECT
  USING (auth.role() = 'authenticated_user');

-- Policy: Authenticated users can join groups (insert themselves)
CREATE POLICY "UserGroups: Allow authenticated users to join groups"
  ON public.user_groups
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated_user'
    AND auth.uid() = user_id
  );

-- Policy: Users can update their own membership records
CREATE POLICY "UserGroups: Allow users to update own membership"
  ON public.user_groups
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own membership
CREATE POLICY "UserGroups: Allow users to leave groups"
  ON public.user_groups
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PREDICTIONS TABLE - RLS & POLICIES
-- ============================================================================

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all predictions
CREATE POLICY "Predictions: Allow authenticated users to read all predictions"
  ON public.predictions
  FOR SELECT
  USING (auth.role() = 'authenticated_user');

-- Policy: Users can only insert their own predictions
CREATE POLICY "Predictions: Allow users to create own predictions"
  ON public.predictions
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated_user'
    AND auth.uid() = user_id
  );

-- Policy: Users can only update their own predictions
CREATE POLICY "Predictions: Allow users to update own predictions"
  ON public.predictions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own predictions
CREATE POLICY "Predictions: Allow users to delete own predictions"
  ON public.predictions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SCORING_RULES TABLE - RLS & POLICIES (PUBLIC READ-ONLY)
-- ============================================================================

ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;

-- Policy: All users (including anonymous) can read scoring rules
CREATE POLICY "ScoringRules: Allow public read access"
  ON public.scoring_rules
  FOR SELECT
  USING (true);

-- Policy: Prevent users from modifying scoring rules (admin only)
CREATE POLICY "ScoringRules: Prevent modification"
  ON public.scoring_rules
  FOR UPDATE
  USING (false);

CREATE POLICY "ScoringRules: Prevent deletion"
  ON public.scoring_rules
  FOR DELETE
  USING (false);

CREATE POLICY "ScoringRules: Prevent insertion"
  ON public.scoring_rules
  FOR INSERT
  WITH CHECK (false);

-- ============================================================================
-- MATCHES TABLE - RLS & POLICIES (PUBLIC READ-ONLY)
-- ============================================================================

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read all matches
CREATE POLICY "Matches: Allow authenticated users to read all matches"
  ON public.matches
  FOR SELECT
  USING (auth.role() = 'authenticated_user');

-- Policy: Prevent users from modifying matches (admin only)
CREATE POLICY "Matches: Prevent user modification"
  ON public.matches
  FOR UPDATE
  USING (false);

CREATE POLICY "Matches: Prevent deletion"
  ON public.matches
  FOR DELETE
  USING (false);

CREATE POLICY "Matches: Prevent insertion"
  ON public.matches
  FOR INSERT
  WITH CHECK (false);

-- ============================================================================
-- TEAMS TABLE - RLS & POLICIES (PUBLIC READ-ONLY)
-- ============================================================================

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Policy: All users can read teams
CREATE POLICY "Teams: Allow public read access"
  ON public.teams
  FOR SELECT
  USING (true);

-- Policy: Prevent modification (admin only)
CREATE POLICY "Teams: Prevent user modification"
  ON public.teams
  FOR UPDATE
  USING (false);

CREATE POLICY "Teams: Prevent deletion"
  ON public.teams
  FOR DELETE
  USING (false);

CREATE POLICY "Teams: Prevent insertion"
  ON public.teams
  FOR INSERT
  WITH CHECK (false);

-- ============================================================================
-- END OF SECURITY AND TRIGGERS SETUP
-- ============================================================================
