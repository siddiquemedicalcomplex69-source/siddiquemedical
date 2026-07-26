-- ============================================================
-- SIDDIQUE MEDICAL COMPLEX — DATABASE OPTIMIZATIONS
-- Run this securely in your Supabase SQL Editor
-- ============================================================

-- 1. Enable Trigram Extension for lightning-fast text searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create GIN Indexes on frequently searched text columns (ILIKE queries)
-- This makes searching for doctors by name practically instantaneous
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm 
  ON public.profiles USING gin (full_name gin_trgm_ops);

-- This makes searching for lab tests instantaneous
CREATE INDEX IF NOT EXISTS idx_lab_tests_name_trgm 
  ON public.lab_tests USING gin (name gin_trgm_ops);

-- This makes searching for departments instantaneous
CREATE INDEX IF NOT EXISTS idx_departments_name_trgm 
  ON public.departments USING gin (name gin_trgm_ops);


-- 3. Create B-Tree Indexes on Foreign Keys for the new Lab System
-- This speeds up the My Tests page for patients
CREATE INDEX IF NOT EXISTS idx_lab_bookings_patient 
  ON public.lab_bookings(patient_id);

-- This speeds up the Admin/Lab Portal filtering
CREATE INDEX IF NOT EXISTS idx_lab_bookings_status 
  ON public.lab_bookings(status);

CREATE INDEX IF NOT EXISTS idx_lab_bookings_test 
  ON public.lab_bookings(test_id);

-- 4. Optimize Appointments for the Doctor's Schedule
-- Composite index for filtering by doctor and date (used heavily in the Schedule view)
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date_status 
  ON public.appointments(doctor_id, appointment_date, status);
