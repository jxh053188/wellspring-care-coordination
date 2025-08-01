-- Fix RLS policies to use correct column names
-- The care_team_members table uses user_id, not profile_id

-- Drop the problematic policies created in the previous migration
DROP POLICY IF EXISTS "Users can view team medications" ON public.medications;
DROP POLICY IF EXISTS "Users can create team medications" ON public.medications;
DROP POLICY IF EXISTS "Users can update team medications" ON public.medications;
DROP POLICY IF EXISTS "Users can view team health vitals" ON public.health_vitals;
DROP POLICY IF EXISTS "Users can create team health vitals" ON public.health_vitals;
DROP POLICY IF EXISTS "Users can update their own health vitals" ON public.health_vitals;
DROP POLICY IF EXISTS "Users can view team allergies" ON public.allergies;
DROP POLICY IF EXISTS "Users can create team allergies" ON public.allergies;
DROP POLICY IF EXISTS "Users can update team allergies" ON public.allergies;
DROP POLICY IF EXISTS "Users can view team medication logs" ON public.medication_logs;
DROP POLICY IF EXISTS "Users can create team medication logs" ON public.medication_logs;

-- Create corrected RLS policies for medications
CREATE POLICY "Users can view team medications" 
ON public.medications 
FOR SELECT 
TO authenticated
USING (
  care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE user_id = auth.uid()
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
    WHERE user_id = auth.uid()
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
    WHERE user_id = auth.uid()
  )
);

-- Create corrected RLS policies for health vitals
CREATE POLICY "Users can view team health vitals" 
ON public.health_vitals 
FOR SELECT 
TO authenticated
USING (
  care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE user_id = auth.uid()
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
    WHERE user_id = auth.uid()
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

-- Create corrected RLS policies for allergies
CREATE POLICY "Users can view team allergies" 
ON public.allergies 
FOR SELECT 
TO authenticated
USING (
  care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE user_id = auth.uid()
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
    WHERE user_id = auth.uid()
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
    WHERE user_id = auth.uid()
  )
);

-- Create corrected RLS policies for medication logs
CREATE POLICY "Users can view team medication logs" 
ON public.medication_logs 
FOR SELECT 
TO authenticated
USING (
  medication_id IN (
    SELECT id FROM public.medications WHERE care_team_id IN (
      SELECT care_team_id 
      FROM public.care_team_members 
      WHERE user_id = auth.uid()
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
      WHERE user_id = auth.uid()
    )
  )
);
