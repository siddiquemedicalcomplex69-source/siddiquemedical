-- 0. Cleanup any partially inserted mock data from previous attempts
DELETE FROM public.doctors;
DELETE FROM public.departments;
DELETE FROM auth.users WHERE email LIKE '%@siddiquemc.example';

-- 1. Insert Departments
INSERT INTO public.departments (id, name, description, icon) VALUES
('dd100000-0000-0000-0000-000000000001', 'Cardiology', 'Heart and vascular care', 'HeartPulse'),
('dd200000-0000-0000-0000-000000000002', 'Neurology', 'Brain and nervous system', 'Brain'),
('dd300000-0000-0000-0000-000000000003', 'Orthopedics', 'Bones, joints, muscles', 'Bone'),
('dd400000-0000-0000-0000-000000000004', 'Pediatrics', 'Child health specialists', 'Baby'),
('dd500000-0000-0000-0000-000000000005', 'Dermatology', 'Skin, hair and nails', 'Sparkles'),
('dd600000-0000-0000-0000-000000000006', 'General Medicine', 'Primary care', 'Stethoscope')
ON CONFLICT (name) DO UPDATE SET id = EXCLUDED.id, description = EXCLUDED.description, icon = EXCLUDED.icon;

-- 2. Insert mock Auth Users for doctors
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, role, aud) VALUES
('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'ayesha@siddiquemc.example', 'fake_hash', now(), '{"full_name": "Dr. Ayesha Siddiqui", "role": "doctor"}', now(), now(), 'authenticated', 'authenticated'),
('11111111-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'omar@siddiquemc.example', 'fake_hash', now(), '{"full_name": "Dr. Omar Farooq", "role": "doctor"}', now(), now(), 'authenticated', 'authenticated'),
('11111111-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'zainab@siddiquemc.example', 'fake_hash', now(), '{"full_name": "Dr. Zainab Rahman", "role": "doctor"}', now(), now(), 'authenticated', 'authenticated'),
('11111111-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'hassan@siddiquemc.example', 'fake_hash', now(), '{"full_name": "Dr. Hassan Malik", "role": "doctor"}', now(), now(), 'authenticated', 'authenticated'),
('11111111-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'sana@siddiquemc.example', 'fake_hash', now(), '{"full_name": "Dr. Sana Iqbal", "role": "doctor"}', now(), now(), 'authenticated', 'authenticated'),
('11111111-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'bilal@siddiquemc.example', 'fake_hash', now(), '{"full_name": "Dr. Bilal Ahmed", "role": "doctor"}', now(), now(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Because the trigger on_auth_user_created runs on auth.users inserts, the profiles are created automatically!
-- Let's update their avatars
UPDATE public.profiles SET avatar_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Ayesha%20Siddiqui&backgroundColor=0f766e' WHERE id = '11111111-0000-0000-0000-000000000001';
UPDATE public.profiles SET avatar_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Omar%20Farooq&backgroundColor=0369a1' WHERE id = '11111111-0000-0000-0000-000000000002';
UPDATE public.profiles SET avatar_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Zainab%20Rahman&backgroundColor=1d4ed8' WHERE id = '11111111-0000-0000-0000-000000000003';
UPDATE public.profiles SET avatar_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Hassan%20Malik&backgroundColor=0891b2' WHERE id = '11111111-0000-0000-0000-000000000004';
UPDATE public.profiles SET avatar_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Sana%20Iqbal&backgroundColor=be185d' WHERE id = '11111111-0000-0000-0000-000000000005';
UPDATE public.profiles SET avatar_url = 'https://api.dicebear.com/9.x/initials/svg?seed=Bilal%20Ahmed&backgroundColor=15803d' WHERE id = '11111111-0000-0000-0000-000000000006';

-- 3. Insert into Doctors
INSERT INTO public.doctors (id, profile_id, department_id, specialty, qualification, experience_yrs, consultation_fee, languages, slot_duration_min, bio) VALUES
('dc100000-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'dd100000-0000-0000-0000-000000000001', 'Interventional Cardiologist', 'MBBS, MD, DM', 14, 2500, ARRAY['English', 'Urdu'], 30, 'Consultant cardiologist with over a decade of experience in complex coronary interventions.'),
('dc200000-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', 'dd200000-0000-0000-0000-000000000002', 'Consultant Neurologist', 'MBBS, MD (Neurology)', 11, 2200, ARRAY['English', 'Urdu'], 30, 'Specialises in stroke management, epilepsy and movement disorders.'),
('dc300000-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003', 'dd300000-0000-0000-0000-000000000003', 'Orthopedic Surgeon', 'MBBS, MS (Ortho)', 9, 2000, ARRAY['English', 'Urdu'], 20, 'Joint replacement and sports injury specialist.'),
('dc400000-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000004', 'dd400000-0000-0000-0000-000000000004', 'Pediatrician', 'MBBS, DCH, FCPS', 16, 1800, ARRAY['English', 'Urdu'], 20, 'Newborn care, vaccinations and childhood illnesses.'),
('dc500000-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000005', 'dd500000-0000-0000-0000-000000000005', 'Dermatologist', 'MBBS, FCPS (Derm)', 7, 2000, ARRAY['English', 'Urdu'], 15, 'Medical and cosmetic dermatology, acne, pigmentation.'),
('dc600000-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000006', 'dd600000-0000-0000-0000-000000000006', 'General Physician', 'MBBS, MRCP', 12, 1500, ARRAY['English', 'Urdu'], 20, 'Primary care, diabetes and hypertension management.')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Availability for all doctors
-- This uses a cross join trick to give all doctors the standard Mon-Sat schedule
INSERT INTO public.availability (doctor_id, day, start_time, end_time)
SELECT d.id, a.day, a.start_time, a.end_time
FROM public.doctors d
CROSS JOIN (
  VALUES 
    ('monday'::day_of_week, '09:00:00'::time, '13:00:00'::time),
    ('monday'::day_of_week, '16:00:00'::time, '19:00:00'::time),
    ('tuesday'::day_of_week, '09:00:00'::time, '13:00:00'::time),
    ('wednesday'::day_of_week, '09:00:00'::time, '13:00:00'::time),
    ('wednesday'::day_of_week, '16:00:00'::time, '19:00:00'::time),
    ('thursday'::day_of_week, '09:00:00'::time, '13:00:00'::time),
    ('friday'::day_of_week, '10:00:00'::time, '14:00:00'::time),
    ('saturday'::day_of_week, '10:00:00'::time, '13:00:00'::time)
) AS a(day, start_time, end_time)
ON CONFLICT DO NOTHING;
