-- Create app roles enum
CREATE TYPE public.care_team_role AS ENUM ('admin', 'family', 'friend', 'professional', 'caregiver');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create care teams table
CREATE TABLE public.care_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  care_recipient_name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create care team members table for role-based access
CREATE TABLE public.care_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_team_id UUID NOT NULL REFERENCES public.care_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role care_team_role NOT NULL DEFAULT 'family',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(care_team_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_team_members ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Care teams policies
CREATE POLICY "Users can view care teams they belong to" 
ON public.care_teams 
FOR SELECT 
TO authenticated
USING (
  id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create care teams" 
ON public.care_teams 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update their care teams" 
ON public.care_teams 
FOR UPDATE 
TO authenticated
USING (
  id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Care team members policies
CREATE POLICY "Users can view team members of teams they belong to" 
ON public.care_team_members 
FOR SELECT 
TO authenticated
USING (
  care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage team members" 
ON public.care_team_members 
FOR ALL 
TO authenticated
USING (
  care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can join teams when invited" 
ON public.care_team_members 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_care_teams_updated_at
  BEFORE UPDATE ON public.care_teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();