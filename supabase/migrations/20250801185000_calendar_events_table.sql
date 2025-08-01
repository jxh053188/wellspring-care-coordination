-- Create calendar events table for care team scheduling
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_team_id UUID NOT NULL REFERENCES public.care_teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('time', 'allday', 'milestone', 'task')),
  calendar_type TEXT NOT NULL CHECK (calendar_type IN ('medication', 'appointment', 'care', 'task')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT false,
  location TEXT,
  reminder_minutes INTEGER,
  recurrence_rule TEXT, -- For recurring events (future enhancement)
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view events for care teams they belong to
CREATE POLICY "Users can view events for their care teams" 
ON public.calendar_events 
FOR SELECT 
TO authenticated
USING (
  care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Policy: Users can create events for care teams they belong to
CREATE POLICY "Users can create events for their care teams" 
ON public.calendar_events 
FOR INSERT 
TO authenticated
WITH CHECK (
  care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Policy: Users can update events they created for their care teams
CREATE POLICY "Users can update their events for their care teams" 
ON public.calendar_events 
FOR UPDATE 
TO authenticated
USING (
  created_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Policy: Users can delete events they created for their care teams
CREATE POLICY "Users can delete their events for their care teams" 
ON public.calendar_events 
FOR DELETE 
TO authenticated
USING (
  created_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Create index for performance
CREATE INDEX idx_calendar_events_care_team_id ON public.calendar_events(care_team_id);
CREATE INDEX idx_calendar_events_start_date ON public.calendar_events(start_date);
CREATE INDEX idx_calendar_events_created_by ON public.calendar_events(created_by);
