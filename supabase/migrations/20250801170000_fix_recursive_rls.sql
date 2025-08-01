-- Temporarily disable RLS to fix infinite recursion
ALTER TABLE public.care_team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_teams DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.care_team_members;
DROP POLICY IF EXISTS "Users can view other members of teams they belong to" ON public.care_team_members;
DROP POLICY IF EXISTS "Admins can insert team members" ON public.care_team_members;
DROP POLICY IF EXISTS "Admins can update team members" ON public.care_team_members;
DROP POLICY IF EXISTS "Admins can delete team members" ON public.care_team_members;
DROP POLICY IF EXISTS "Users can view care teams they belong to" ON public.care_teams;
DROP POLICY IF EXISTS "Users can create care teams" ON public.care_teams;
DROP POLICY IF EXISTS "Admins can update their care teams" ON public.care_teams;

-- Drop the helper functions that might cause recursion
DROP FUNCTION IF EXISTS public.is_team_member(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_team_admin(UUID, UUID);

-- Create simple, non-recursive policies for care_teams
CREATE POLICY "Anyone can create care teams" 
ON public.care_teams 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Anyone can view all care teams" 
ON public.care_teams 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Creators can update their care teams" 
ON public.care_teams 
FOR UPDATE 
TO authenticated
USING (auth.uid() = created_by);

-- Create simple, non-recursive policies for care_team_members
CREATE POLICY "Anyone can view care team members" 
ON public.care_team_members 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Anyone can insert team members" 
ON public.care_team_members 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their own memberships" 
ON public.care_team_members 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memberships" 
ON public.care_team_members 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Re-enable RLS with the new simple policies
ALTER TABLE public.care_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_team_members ENABLE ROW LEVEL SECURITY;
