-- ============================================================
-- PHASE 3: ADMIN PANEL ENHANCEMENTS
-- Run this file in your Supabase SQL Editor
-- ============================================================

-- 1. ADD IS_ACTIVE TO PROFILES
-- Allows admins to suspend patient accounts
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. GLOBAL SETTINGS TABLE
-- Stores a single row for global hospital configurations
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  hospital_name TEXT NOT NULL DEFAULT 'Siddique Medical Complex',
  contact_number TEXT NOT NULL DEFAULT '+92 300 1234567',
  emergency_email TEXT NOT NULL DEFAULT 'emergency@siddiquemedical.com',
  address TEXT NOT NULL DEFAULT '123 Health Avenue, Lahore, Pakistan',
  banner_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  banner_text TEXT NOT NULL DEFAULT 'Please note: OPD will be closed this Friday for a public holiday.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure only one row exists
INSERT INTO public.settings (id) VALUES ('global') ON CONFLICT DO NOTHING;

-- RLS for Settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings"
  ON public.settings FOR SELECT
  USING (TRUE);

CREATE POLICY "Only admins can update settings"
  ON public.settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. ADMIN CREATE DOCTOR RPC
-- Allows an admin to securely create an auth user, profile, and doctor record all at once
CREATE OR REPLACE FUNCTION admin_create_doctor(
  admin_uid UUID,
  doc_email TEXT,
  doc_password TEXT,
  doc_name TEXT,
  doc_department_id UUID,
  doc_specialty TEXT,
  doc_qualification TEXT,
  doc_fee NUMERIC,
  doc_experience INT,
  doc_slot_duration INT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin BOOLEAN;
  new_user_id UUID;
BEGIN
  -- 1. Verify caller is an admin
  SELECT (role = 'admin') INTO is_admin FROM public.profiles WHERE id = admin_uid;
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can create doctors';
  END IF;

  -- 2. Generate new UUID for the doctor
  new_user_id := gen_random_uuid();

  -- 3. Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at,
    role,
    aud
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    doc_email,
    crypt(doc_password, gen_salt('bf')),
    now(),
    json_build_object('full_name', doc_name, 'role', 'doctor'),
    json_build_object('provider','email','providers',array['email']),
    now(),
    now(),
    'authenticated',
    'authenticated'
  );

  -- Note: The profile is automatically created by the trigger on auth.users!
  -- We just need to wait a tiny fraction of a second for the trigger to finish,
  -- or we can just run an update on the profile to make sure its role is correct.

  UPDATE public.profiles 
  SET role = 'doctor', full_name = doc_name
  WHERE id = new_user_id;

  -- 4. Insert into public.doctors
  INSERT INTO public.doctors (
    profile_id,
    department_id,
    specialty,
    qualification,
    experience_yrs,
    consultation_fee,
    slot_duration_min,
    is_active
  ) VALUES (
    new_user_id,
    doc_department_id,
    doc_specialty,
    doc_qualification,
    doc_experience,
    doc_fee,
    doc_slot_duration,
    TRUE
  );

  RETURN new_user_id;
END;
$$;
