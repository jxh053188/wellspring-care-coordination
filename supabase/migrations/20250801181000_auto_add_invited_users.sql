-- Function to handle new user signup and auto-add them to care teams if they have pending invitations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert a new profile for the user
  INSERT INTO public.profiles (user_id, first_name, last_name, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(
      TRIM(CONCAT(NEW.raw_user_meta_data->>'first_name', ' ', NEW.raw_user_meta_data->>'last_name')),
      SPLIT_PART(NEW.email, '@', 1)
    )
  );

  -- Check for pending invitations for this email
  -- Add the user to care teams if there are pending invitations
  INSERT INTO public.care_team_members (care_team_id, user_id, role, invited_by)
  SELECT 
    pi.care_team_id,
    p.id,
    pi.role::care_team_role,
    pi.invited_by
  FROM public.pending_invitations pi
  JOIN public.profiles p ON p.user_id = NEW.id
  WHERE pi.email = NEW.email
    AND pi.status = 'pending'
    AND pi.expires_at > NOW();

  -- Mark the invitations as accepted
  UPDATE public.pending_invitations
  SET status = 'accepted'
  WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run the function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
