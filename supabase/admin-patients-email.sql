-- Run this file in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION admin_get_patients_with_email()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  registered_at TIMESTAMPTZ,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify caller is an admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can view patient emails';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    u.email::TEXT,
    p.phone,
    p.created_at AS registered_at,
    p.is_active
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.role = 'patient'
  ORDER BY p.created_at DESC;
END;
$$;
