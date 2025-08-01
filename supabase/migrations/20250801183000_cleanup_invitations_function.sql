-- Create a function to clean up pending invitations when a user is removed from a care team
CREATE OR REPLACE FUNCTION cleanup_user_invitations(p_user_id UUID, p_care_team_id UUID)
RETURNS VOID AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Get the user's email from auth.users
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = p_user_id;
    
    -- If we found the email, delete any pending invitations for this email and care team
    IF user_email IS NOT NULL THEN
        DELETE FROM public.pending_invitations
        WHERE care_team_id = p_care_team_id
        AND email = user_email;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_user_invitations(UUID, UUID) TO authenticated;
