-- Fix the infinite recursion in care_team_members policies
-- This should be run BEFORE creating the health tables

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view team members of teams they belong to" ON public.care_team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON public.care_team_members;

-- Create fixed policies that avoid recursion
CREATE POLICY "Users can view their own memberships" 
ON public.care_team_members 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view other members of teams they belong to" 
ON public.care_team_members 
FOR SELECT 
TO authenticated
USING (
  care_team_id IN (
    SELECT ctm.care_team_id 
    FROM care_team_members ctm 
    WHERE ctm.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can insert team members" 
ON public.care_team_members 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM care_team_members ctm
    WHERE ctm.care_team_id = care_team_id 
    AND ctm.user_id = auth.uid() 
    AND ctm.role = 'admin'
  )
);

CREATE POLICY "Admins can update team members" 
ON public.care_team_members 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM care_team_members ctm
    WHERE ctm.care_team_id = care_team_id 
    AND ctm.user_id = auth.uid() 
    AND ctm.role = 'admin'
  )
);

CREATE POLICY "Admins can delete team members" 
ON public.care_team_members 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM care_team_members ctm
    WHERE ctm.care_team_id = care_team_id 
    AND ctm.user_id = auth.uid() 
    AND ctm.role = 'admin'
  )
);
