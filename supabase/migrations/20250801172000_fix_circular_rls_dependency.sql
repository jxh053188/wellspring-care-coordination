-- Fix circular dependency in RLS policies using SECURITY DEFINER function
-- Create a SECURITY DEFINER function to get the current user's profile ID
CREATE OR REPLACE FUNCTION get_my_profile_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid();
$$;

-- Drop the problematic care_teams policy that causes circular dependency
DROP POLICY IF EXISTS "Authenticated users can create care teams" ON public.care_teams;

-- Create a new policy using the SECURITY DEFINER function
CREATE POLICY "Users can create care teams" 
ON public.care_teams 
FOR INSERT 
TO authenticated
WITH CHECK (created_by = get_my_profile_id());

-- Also fix the other policies that might cause issues
DROP POLICY IF EXISTS "Users can view care teams they are members of" ON public.care_teams;
DROP POLICY IF EXISTS "Users can view care team members of teams they belong to" ON public.care_team_members;
DROP POLICY IF EXISTS "Users can insert team members to teams they admin" ON public.care_team_members;

-- Create simpler, non-recursive policies for care_teams
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

-- Create simpler, non-recursive policies for care_team_members
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
