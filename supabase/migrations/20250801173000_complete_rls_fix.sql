-- Comprehensive fix for all circular RLS dependencies
-- Ensure the get_my_profile_id function exists (idempotent)
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid();
$$;

-- Drop ALL existing problematic policies that might cause circular dependencies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create care teams" ON public.care_teams;
DROP POLICY IF EXISTS "Users can view care teams they are members of" ON public.care_teams;
DROP POLICY IF EXISTS "Creators can update their care teams" ON public.care_teams;
DROP POLICY IF EXISTS "Users can view care team members of teams they belong to" ON public.care_team_members;
DROP POLICY IF EXISTS "Users can insert team members to teams they admin" ON public.care_team_members;
DROP POLICY IF EXISTS "Users can update their own memberships" ON public.care_team_members;
DROP POLICY IF EXISTS "Users can delete their own memberships" ON public.care_team_members;

-- Create simple, non-circular profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

-- Create care_teams policies using the SECURITY DEFINER function
CREATE POLICY "Users can create care teams" 
ON public.care_teams 
FOR INSERT 
TO authenticated
WITH CHECK (created_by = get_my_profile_id());

CREATE POLICY "Users can view care teams they are members of" 
ON public.care_teams 
FOR SELECT 
TO authenticated
USING (
  id IN (
    SELECT care_team_id 
    FROM care_team_members 
    WHERE user_id = get_my_profile_id()
  )
);

CREATE POLICY "Team creators can update their teams" 
ON public.care_teams 
FOR UPDATE 
TO authenticated
USING (created_by = get_my_profile_id());

-- Create care_team_members policies using the SECURITY DEFINER function
CREATE POLICY "Users can view care team members of teams they belong to" 
ON public.care_team_members 
FOR SELECT 
TO authenticated
USING (
  care_team_id IN (
    SELECT care_team_id 
    FROM care_team_members 
    WHERE user_id = get_my_profile_id()
  )
);

CREATE POLICY "Users can insert team members to teams they admin" 
ON public.care_team_members 
FOR INSERT 
TO authenticated
WITH CHECK (
  care_team_id IN (
    SELECT care_team_id 
    FROM care_team_members 
    WHERE user_id = get_my_profile_id() AND role = 'admin'
  )
);

CREATE POLICY "Users can update their own memberships" 
ON public.care_team_members 
FOR UPDATE 
TO authenticated
USING (user_id = get_my_profile_id());

CREATE POLICY "Users can delete their own memberships" 
ON public.care_team_members 
FOR DELETE 
TO authenticated
USING (user_id = get_my_profile_id());
