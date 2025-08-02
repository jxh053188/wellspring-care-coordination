-- Create medical providers table
CREATE TABLE public.medical_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_team_id UUID NOT NULL REFERENCES public.care_teams(id) ON DELETE CASCADE,
  provider_type TEXT NOT NULL, -- 'doctor', 'nurse', 'therapist', 'specialist', 'other'
  name TEXT NOT NULL,
  specialty TEXT, -- e.g., 'Cardiologist', 'Physical Therapist', 'Home Health Nurse'
  practice_name TEXT, -- Hospital/clinic/practice name
  address TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT, -- Additional notes about the provider
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.medical_providers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for medical providers
CREATE POLICY "Team members can view medical providers" 
ON public.medical_providers 
FOR SELECT 
TO authenticated
USING (
  care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE user_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Team members can create medical providers" 
ON public.medical_providers 
FOR INSERT 
TO authenticated
WITH CHECK (
  care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE user_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  ) AND created_by IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can update medical providers" 
ON public.medical_providers 
FOR UPDATE 
TO authenticated
USING (
  care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE user_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Team members can delete medical providers" 
ON public.medical_providers 
FOR DELETE 
TO authenticated
USING (
  care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE user_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

-- Create indexes for better performance
CREATE INDEX idx_medical_providers_care_team_id ON public.medical_providers(care_team_id);
CREATE INDEX idx_medical_providers_provider_type ON public.medical_providers(provider_type);
CREATE INDEX idx_medical_providers_created_at ON public.medical_providers(created_at);
