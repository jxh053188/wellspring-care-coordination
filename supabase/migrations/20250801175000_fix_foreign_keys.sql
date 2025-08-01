-- Fix foreign key constraints to use profiles instead of auth.users
-- This will make the schema consistent and allow us to use profile IDs

-- Drop existing foreign key constraints
ALTER TABLE public.care_teams DROP CONSTRAINT IF EXISTS care_teams_created_by_fkey;
ALTER TABLE public.care_team_members DROP CONSTRAINT IF EXISTS care_team_members_user_id_fkey;
ALTER TABLE public.care_team_members DROP CONSTRAINT IF EXISTS care_team_members_invited_by_fkey;

-- Add new foreign key constraints that reference the profiles table
ALTER TABLE public.care_teams 
ADD CONSTRAINT care_teams_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.care_team_members 
ADD CONSTRAINT care_team_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.care_team_members 
ADD CONSTRAINT care_team_members_invited_by_fkey 
FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
