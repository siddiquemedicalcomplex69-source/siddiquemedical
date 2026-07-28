-- ============================================================
-- HOSPITAL APPOINTMENT SYSTEM — SUPABASE SCHEMA
-- Run this entire file in your Supabase SQL editor
-- ============================================================

-- ── EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── CLEAN SLATE (safe re-run) ───────────────────────────────
DROP TABLE IF EXISTS notifications     CASCADE;
DROP TABLE IF EXISTS appointments      CASCADE;
DROP TABLE IF EXISTS availability      CASCADE;
DROP TABLE IF EXISTS doctors           CASCADE;
DROP TABLE IF EXISTS departments       CASCADE;
DROP TABLE IF EXISTS profiles          CASCADE;

DROP TYPE IF EXISTS user_role          CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS day_of_week        CASCADE;
DROP TYPE IF EXISTS notification_type  CASCADE;

-- ── ENUMS ───────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'admin');

CREATE TYPE appointment_status AS ENUM (
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE day_of_week AS ENUM (
  'monday', 'tuesday', 'wednesday',
  'thursday', 'friday', 'saturday', 'sunday'
);

CREATE TYPE notification_type AS ENUM (
  'appointment_booked',
  'appointment_confirmed',
  'appointment_cancelled',
  'appointment_reminder',
  'general'
);

-- ============================================================
-- TABLE 1: PROFILES
-- Extends Supabase auth.users — one row per user
-- ============================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          user_role        NOT NULL DEFAULT 'patient',
  full_name     TEXT             NOT NULL,
  phone         TEXT,
  avatar_url    TEXT,
  date_of_birth DATE,
  gender        TEXT CHECK (gender IN ('male', 'female', 'other')),
  address       TEXT,
  created_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- ── TRIGGER: auto-create profile on signup ──────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'patient')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── TRIGGER: keep updated_at current ────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLE 2: DEPARTMENTS
-- ============================================================
CREATE TABLE departments (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL UNIQUE,
  description TEXT,
  icon        TEXT,                          -- emoji or icon name
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SEED: common hospital departments ───────────────────────
INSERT INTO departments (name, description, icon) VALUES
  ('General Medicine',    'Primary care and general health consultations',      '🏥'),
  ('Cardiology',          'Heart and cardiovascular system',                    '❤️'),
  ('Orthopedics',         'Bones, joints, and musculoskeletal system',          '🦴'),
  ('Pediatrics',          'Healthcare for infants, children, and adolescents',  '👶'),
  ('Dermatology',         'Skin, hair, and nail conditions',                    '🩺'),
  ('Gynecology',          'Female reproductive health',                         '🌸'),
  ('ENT',                 'Ear, nose, and throat',                              '👂'),
  ('Ophthalmology',       'Eye care and vision',                                '👁️'),
  ('Neurology',           'Brain and nervous system',                           '🧠'),
  ('Psychiatry',          'Mental health and behavioural disorders',            '💙');

-- ============================================================
-- TABLE 3: DOCTORS
-- One row per doctor — linked to their profile
-- ============================================================
CREATE TABLE doctors (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID        NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  department_id   UUID        NOT NULL REFERENCES departments(id),
  specialty       TEXT        NOT NULL,
  qualification   TEXT        NOT NULL,      -- e.g. "MBBS, FCPS"
  experience_yrs  INT         NOT NULL DEFAULT 0 CHECK (experience_yrs >= 0),
  bio             TEXT,
  consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (consultation_fee >= 0),
  slot_duration_min INT       NOT NULL DEFAULT 30 CHECK (slot_duration_min IN (15,20,30,45,60)),
  languages       TEXT[]      NOT NULL DEFAULT '{English}',
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_doctors_department ON doctors(department_id);
CREATE INDEX idx_doctors_active     ON doctors(is_active);

-- ============================================================
-- TABLE 4: AVAILABILITY
-- Weekly recurring schedule per doctor
-- One row = one time block on one day of the week
-- ============================================================
CREATE TABLE availability (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id   UUID        NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day         day_of_week NOT NULL,
  start_time  TIME        NOT NULL,
  end_time    TIME        NOT NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT unique_doctor_day_slot UNIQUE (doctor_id, day, start_time)
);

CREATE INDEX idx_availability_doctor ON availability(doctor_id);


-- ============================================================
-- TABLE 6: APPOINTMENTS
-- Core booking record
-- ============================================================
CREATE TABLE appointments (
  id              UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID               NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id       UUID               NOT NULL REFERENCES doctors(id)  ON DELETE CASCADE,
  appointment_date DATE              NOT NULL,
  start_time      TIME               NOT NULL,
  end_time        TIME               NOT NULL,
  status          appointment_status NOT NULL DEFAULT 'pending',
  reason          TEXT,                             -- patient's reason for visit
  notes           TEXT,                             -- doctor's consultation notes
  fee_charged     NUMERIC(10,2),
  created_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

  -- Prevent double-booking: same doctor, same date, same start time
  CONSTRAINT no_double_booking UNIQUE (doctor_id, appointment_date, start_time),

  CONSTRAINT valid_appointment_time CHECK (end_time > start_time),

  -- Can't book in the past (enforced at app level too, but belt-and-suspenders)
  CONSTRAINT future_appointment CHECK (
    appointment_date >= CURRENT_DATE
    OR status IN ('completed', 'cancelled', 'no_show')
  )
);

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_appointments_patient      ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor       ON appointments(doctor_id);
CREATE INDEX idx_appointments_date         ON appointments(appointment_date);
CREATE INDEX idx_appointments_doctor_date  ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_appointments_status       ON appointments(status);

-- ============================================================
-- TABLE 7: NOTIFICATIONS
-- In-app notification log
-- ============================================================
CREATE TABLE notifications (
  id          UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID              NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        notification_type NOT NULL DEFAULT 'general',
  title       TEXT              NOT NULL,
  message     TEXT              NOT NULL,
  is_read     BOOLEAN           NOT NULL DEFAULT FALSE,
  metadata    JSONB,                        -- e.g. { appointment_id: "..." }
  created_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user    ON notifications(user_id);
CREATE INDEX idx_notifications_unread  ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on every table
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors       ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability  ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ── Helper: get current user's role ─────────────────────────
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Helper: get doctor id for current user ──────────────────
CREATE OR REPLACE FUNCTION get_my_doctor_id()
RETURNS UUID AS $$
  SELECT id FROM doctors WHERE profile_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ────────────────────────────────────────────────────────────
-- PROFILES policies
-- ────────────────────────────────────────────────────────────
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Doctors can view patient profiles for their appointments"
  ON profiles FOR SELECT
  USING (
    get_my_role() = 'doctor'
    AND EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.patient_id = profiles.id
        AND a.doctor_id = get_my_doctor_id()
    )
  );

CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  USING (get_my_role() = 'admin');

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can update any profile"
  ON profiles FOR UPDATE
  USING (get_my_role() = 'admin');

-- ────────────────────────────────────────────────────────────
-- DEPARTMENTS policies
-- ────────────────────────────────────────────────────────────
-- Anyone (even logged out) can view active departments
CREATE POLICY "Anyone can view active departments"
  ON departments FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admin can manage departments"
  ON departments FOR ALL
  USING (get_my_role() = 'admin');

-- ────────────────────────────────────────────────────────────
-- DOCTORS policies
-- ────────────────────────────────────────────────────────────
CREATE POLICY "Anyone can view active doctors"
  ON doctors FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Doctors can update their own record"
  ON doctors FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Admin can manage all doctors"
  ON doctors FOR ALL
  USING (get_my_role() = 'admin');

-- ────────────────────────────────────────────────────────────
-- AVAILABILITY policies
-- ────────────────────────────────────────────────────────────
CREATE POLICY "Anyone can view active availability"
  ON availability FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Doctors can manage their own availability"
  ON availability FOR ALL
  USING (
    doctor_id = get_my_doctor_id()
  );

CREATE POLICY "Admin can manage all availability"
  ON availability FOR ALL
  USING (get_my_role() = 'admin');


-- ────────────────────────────────────────────────────────────
-- APPOINTMENTS policies
-- ────────────────────────────────────────────────────────────
CREATE POLICY "Patients can view their own appointments"
  ON appointments FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Patients can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    patient_id = auth.uid()
    AND get_my_role() = 'patient'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_active = TRUE)
  );

