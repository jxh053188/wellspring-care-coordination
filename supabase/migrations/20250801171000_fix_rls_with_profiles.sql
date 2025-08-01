-- Fix RLS policies to work with the profiles table structure
-- First, let's make sure we have the right policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create proper profile policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Now fix the care team policies to use the profile system
-- Drop the overly permissive policies we created
DROP POLICY IF EXISTS "Anyone can view all care teams" ON public.care_teams;
DROP POLICY IF EXISTS "Anyone can view care team members" ON public.care_team_members;
DROP POLICY IF EXISTS "Anyone can insert team members" ON public.care_team_members;

-- Create better policies that use the profile system
CREATE POLICY "Users can view care teams they are members of" 
ON public.care_teams 
FOR SELECT 
TO authenticated
USING (
  id IN (
    SELECT ctm.care_team_id 
    FROM care_team_members ctm 
    JOIN profiles p ON p.id = ctm.user_id 
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view care team members of teams they belong to" 
ON public.care_team_members 
FOR SELECT 
TO authenticated
USING (
  care_team_id IN (
    SELECT ctm.care_team_id 
    FROM care_team_members ctm 
    JOIN profiles p ON p.id = ctm.user_id 
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert team members to teams they admin" 
ON public.care_team_members 
FOR INSERT 
TO authenticated
WITH CHECK (
  care_team_id IN (
    SELECT ctm.care_team_id 
    FROM care_team_members ctm 
    JOIN profiles p ON p.id = ctm.user_id 
    WHERE p.user_id = auth.uid() AND ctm.role = 'admin'
  )
);

-- Update care team creation policy
DROP POLICY IF EXISTS "Anyone can create care teams" ON public.care_teams;

CREATE POLICY "Authenticated users can create care teams" 
ON public.care_teams 
FOR INSERT 
TO authenticated
WITH CHECK (
  created_by IN (
    SELECT p.id FROM profiles p WHERE p.user_id = auth.uid()
  )
);
