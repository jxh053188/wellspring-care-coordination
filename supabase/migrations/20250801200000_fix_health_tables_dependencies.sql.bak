-- Fix dependency issues with health tables
-- First drop all dependent policies
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

-- Now we can safely drop the function
DROP FUNCTION IF EXISTS public.is_team_member(UUID, UUID);

-- Create simplified policies that don't use the recursive function
-- For medications
CREATE POLICY "Users can view team medications" 
ON public.medications 
FOR SELECT 
TO authenticated
USING (
  care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create team medications" 
ON public.medications 
FOR INSERT 
TO authenticated
WITH CHECK (
  care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  ) AND created_by IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update team medications" 
ON public.medications 
FOR UPDATE 
TO authenticated
USING (
  care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

-- For health vitals
CREATE POLICY "Users can view team health vitals" 
ON public.health_vitals 
FOR SELECT 
TO authenticated
USING (
  care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create team health vitals" 
ON public.health_vitals 
FOR INSERT 
TO authenticated
WITH CHECK (
  care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  ) AND recorded_by IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own health vitals" 
ON public.health_vitals 
FOR UPDATE 
TO authenticated
USING (
  recorded_by IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- For allergies
CREATE POLICY "Users can view team allergies" 
ON public.allergies 
FOR SELECT 
TO authenticated
USING (
  care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create team allergies" 
ON public.allergies 
FOR INSERT 
TO authenticated
WITH CHECK (
  care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  ) AND created_by IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update team allergies" 
ON public.allergies 
FOR UPDATE 
TO authenticated
USING (
  care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

-- For medication logs
CREATE POLICY "Users can view team medication logs" 
ON public.medication_logs 
FOR SELECT 
TO authenticated
USING (
  medication_id IN (
    SELECT id FROM public.medications WHERE care_team_id IN (
      SELECT care_team_id 
      FROM public.care_team_members 
      WHERE profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can create team medication logs" 
ON public.medication_logs 
FOR INSERT 
TO authenticated
WITH CHECK (
  medication_id IN (
    SELECT id FROM public.medications WHERE care_team_id IN (
      SELECT care_team_id 
      FROM public.care_team_members 
      WHERE profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  ) AND administered_by IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);
