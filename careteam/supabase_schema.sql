-- ====================================================================
-- CURALINK — Complete Care Team Portal PostgreSQL Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- Supports Care Team user registration, patients, and triage escalation.
-- ====================================================================

-- 1. Care Team Users / Fieldworkers Table
CREATE TABLE IF NOT EXISTS care_team_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crt_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  pin VARCHAR(6) NOT NULL,
  role TEXT DEFAULT 'Care Team Fieldworker',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_care_team_crt_id ON care_team_users(crt_id);
CREATE INDEX IF NOT EXISTS idx_care_team_phone ON care_team_users(phone);
CREATE INDEX IF NOT EXISTS idx_care_team_email ON care_team_users(email);

-- 2. Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uhid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  phone TEXT NOT NULL,
  literacy BOOLEAN NOT NULL DEFAULT true,
  address TEXT NOT NULL,
  gender TEXT DEFAULT 'Unspecified',
  language TEXT DEFAULT 'Kannada',
  pin VARCHAR(6) DEFAULT '123456',
  guardian_name TEXT,
  guardian_age INTEGER,
  guardian_phone TEXT,
  guardian_literacy BOOLEAN DEFAULT true,
  guardian_address TEXT,
  guardian_relationship TEXT,
  otp_verified BOOLEAN DEFAULT true,
  registered_by TEXT DEFAULT 'Care Team Fieldworker',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_uhid ON patients(uhid);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at DESC);

-- 3. Optional Normalized Guardians Table
CREATE TABLE IF NOT EXISTS guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  phone TEXT NOT NULL,
  literacy BOOLEAN NOT NULL DEFAULT true,
  address TEXT NOT NULL,
  relationship TEXT DEFAULT 'Guardian',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guardians_patient_id ON guardians(patient_id);

-- 4. Escalations / Field Triage Table
CREATE TABLE IF NOT EXISTS escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  category TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('ROUTINE', 'URGENT', 'CRITICAL')),
  target TEXT NOT NULL,
  notes TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACKNOWLEDGED', 'RESOLVED')),
  escalated_by TEXT DEFAULT 'Care Team Coordinator',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);
CREATE INDEX IF NOT EXISTS idx_escalations_created_at ON escalations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_escalations_priority ON escalations(priority);

-- 5. Row Level Security Policies (Read, Insert, Update)
ALTER TABLE care_team_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all care_team_users" ON care_team_users;
CREATE POLICY "Allow anon all care_team_users" ON care_team_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all patients" ON patients;
CREATE POLICY "Allow anon all patients" ON patients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all guardians" ON guardians;
CREATE POLICY "Allow anon all guardians" ON guardians FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all escalations" ON escalations;
CREATE POLICY "Allow anon all escalations" ON escalations FOR ALL USING (true) WITH CHECK (true);

-- 6. Pre-seed Default Care Team User
INSERT INTO care_team_users (crt_id, name, age, phone, email, pin, role)
VALUES 
  ('CRT10001', 'Meenakshi Gowda', 32, '9845100001', 'meenakshi@curalink.health', '123456', 'Lead ASHA Field Coordinator')
ON CONFLICT (crt_id) DO NOTHING;

-- 7. Pre-seed Default Field Patients
INSERT INTO patients (uhid, name, age, phone, literacy, address, gender, language, pin, guardian_name, guardian_age, guardian_phone, guardian_literacy, guardian_address, guardian_relationship)
VALUES 
  ('PAT10001', 'Ramesh Gowda', 58, '98451 23456', false, 'Near Maramma Temple, Ramanagara District, Karnataka', 'Male', 'Kannada', '123456', 'Suresh Gowda', 32, '98451 23457', true, 'Same as patient address', 'Son'),
  ('PAT10002', 'Kamalamma Devi', 64, '98450 87654', false, 'House #42, Doddaballapura Rural, Karnataka', 'Female', 'Kannada', '123456', 'Anitha Devi', 38, '98450 87655', true, 'House #42, Doddaballapura Rural, Karnataka', 'Daughter'),
  ('PAT10003', 'Mohammed Rafiq', 52, '97412 34567', true, 'Tipu Nagar, Shivamogga, Karnataka', 'Male', 'English', '123456', null, null, null, null, null, null)
ON CONFLICT (uhid) DO NOTHING;

-- 8. Pre-seed Initial Escalations
INSERT INTO escalations (patient_id, patient_name, patient_phone, category, priority, target, notes, status, escalated_by)
VALUES
  ('PAT10001', 'Ramesh Gowda', '98451 23456', 'ABNORMAL_VITALS', 'CRITICAL', 'Dr. Shivakumar (PHC Chief)', 'Severe systolic spike (185/110 mmHg) recorded during field visit. Blurred vision reported.', 'PENDING', 'Meenakshi (ASHA Lead)'),
  ('PAT10002', 'Kamalamma Devi', '98450 87654', 'MISSED_MEDICATION', 'URGENT', 'Care Coordinator', 'Ran out of Metformin 500mg 3 days ago. Unable to reach taluk pharmacy due to knee pain.', 'ACKNOWLEDGED', 'Basavaraj (Field Coordinator)')
ON CONFLICT DO NOTHING;
