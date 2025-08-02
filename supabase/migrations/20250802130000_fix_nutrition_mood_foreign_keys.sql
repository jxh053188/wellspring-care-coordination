-- Fix foreign key constraints in nutrition_logs and mood_logs tables
-- Change logged_by to reference auth.users(id) instead of profiles(id) for consistency

-- First, remove the existing foreign key constraints
ALTER TABLE public.nutrition_logs DROP CONSTRAINT nutrition_logs_logged_by_fkey;
ALTER TABLE public.mood_logs DROP CONSTRAINT mood_logs_logged_by_fkey;

-- Add new foreign key constraints that reference auth.users(id)
ALTER TABLE public.nutrition_logs ADD CONSTRAINT nutrition_logs_logged_by_fkey 
  FOREIGN KEY (logged_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.mood_logs ADD CONSTRAINT mood_logs_logged_by_fkey 
  FOREIGN KEY (logged_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies to use auth.uid() directly instead of profile lookups
DROP POLICY IF EXISTS "Users can view nutrition logs for their care teams" ON public.nutrition_logs;
CREATE POLICY "Users can view nutrition logs for their care teams" ON public.nutrition_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.care_team_members 
      WHERE care_team_id = nutrition_logs.care_team_id 
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create nutrition logs for their care teams" ON public.nutrition_logs;
CREATE POLICY "Users can create nutrition logs for their care teams" ON public.nutrition_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.care_team_members 
      WHERE care_team_id = nutrition_logs.care_team_id 
      AND user_id = auth.uid()
    )
    AND logged_by = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update their own nutrition logs" ON public.nutrition_logs;
CREATE POLICY "Users can update their own nutrition logs" ON public.nutrition_logs
  FOR UPDATE USING (logged_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own nutrition logs" ON public.nutrition_logs;
CREATE POLICY "Users can delete their own nutrition logs" ON public.nutrition_logs
  FOR DELETE USING (logged_by = auth.uid());

-- Similar policies for mood_logs
DROP POLICY IF EXISTS "Users can view mood logs for their care teams" ON public.mood_logs;
CREATE POLICY "Users can view mood logs for their care teams" ON public.mood_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.care_team_members 
      WHERE care_team_id = mood_logs.care_team_id 
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create mood logs for their care teams" ON public.mood_logs;
CREATE POLICY "Users can create mood logs for their care teams" ON public.mood_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.care_team_members 
      WHERE care_team_id = mood_logs.care_team_id 
      AND user_id = auth.uid()
    )
    AND logged_by = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update their own mood logs" ON public.mood_logs;
CREATE POLICY "Users can update their own mood logs" ON public.mood_logs
  FOR UPDATE USING (logged_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own mood logs" ON public.mood_logs;
CREATE POLICY "Users can delete their own mood logs" ON public.mood_logs
  FOR DELETE USING (logged_by = auth.uid());
