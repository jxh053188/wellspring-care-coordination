-- Add pending invitations table for managing invites before users sign up
CREATE TABLE public.pending_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_team_id UUID NOT NULL REFERENCES public.care_teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role care_team_role NOT NULL DEFAULT 'family',
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  personal_message TEXT,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  UNIQUE(care_team_id, email)
);

-- Enable RLS on pending invitations
ALTER TABLE public.pending_invitations ENABLE ROW LEVEL SECURITY;

-- Allow users to view invitations for teams they belong to
CREATE POLICY "Users can view invitations for their teams" 
ON public.pending_invitations 
FOR SELECT 
TO authenticated
USING (
  care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Allow users to create invitations for teams they admin
CREATE POLICY "Admins can create invitations" 
ON public.pending_invitations 
FOR INSERT 
TO authenticated
WITH CHECK (
  care_team_id IN (
    SELECT care_team_id 
    FROM public.care_team_members 
    WHERE user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) 
    AND role = 'admin'
  )
);

-- Allow users to update invitations they created
CREATE POLICY "Users can update invitations they created" 
ON public.pending_invitations 
FOR UPDATE 
TO authenticated
USING (invited_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