CREATE POLICY "Patients can cancel their own pending appointments"
  ON appointments FOR UPDATE
  USING (
    patient_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    patient_id = auth.uid()
    AND status = 'cancelled'
  );

CREATE POLICY "Doctors can view their own schedule"
  ON appointments FOR SELECT
  USING (
    doctor_id = get_my_doctor_id()
  );

CREATE POLICY "Doctors can update their appointments"
  ON appointments FOR UPDATE
  USING (
    doctor_id = get_my_doctor_id()
  );

CREATE POLICY "Admin can manage all appointments"
  ON appointments FOR ALL
  USING (get_my_role() = 'admin');

-- ────────────────────────────────────────────────────────────
-- NOTIFICATIONS policies
-- ────────────────────────────────────────────────────────────
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can mark their own notifications as read"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admin can manage all notifications"
  ON notifications FOR ALL
  USING (get_my_role() = 'admin');

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- Full doctor card (joins profile + department)
CREATE OR REPLACE VIEW doctor_cards AS
SELECT
  d.id                  AS doctor_id,
  p.full_name,
  p.avatar_url,
  d.specialty,
  d.qualification,
  d.experience_yrs,
  d.bio,
  d.consultation_fee,
  d.slot_duration_min,
  d.languages,
  dep.id                AS department_id,
  dep.name              AS department_name,
  dep.icon              AS department_icon
FROM doctors d
JOIN profiles    p   ON p.id  = d.profile_id
JOIN departments dep ON dep.id = d.department_id
WHERE d.is_active = TRUE AND p.id IS NOT NULL;

-- Appointment list with patient and doctor names
CREATE OR REPLACE VIEW appointment_details AS
SELECT
  a.id,
  a.appointment_date,
  a.start_time,
  a.end_time,
  a.status,
  a.reason,
  a.notes,
  a.fee_charged,
  a.created_at,
  pat.full_name         AS patient_name,
  pat.phone             AS patient_phone,
  a.patient_id,
  doc_p.full_name       AS doctor_name,
  d.specialty           AS doctor_specialty,
  d.id                  AS doctor_id,
  dep.name              AS department_name
FROM appointments a
JOIN profiles    pat   ON pat.id   = a.patient_id
JOIN doctors     d     ON d.id     = a.doctor_id
JOIN profiles    doc_p ON doc_p.id = d.profile_id
JOIN departments dep   ON dep.id   = d.department_id;

-- ============================================================
-- GRANT ANON / AUTHENTICATED ACCESS
-- ============================================================
GRANT USAGE  ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON departments TO anon;
GRANT SELECT ON doctors     TO anon;
GRANT SELECT ON availability TO anon;
GRANT SELECT ON doctor_cards TO anon, authenticated;
GRANT SELECT ON appointment_details TO authenticated;
GRANT ALL    ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL    ON ALL SEQUENCES IN SCHEMA public TO authenticated;
