-- Create medications table
CREATE TABLE public.medications (
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
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medication logs table
CREATE TABLE public.medication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  care_team_id UUID NOT NULL REFERENCES public.care_teams(id) ON DELETE CASCADE,
  given_by UUID NOT NULL REFERENCES auth.users(id),
  given_at TIMESTAMP WITH TIME ZONE NOT NULL,
  dosage_given TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create health vitals table
CREATE TABLE public.health_vitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_team_id UUID NOT NULL REFERENCES public.care_teams(id) ON DELETE CASCADE,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  weight DECIMAL(5,2), -- in pounds or kg
  weight_unit TEXT DEFAULT 'lbs', -- 'lbs' or 'kg'
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  heart_rate INTEGER, -- bpm
  temperature DECIMAL(4,1), -- in fahrenheit or celsius
  temperature_unit TEXT DEFAULT 'F', -- 'F' or 'C'
  blood_sugar INTEGER, -- mg/dL
  oxygen_saturation INTEGER, -- percentage
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create allergies table
CREATE TABLE public.allergies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_team_id UUID NOT NULL REFERENCES public.care_teams(id) ON DELETE CASCADE,
  allergen TEXT NOT NULL,
  severity TEXT, -- 'mild', 'moderate', 'severe'
  reaction TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;

-- Create helper functions to avoid RLS recursion
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

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON public.medications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_allergies_updated_at
  BEFORE UPDATE ON public.allergies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
