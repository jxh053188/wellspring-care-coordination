-- Create nutrition_logs table for food and water tracking
CREATE TABLE public.nutrition_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_team_id UUID NOT NULL REFERENCES public.care_teams(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL CHECK (log_type IN ('food', 'water')),
  
  -- Food-specific fields
  food_name TEXT,
  portion_size TEXT,
  calories DECIMAL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  
  -- Water-specific fields
  water_amount_ml INTEGER,
  
  -- Common fields
  notes TEXT,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mood_logs table for mental state tracking
CREATE TABLE public.mood_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_team_id UUID NOT NULL REFERENCES public.care_teams(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Mood tracking fields
  mood_level INTEGER NOT NULL CHECK (mood_level >= 1 AND mood_level <= 10),
  mood_type TEXT NOT NULL CHECK (mood_type IN ('happy', 'sad', 'anxious', 'angry', 'calm', 'stressed', 'excited', 'tired', 'confused', 'content')),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  
  -- Additional tracking
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
  
  notes TEXT,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_nutrition_logs_care_team_logged_at ON public.nutrition_logs(care_team_id, logged_at DESC);
CREATE INDEX idx_nutrition_logs_log_type ON public.nutrition_logs(log_type);
CREATE INDEX idx_mood_logs_care_team_logged_at ON public.mood_logs(care_team_id, logged_at DESC);

-- Enable RLS
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for nutrition_logs
CREATE POLICY "Users can view nutrition logs for their care teams" ON public.nutrition_logs
  FOR SELECT USING (
    care_team_id IN (
      SELECT care_team_id FROM public.care_team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert nutrition logs for their care teams" ON public.nutrition_logs
  FOR INSERT WITH CHECK (
    care_team_id IN (
      SELECT care_team_id FROM public.care_team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own nutrition logs" ON public.nutrition_logs
  FOR UPDATE USING (
    logged_by IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own nutrition logs" ON public.nutrition_logs
  FOR DELETE USING (
    logged_by IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- RLS policies for mood_logs
CREATE POLICY "Users can view mood logs for their care teams" ON public.mood_logs
  FOR SELECT USING (
    care_team_id IN (
      SELECT care_team_id FROM public.care_team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert mood logs for their care teams" ON public.mood_logs
  FOR INSERT WITH CHECK (
    care_team_id IN (
      SELECT care_team_id FROM public.care_team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own mood logs" ON public.mood_logs
  FOR UPDATE USING (
    logged_by IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own mood logs" ON public.mood_logs
  FOR DELETE USING (
    logged_by IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_nutrition_logs_updated_at
  BEFORE UPDATE ON public.nutrition_logs
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_mood_logs_updated_at
  BEFORE UPDATE ON public.mood_logs
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
