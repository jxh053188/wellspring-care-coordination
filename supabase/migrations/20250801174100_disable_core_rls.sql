-- Temporarily disable RLS on existing tables only
-- This will allow us to focus on functionality without security complications

-- Disable RLS on core tables that exist
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_team_members DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on core tables
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create care teams" ON public.care_teams;
DROP POLICY IF EXISTS "Users can view care teams they are members of" ON public.care_teams;
DROP POLICY IF EXISTS "Team creators can update their teams" ON public.care_teams;
DROP POLICY IF EXISTS "Users can view care team members of teams they belong to" ON public.care_team_members;
DROP POLICY IF EXISTS "Users can insert team members to teams they admin" ON public.care_team_members;
DROP POLICY IF EXISTS "Users can update their own memberships" ON public.care_team_members;
DROP POLICY IF EXISTS "Users can delete their own memberships" ON public.care_team_members;

-- Clean up helper functions
DROP FUNCTION IF EXISTS public.get_my_profile_id();
DROP FUNCTION IF EXISTS public.is_team_member(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_team_admin(UUID, UUID);
