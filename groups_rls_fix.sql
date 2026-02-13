-- ============================================================================
-- FIX RLS POLICIES FOR GROUPS TABLE (Allow INSERT)
-- ============================================================================

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Groups: Allow authenticated users to create groups" ON public.groups;

-- Create policy allowing authenticated users to INSERT groups they own
CREATE POLICY "Groups: Allow authenticated users to create groups"
  ON public.groups
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated_user'
    AND auth.uid() = owner_user_id
  );

-- Verify policies
SELECT policyname, permissive, qual
FROM pg_policies
WHERE tablename = 'groups'
ORDER BY policyname;

-- ============================================================================
-- END
-- ============================================================================
