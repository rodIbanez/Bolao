-- ============================================================================
-- ADD UNIQUE CONSTRAINT TO GROUPS TABLE (Safe - Handles existing constraint)
-- ============================================================================

-- Drop the constraint if it already exists (idempotent)
ALTER TABLE public.groups
DROP CONSTRAINT IF EXISTS unique_group_name CASCADE;

-- Add unique constraint on the name column
ALTER TABLE public.groups
ADD CONSTRAINT unique_group_name UNIQUE (name);

-- Verify the constraint was added
SELECT constraint_name, constraint_type, table_name
FROM information_schema.table_constraints
WHERE table_name = 'groups' AND constraint_name = 'unique_group_name';

-- ============================================================================
-- END
-- ============================================================================
