-- Create health tables if they don't exist and fix RLS policies
-- This migration ensures health tables exist and have proper RLS policies

-- Create medications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_team_id UUID NOT NULL REFERENCES public.care_teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  instructions TEXT,
  prescribing_doctor TEXT,
  pharmacy TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medication logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.medication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  administered_by UUID NOT NULL REFERENCES public.profiles(id),
  administered_at TIMESTAMP WITH TIME ZONE NOT NULL,
  dose_amount DECIMAL(10,2),
  dose_unit TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create health vitals table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.health_vitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_team_id UUID NOT NULL REFERENCES public.care_teams(id) ON DELETE CASCADE,
  vital_type TEXT NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES public.profiles(id),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create allergies table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.allergies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_team_id UUID NOT NULL REFERENCES public.care_teams(id) ON DELETE CASCADE,
  allergen TEXT NOT NULL,
  severity TEXT NOT NULL,
  reaction TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
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

-- Create simplified RLS policies for medications
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

-- Create RLS policies for health vitals
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

-- Create RLS policies for allergies
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

-- Create RLS policies for medication logs
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
  )
);
