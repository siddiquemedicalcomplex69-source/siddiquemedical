-- 1. First, register an account normally on localhost:5173/register
-- Email: mydoctor@test.com
-- Password: password123

-- 2. Then, run this SQL to upgrade that account to a doctor:
DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find the user you just registered
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'mydoctor@test.com';
  
  -- Update their profile to doctor
  UPDATE public.profiles SET role = 'doctor' WHERE id = target_user_id;

  -- Add them to the doctors table
  INSERT INTO public.doctors (id, profile_id, department_id, specialty, qualification, experience_yrs, consultation_fee, slot_duration_min)
  VALUES (
    gen_random_uuid(),
    target_user_id,
    (SELECT id FROM departments WHERE name = 'General Medicine' LIMIT 1),
    'General Physician',
    'MBBS',
    5,
    1500,
    30
  )
  ON CONFLICT (profile_id) DO NOTHING;

END $$;
