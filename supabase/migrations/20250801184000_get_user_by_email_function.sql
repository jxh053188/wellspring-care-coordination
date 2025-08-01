-- Create a function to check if a user exists by email and get their profile
CREATE OR REPLACE FUNCTION get_user_by_email(p_email TEXT)
RETURNS TABLE(user_id UUID, profile_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        p.id as profile_id
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.user_id = u.id
    WHERE LOWER(u.email) = LOWER(p_email)
    AND u.email_confirmed_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_by_email(TEXT) TO authenticated;
