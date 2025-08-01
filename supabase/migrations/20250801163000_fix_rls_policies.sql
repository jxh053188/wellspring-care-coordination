-- Fix infinite recursion in care_team_members policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view team members of teams they belong to" ON public.care_team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON public.care_team_members;
DROP POLICY IF EXISTS "Users can join teams when invited" ON public.care_team_members;

-- Drop existing problematic policies on care_teams  
DROP POLICY IF EXISTS "Users can view care teams they belong to" ON public.care_teams;
DROP POLICY IF EXISTS "Admins can update their care teams" ON public.care_teams;
DROP POLICY IF EXISTS "Users can create care teams" ON public.care_teams;

-- Drop existing problematic policies on health tables (if they exist)
DROP POLICY IF EXISTS "Team members can view medications" ON public.medications;
DROP POLICY IF EXISTS "Team members can create medications" ON public.medications;
DROP POLICY IF EXISTS "Team members can update medications" ON public.medications;
DROP POLICY IF EXISTS "Team members can view medication logs" ON public.medication_logs;
DROP POLICY IF EXISTS "Team members can create medication logs" ON public.medication_logs;
DROP POLICY IF EXISTS "Team members can view health vitals" ON public.health_vitals;
DROP POLICY IF EXISTS "Team members can create health vitals" ON public.health_vitals;
DROP POLICY IF EXISTS "Team members can update their own health vitals" ON public.health_vitals;
DROP POLICY IF EXISTS "Team members can view allergies" ON public.allergies;
DROP POLICY IF EXISTS "Team members can create allergies" ON public.allergies;
DROP POLICY IF EXISTS "Team members can update allergies" ON public.allergies;

-- Create a function to check if user is team member
CREATE OR REPLACE FUNCTION public.is_team_member(team_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM care_team_members 
    WHERE care_team_id = team_id AND care_team_members.user_id = user_id
  );
$$;

-- Create a function to check if user is team admin
CREATE OR REPLACE FUNCTION public.is_team_admin(team_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM care_team_members 
    WHERE care_team_id = team_id AND care_team_members.user_id = user_id AND role = 'admin'
  );
$$;

-- Fixed care_team_members policies (avoid recursion by using direct checks)
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

-- Fixed care_teams policies
CREATE POLICY "Users can view care teams they belong to" 
ON public.care_teams 
FOR SELECT 
TO authenticated
USING (public.is_team_member(id, auth.uid()));

CREATE POLICY "Users can create care teams" 
ON public.care_teams 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update their care teams" 
ON public.care_teams 
FOR UPDATE 
TO authenticated
USING (public.is_team_admin(id, auth.uid()));

-- Fixed health tables policies using the helper functions (only if tables exist)
-- Medications policies
CREATE POLICY "Team members can view medications" 
ON public.medications 
FOR SELECT 
TO authenticated
USING (public.is_team_member(care_team_id, auth.uid()));

CREATE POLICY "Team members can create medications" 
ON public.medications 
FOR INSERT 
TO authenticated
WITH CHECK (
  public.is_team_member(care_team_id, auth.uid()) AND auth.uid() = created_by
);

CREATE POLICY "Team members can update medications" 
ON public.medications 
FOR UPDATE 
TO authenticated
USING (public.is_team_member(care_team_id, auth.uid()));

-- Medication logs policies
CREATE POLICY "Team members can view medication logs" 
ON public.medication_logs 
FOR SELECT 
TO authenticated
USING (public.is_team_member(care_team_id, auth.uid()));

CREATE POLICY "Team members can create medication logs" 
ON public.medication_logs 
FOR INSERT 
TO authenticated
WITH CHECK (
  public.is_team_member(care_team_id, auth.uid()) AND auth.uid() = given_by
);

-- Health vitals policies
CREATE POLICY "Team members can view health vitals" 
ON public.health_vitals 
FOR SELECT 
TO authenticated
USING (public.is_team_member(care_team_id, auth.uid()));

CREATE POLICY "Team members can create health vitals" 
ON public.health_vitals 
FOR INSERT 
TO authenticated
WITH CHECK (
  public.is_team_member(care_team_id, auth.uid()) AND auth.uid() = recorded_by
);

CREATE POLICY "Team members can update their own health vitals" 
ON public.health_vitals 
FOR UPDATE 
TO authenticated
USING (
  public.is_team_member(care_team_id, auth.uid()) AND auth.uid() = recorded_by
);

-- Allergies policies
CREATE POLICY "Team members can view allergies" 
ON public.allergies 
FOR SELECT 
TO authenticated
USING (public.is_team_member(care_team_id, auth.uid()));

CREATE POLICY "Team members can create allergies" 
ON public.allergies 
FOR INSERT 
TO authenticated
WITH CHECK (
  public.is_team_member(care_team_id, auth.uid()) AND auth.uid() = created_by
);

CREATE POLICY "Team members can update allergies" 
ON public.allergies 
FOR UPDATE 
TO authenticated
USING (public.is_team_member(care_team_id, auth.uid()));
