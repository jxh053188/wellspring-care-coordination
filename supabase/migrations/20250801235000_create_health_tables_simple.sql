-- Simple health tables without RLS
-- Drop tables if they exist to ensure clean state
DROP TABLE IF EXISTS public.medication_logs CASCADE;
DROP TABLE IF EXISTS public.medications CASCADE;
DROP TABLE IF EXISTS public.health_vitals CASCADE;
DROP TABLE IF EXISTS public.allergies CASCADE;

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
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medication logs table
CREATE TABLE public.medication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  administered_by UUID NOT NULL REFERENCES public.profiles(id),
  administered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  dose_amount DECIMAL(10,2),
  dose_unit TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create health vitals table
CREATE TABLE public.health_vitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_team_id UUID NOT NULL REFERENCES public.care_teams(id) ON DELETE CASCADE,
  vital_type TEXT NOT NULL, -- 'weight', 'blood_pressure', 'heart_rate', 'temperature', 'blood_sugar', 'oxygen_saturation'
  value DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES public.profiles(id),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create allergies table
CREATE TABLE public.allergies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_team_id UUID NOT NULL REFERENCES public.care_teams(id) ON DELETE CASCADE,
  allergen TEXT NOT NULL,
  severity TEXT, -- 'mild', 'moderate', 'severe'
  reaction TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_medications_care_team_id ON public.medications(care_team_id);
CREATE INDEX idx_medications_is_active ON public.medications(is_active);
CREATE INDEX idx_medication_logs_medication_id ON public.medication_logs(medication_id);
CREATE INDEX idx_medication_logs_administered_at ON public.medication_logs(administered_at);
CREATE INDEX idx_health_vitals_care_team_id ON public.health_vitals(care_team_id);
CREATE INDEX idx_health_vitals_vital_type ON public.health_vitals(vital_type);
CREATE INDEX idx_health_vitals_recorded_at ON public.health_vitals(recorded_at);
CREATE INDEX idx_allergies_care_team_id ON public.allergies(care_team_id);
