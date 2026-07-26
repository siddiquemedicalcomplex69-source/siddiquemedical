-- Step 1: Create proper UUID-based categories for the tests
INSERT INTO public.lab_test_categories (id, name, description, is_active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Pathology / Blood', 'General blood tests and profiles', true),
    ('22222222-2222-2222-2222-222222222222', 'Endocrinology / Hormones', 'Hormone levels and thyroid tests', true),
    ('33333333-3333-3333-3333-333333333333', 'Radiology / Imaging', 'X-rays, Ultrasounds, and MRI', true),
    ('44444444-4444-4444-4444-444444444444', 'Microbiology', 'Culture and sensitivity tests', true)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Step 2: Clear old lab tests just in case to prevent duplicates
DELETE FROM public.lab_tests;

-- Step 3: Insert realistic hospital lab tests with strict CamelCase sample_type matching the check constraint
INSERT INTO public.lab_tests (id, category_id, name, code, price, sample_type, turnaround_hours, is_active)
VALUES
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Complete Blood Count (CBC)', 'CBC-01', 800.00, 'Blood', 6, true),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Liver Function Test (LFT)', 'LFT-01', 1200.00, 'Blood', 12, true),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Renal Function Test (RFT)', 'RFT-01', 1500.00, 'Blood', 12, true),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Lipid Profile', 'LIP-01', 1800.00, 'Blood', 12, true),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Fasting Blood Sugar (FBS)', 'FBS-01', 300.00, 'Blood', 4, true),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'HbA1c', 'HBA-01', 1200.00, 'Blood', 8, true),
    
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Thyroid Profile (T3, T4, TSH)', 'THY-01', 2500.00, 'Blood', 24, true),
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Serum Testosterone', 'TST-01', 2000.00, 'Blood', 24, true),
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Semen Analysis', 'SEM-01', 1000.00, 'Semen', 24, true),
    
    (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'Urine Routine Examination', 'URI-01', 400.00, 'Urine', 4, true),
    (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'Stool Routine Examination', 'STL-01', 400.00, 'Stool', 4, true),
    (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'COVID-19 PCR', 'COV-01', 4500.00, 'Swab', 24, true);

-- Step 4: Safely recreate the patient_test_history_view so it has ALL columns including p.phone (instead of p.email)
DROP VIEW IF EXISTS public.patient_test_history_view;
CREATE VIEW public.patient_test_history_view AS
SELECT 
    pt.id,
    pt.patient_id,
    p.full_name AS patient_name,
    p.phone AS patient_email, 
    pt.test_id,
    lt.name AS test_name,
    lt.code AS test_code,
    lt.sample_type,
    pt.booking_date,
    pt.status,
    pt.result_value,
    pt.result_unit,
    pt.normal_range,
    pt.remarks,
    pt.notes,
    pt.performed_by,
    pt.performed_at,
    pt.created_at,
    pt.updated_at
FROM 
    public.patient_tests pt
JOIN 
    public.profiles p ON pt.patient_id = p.id
JOIN 
    public.lab_tests lt ON pt.test_id = lt.id;
