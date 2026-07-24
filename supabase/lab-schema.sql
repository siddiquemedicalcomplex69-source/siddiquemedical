-- ============================================================
-- LAB TESTS MODULE — SCHEMA ADDITION
-- Run this in Supabase SQL Editor
-- Requires the main schema.sql to already be applied
-- ============================================================

-- ── ADD LAB_STAFF TO EXISTING ROLE ENUM ─────────────────────
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'lab_staff';

-- ── LAB BOOKING STATUS ENUM ─────────────────────────────────
DO $$ BEGIN
  CREATE TYPE lab_booking_status AS ENUM (
    'pending',
    'sample_date_set',
    'report_date_set',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── TABLE: LAB TEST CATEGORIES ───────────────────────────────
CREATE TABLE IF NOT EXISTS lab_test_categories (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL UNIQUE,
  icon       TEXT,
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SEED: default categories ─────────────────────────────────
INSERT INTO lab_test_categories (name, icon) VALUES
  ('Blood Tests',     '🩸'),
  ('Urine Tests',     '🧪'),
  ('Hormones',        '⚗️'),
  ('Hepatitis Panel', '🔬'),
  ('Diabetes',        '📊'),
  ('Lipid Profile',   '❤️'),
  ('Thyroid',         '🦋'),
  ('Liver Function',  '🫁')
ON CONFLICT (name) DO NOTHING;

-- ── TABLE: LAB TESTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lab_tests (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id       UUID        NOT NULL REFERENCES lab_test_categories(id),
  name              TEXT        NOT NULL,
  code              TEXT        NOT NULL UNIQUE,
  price             NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  sample_type       TEXT        NOT NULL CHECK (sample_type IN ('Blood', 'Urine', 'Stool', 'Swab')),
  turnaround_hours  INT         NOT NULL DEFAULT 24,
  description       TEXT,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER lab_tests_updated_at
  BEFORE UPDATE ON lab_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_lab_tests_category  ON lab_tests(category_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_active     ON lab_tests(is_active);

-- ── SEED: default tests ───────────────────────────────────────
INSERT INTO lab_tests (category_id, name, code, price, sample_type, turnaround_hours, description)
SELECT c.id, t.name, t.code, t.price, t.sample_type, t.turnaround_hours, t.description
FROM (VALUES
  ('Blood Tests',     'Complete Blood Count (CBC)',      'CBC-001',  900,   'Blood', 24, 'Full blood analysis including RBC, WBC, platelets'),
  ('Blood Tests',     'Blood Group & Rh Factor',         'BG-002',   1200,  'Blood', 12, 'Determines ABO blood group and Rh factor'),
  ('Blood Tests',     'ESR',                             'ESR-003',  600,   'Blood', 24, 'Measures inflammation in the body'),
  ('Urine Tests',     'Urine Complete Examination',      'UCE-004',  650,   'Urine', 12, 'Full urine analysis for infections and kidney function'),
  ('Thyroid',         'Thyroid Function Test (TSH)',      'TSH-005',  2000,  'Blood', 48, 'Measures thyroid stimulating hormone levels'),
  ('Thyroid',         'Free T3 & T4',                    'FT3-006',  3000,  'Blood', 48, 'Active thyroid hormone levels'),
  ('Hepatitis Panel', 'Hepatitis B Surface Antigen',     'HBS-007',  2150,  'Blood', 24, 'Screens for Hepatitis B infection'),
  ('Hepatitis Panel', 'Hepatitis C Antibody (Anti-HCV)', 'HCV-008',  3000,  'Blood', 24, 'Screens for Hepatitis C infection'),
  ('Diabetes',        'Fasting Blood Sugar (FBS)',        'FBS-009',  600,   'Blood', 12, 'Measures blood glucose after fasting'),
  ('Diabetes',        'HbA1c (Glycated Haemoglobin)',    'HBA-010',  2400,  'Blood', 48, 'Average blood sugar over the past 3 months'),
  ('Lipid Profile',   'Lipid Profile',                   'LIP-011',  2700,  'Blood', 24, 'Cholesterol, HDL, LDL, triglycerides'),
  ('Liver Function',  'Liver Function Test (LFTs)',       'LFT-012',  2200,  'Blood', 24, 'Complete liver enzyme and function panel')
) AS t(cat_name, name, code, price, sample_type, turnaround_hours, description)
JOIN lab_test_categories c ON c.name = t.cat_name
ON CONFLICT (code) DO NOTHING;

-- ── TABLE: LAB TEST PACKAGES ─────────────────────────────────
CREATE TABLE IF NOT EXISTS lab_test_packages (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL UNIQUE,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER lab_packages_updated_at
  BEFORE UPDATE ON lab_test_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── TABLE: LAB TEST PACKAGE ITEMS ────────────────────────────
CREATE TABLE IF NOT EXISTS lab_test_package_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id  UUID NOT NULL REFERENCES lab_test_packages(id) ON DELETE CASCADE,
  test_id     UUID NOT NULL REFERENCES lab_tests(id) ON DELETE CASCADE,
  UNIQUE (package_id, test_id)
);

-- ── SEED: default packages ────────────────────────────────────
DO $$
DECLARE
  pkg_id UUID;
BEGIN
  INSERT INTO lab_test_packages (name, description, price)
  VALUES ('Basic Health Profile', 'CBC, Blood Sugar, Urine C/E', 4400)
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO pkg_id;

  IF pkg_id IS NOT NULL THEN
    INSERT INTO lab_test_package_items (package_id, test_id)
    SELECT pkg_id, id FROM lab_tests WHERE code IN ('CBC-001','FBS-009','UCE-004');
  END IF;
END $$;

-- ── TABLE: LAB BOOKINGS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS lab_bookings (
  id                     UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id             UUID                NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  test_id                UUID                REFERENCES lab_tests(id),
  package_id             UUID                REFERENCES lab_test_packages(id),
  booking_date           DATE                NOT NULL DEFAULT CURRENT_DATE,
  preferred_date         DATE,
  status                 lab_booking_status  NOT NULL DEFAULT 'pending',
  sample_collection_date DATE,
  report_collection_date DATE,
  notes                  TEXT,
  created_at             TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

  -- Must book either a test or a package, not neither
  CONSTRAINT test_or_package CHECK (
    (test_id IS NOT NULL AND package_id IS NULL) OR
    (test_id IS NULL AND package_id IS NOT NULL)
  )
);

CREATE TRIGGER lab_bookings_updated_at
  BEFORE UPDATE ON lab_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_lab_bookings_patient ON lab_bookings(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_bookings_status  ON lab_bookings(status);
CREATE INDEX IF NOT EXISTS idx_lab_bookings_date    ON lab_bookings(booking_date);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE lab_test_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests              ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_test_packages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_test_package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_bookings           ENABLE ROW LEVEL SECURITY;

-- ── lab_test_categories ───────────────────────────────────────
CREATE POLICY "Anyone can view active categories"
  ON lab_test_categories FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admin can manage categories"
  ON lab_test_categories FOR ALL
  USING (get_my_role() = 'admin');

-- ── lab_tests ─────────────────────────────────────────────────
CREATE POLICY "Anyone can view active tests"
  ON lab_tests FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admin can manage tests"
  ON lab_tests FOR ALL
  USING (get_my_role() = 'admin');

-- ── lab_test_packages ─────────────────────────────────────────
CREATE POLICY "Anyone can view active packages"
  ON lab_test_packages FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admin can manage packages"
  ON lab_test_packages FOR ALL
  USING (get_my_role() = 'admin');

-- ── lab_test_package_items ────────────────────────────────────
CREATE POLICY "Anyone can view package items"
  ON lab_test_package_items FOR SELECT
  USING (TRUE);

CREATE POLICY "Admin can manage package items"
  ON lab_test_package_items FOR ALL
  USING (get_my_role() = 'admin');

-- ── lab_bookings ──────────────────────────────────────────────
CREATE POLICY "Patients can view their own lab bookings"
  ON lab_bookings FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Patients can create lab bookings"
  ON lab_bookings FOR INSERT
  WITH CHECK (
    patient_id = auth.uid()
    AND get_my_role() = 'patient'
  );

CREATE POLICY "Patients can cancel their own pending bookings"
  ON lab_bookings FOR UPDATE
  USING (
    patient_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    patient_id = auth.uid()
    AND status = 'cancelled'
  );

CREATE POLICY "Lab staff can view all bookings"
  ON lab_bookings FOR SELECT
  USING (get_my_role() = 'lab_staff');

CREATE POLICY "Lab staff can update bookings"
  ON lab_bookings FOR UPDATE
  USING (get_my_role() = 'lab_staff');

CREATE POLICY "Admin can manage all lab bookings"
  ON lab_bookings FOR ALL
  USING (get_my_role() = 'admin');

-- ============================================================
-- USEFUL VIEW
-- ============================================================

CREATE OR REPLACE VIEW lab_booking_details AS
SELECT
  lb.id,
  lb.booking_date,
  lb.preferred_date,
  lb.status,
  lb.sample_collection_date,
  lb.report_collection_date,
  lb.notes,
  lb.created_at,
  p.full_name         AS patient_name,
  p.phone             AS patient_phone,
  lb.patient_id,
  COALESCE(lt.name, ltp.name)   AS test_name,
  COALESCE(lt.code, 'PKG')      AS test_code,
  COALESCE(lt.price, ltp.price) AS price,
  lt.sample_type,
  lt.turnaround_hours,
  CASE WHEN lb.package_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_package
FROM lab_bookings lb
JOIN profiles p            ON p.id   = lb.patient_id
LEFT JOIN lab_tests lt     ON lt.id  = lb.test_id
LEFT JOIN lab_test_packages ltp ON ltp.id = lb.package_id;

-- Grant access
GRANT SELECT ON lab_test_categories    TO anon, authenticated;
GRANT SELECT ON lab_tests              TO anon, authenticated;
GRANT SELECT ON lab_test_packages      TO anon, authenticated;
GRANT SELECT ON lab_test_package_items TO anon, authenticated;
GRANT ALL    ON lab_bookings           TO authenticated;
GRANT SELECT ON lab_booking_details    TO authenticated;
