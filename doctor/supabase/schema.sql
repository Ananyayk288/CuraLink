-- ============================================================
-- CURALINK: Supabase Complete PostgreSQL Master Production Schema
-- Designed for CURALINK Healthcare Ecosystem (Doctor Portal & Shared Services)
-- Includes:
--   1. Doctors Table (DOCxxxxx identifiers & PIN auth)
--   2. Care Team Users Table (CRTxxxxx fieldworker auth)
--   3. Patients Table (Unified schema with literacy & guardians)
--   4. Guardians Table (Relational caregiver registry)
--   5. Appointments Table (Pending clinical queues & tokens)
--   6. Prescriptions Table (Legally sealed clinical records)
--   7. Prescription Medicines Table (Regimens, dosage, color stickers)
--   8. Prescription Diagnostics Table (Scans & Lab tests with urgency)
--   9. Telephony Triggers Table (Outbound IVR & SMS automated dispatch)
--  10. Field Escalations Table (ASHA triage to Doctor desk)
--  11. PostgreSQL Prescription Immutability Triggers
--  12. Row Level Security (RLS) Permissive Anonymous Sync Policies
--  13. Rich Demo Seed Data for immediate testing & evaluation
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- 1. DOCTORS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(50) PRIMARY KEY, -- e.g. DOC84920, DOC23723
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    age INT NOT NULL CHECK (age >= 18 AND age <= 120),
    pin VARCHAR(20) NOT NULL, -- 6-digit security PIN
    is_verified BOOLEAN DEFAULT TRUE,
    department VARCHAR(100) DEFAULT 'General Medicine & Chronic Care',
    license VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 2. CARE TEAM USERS TABLE (Fieldworkers & ASHA Coordinators)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS care_team_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crt_id TEXT UNIQUE NOT NULL, -- e.g. CRT10001
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    pin VARCHAR(6) NOT NULL,
    role TEXT DEFAULT 'Care Team Fieldworker',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 3. PATIENTS TABLE (Unified Schema)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('pt-' || substr(md5(random()::text), 1, 8)),
    uhid VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL DEFAULT 'Unspecified',
    phone VARCHAR(50) NOT NULL,
    language VARCHAR(50) NOT NULL DEFAULT 'KANNADA',
    device_type VARCHAR(50) NOT NULL DEFAULT 'FEATURE_PHONE',
    chronic_conditions TEXT[] DEFAULT '{}',
    literacy BOOLEAN NOT NULL DEFAULT TRUE,
    address TEXT DEFAULT 'Karnataka, India',
    pin VARCHAR(20) DEFAULT '123456',
    guardian_name VARCHAR(150),
    guardian_age INT,
    guardian_phone VARCHAR(50),
    guardian_consent BOOLEAN DEFAULT FALSE,
    guardian_literacy BOOLEAN DEFAULT TRUE,
    guardian_address TEXT,
    guardian_relationship VARCHAR(100),
    otp_verified BOOLEAN DEFAULT TRUE,
    registered_by VARCHAR(100) DEFAULT 'Care Team Fieldworker',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 4. GUARDIANS TABLE (Relational Caregiver Registry)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id VARCHAR(50) REFERENCES patients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    phone TEXT NOT NULL,
    literacy BOOLEAN NOT NULL DEFAULT TRUE,
    address TEXT NOT NULL,
    relationship TEXT DEFAULT 'Guardian',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 5. APPOINTMENTS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(50) PRIMARY KEY, -- e.g. apt-001
    patient_id VARCHAR(50) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id VARCHAR(50) REFERENCES doctors(id) ON DELETE SET NULL,
    token_number VARCHAR(50),
    reason_for_visit TEXT,
    appointment_time VARCHAR(100) NOT NULL,
    booking_channel VARCHAR(50) NOT NULL DEFAULT 'CLINIC_DESK',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 6. PRESCRIPTIONS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prescriptions (
    id VARCHAR(50) PRIMARY KEY, -- e.g. rx-ramesh-v1
    patient_id VARCHAR(50) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id VARCHAR(50) REFERENCES doctors(id) ON DELETE SET NULL,
    doctor_name VARCHAR(150) NOT NULL,
    prescription_type VARCHAR(50) NOT NULL DEFAULT 'NORMAL' CHECK (prescription_type IN ('NORMAL', 'SCAN_TEST')),
    symptoms_notes TEXT,
    follow_up_date VARCHAR(50),
    follow_up_notes TEXT,
    telephony_trigger_enabled BOOLEAN DEFAULT TRUE,
    telephony_triggered_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'COMMITTED' CHECK (status IN ('DRAFT', 'COMMITTED', 'SUPERSEDED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 7. PRESCRIPTION MEDICINES TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prescription_medicines (
    id VARCHAR(100) PRIMARY KEY,
    prescription_id VARCHAR(50) NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(50) NOT NULL, -- e.g. '1-0-1', '1-0-0', '0-0-1', 'SOS'
    no_of_days INT NOT NULL DEFAULT 15,
    meal_relation VARCHAR(50) NOT NULL DEFAULT 'After Food',
    instructions TEXT,
    dispense_status VARCHAR(50) NOT NULL DEFAULT 'PRESCRIBED' CHECK (dispense_status IN ('PRESCRIBED', 'DISPENSED', 'SUBSTITUTED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 8. PRESCRIPTION DIAGNOSTICS (SCANS / LAB TESTS) TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prescription_diagnostics (
    id VARCHAR(100) PRIMARY KEY,
    prescription_id VARCHAR(50) NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    test_type VARCHAR(50) NOT NULL CHECK (test_type IN ('SCAN', 'LAB_TEST')),
    test_name VARCHAR(200) NOT NULL,
    instructions TEXT,
    urgency VARCHAR(50) NOT NULL DEFAULT 'ROUTINE' CHECK (urgency IN ('ROUTINE', 'URGENT', 'STAT')),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 9. TELEPHONY TRIGGERS TABLE (AI Voice & SMS Outbound Queue)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS telephony_triggers (
    id VARCHAR(100) PRIMARY KEY,
    prescription_id VARCHAR(50) NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    patient_id VARCHAR(50) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    patient_phone VARCHAR(50),
    preferred_language VARCHAR(50),
    trigger_type VARCHAR(100) NOT NULL, -- 'MEDICATION_ADHERENCE', 'DIAGNOSTIC_ALERT'
    voice_call_status VARCHAR(50) NOT NULL DEFAULT 'QUEUED', -- 'QUEUED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'
    sms_status VARCHAR(50) NOT NULL DEFAULT 'QUEUED',
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 10. FIELD ESCALATIONS TABLE (Care Team to Doctor Desk)
-- ------------------------------------------------------------
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
    doctor_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 11. DATABASE PRESCRIPTION IMMUTABILITY TRIGGER (PostgreSQL Engine Level)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_prescription_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'COMMITTED' THEN
        RAISE EXCEPTION 'DATABASE RESTRICTION: Committed prescription % is legally sealed and immutable. Create a new revision instead.', OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prescription_immutable ON prescriptions;
CREATE TRIGGER trg_prescription_immutable
BEFORE UPDATE OR DELETE ON prescriptions
FOR EACH ROW
EXECUTE FUNCTION enforce_prescription_immutability();

-- ------------------------------------------------------------
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);
CREATE INDEX IF NOT EXISTS idx_doctors_phone ON doctors(phone);
CREATE INDEX IF NOT EXISTS idx_care_team_crt ON care_team_users(crt_id);
CREATE INDEX IF NOT EXISTS idx_patients_uhid ON patients(uhid);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medicines_prescription ON prescription_medicines(prescription_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_prescription ON prescription_diagnostics(prescription_id);
CREATE INDEX IF NOT EXISTS idx_telephony_prescription ON telephony_triggers(prescription_id);
CREATE INDEX IF NOT EXISTS idx_telephony_status ON telephony_triggers(voice_call_status);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);
CREATE INDEX IF NOT EXISTS idx_escalations_priority ON escalations(priority);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Permissive policies for frontend clinical synchronization
-- ------------------------------------------------------------
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_team_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE telephony_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;

-- Anonymous Access Policies
DROP POLICY IF EXISTS "Anon allow all on doctors" ON doctors;
CREATE POLICY "Anon allow all on doctors" ON doctors FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon allow all on care_team_users" ON care_team_users;
CREATE POLICY "Anon allow all on care_team_users" ON care_team_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon allow all on patients" ON patients;
CREATE POLICY "Anon allow all on patients" ON patients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon allow all on guardians" ON guardians;
CREATE POLICY "Anon allow all on guardians" ON guardians FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon allow all on appointments" ON appointments;
CREATE POLICY "Anon allow all on appointments" ON appointments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon allow all on prescriptions" ON prescriptions;
CREATE POLICY "Anon allow all on prescriptions" ON prescriptions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon allow all on prescription_medicines" ON prescription_medicines;
CREATE POLICY "Anon allow all on prescription_medicines" ON prescription_medicines FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon allow all on prescription_diagnostics" ON prescription_diagnostics;
CREATE POLICY "Anon allow all on prescription_diagnostics" ON prescription_diagnostics FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon allow all on telephony_triggers" ON telephony_triggers;
CREATE POLICY "Anon allow all on telephony_triggers" ON telephony_triggers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon allow all on escalations" ON escalations;
CREATE POLICY "Anon allow all on escalations" ON escalations FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- SEED DATA INSERTION
-- Populates demo clinical practitioners, fieldworkers, patients,
-- pending appointment queue, and past prescriptions.
-- ============================================================

-- 1. Demo Doctors
INSERT INTO doctors (id, name, phone, email, age, pin, is_verified, department, license)
VALUES
    ('DOC84920', 'Dr. Suresh Sharma, MD', '+91 98450 11223', 'dr.suresh@curalink.health', 48, '123456', true, 'Internal Medicine & Chronic Care', 'KMC-84920/MD'),
    ('DOC74921', 'Dr. K. R. Nambiar, MS (Orthopedics)', '+91 98450 44556', 'dr.nambiar@curalink.health', 52, '123456', true, 'Orthopedics & Joint Care', 'KMC-74921/MS'),
    ('DOC61034', 'Dr. Anita Sen, MD (Nephrology)', '+91 98450 77889', 'dr.anita@curalink.health', 44, '123456', true, 'Nephrology & Renal Medicine', 'KMC-61034/MD')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    pin = EXCLUDED.pin,
    department = EXCLUDED.department,
    license = EXCLUDED.license;

-- 2. Demo Care Team Users
INSERT INTO care_team_users (crt_id, name, age, phone, email, pin, role)
VALUES 
    ('CRT10001', 'Meenakshi Gowda', 32, '+91 98451 00001', 'meenakshi@curalink.health', '123456', 'Lead ASHA Field Coordinator')
ON CONFLICT (crt_id) DO NOTHING;

-- 3. Demo Patients
INSERT INTO patients (id, uhid, name, age, gender, phone, language, device_type, chronic_conditions, literacy, address, guardian_name, guardian_phone, guardian_consent)
VALUES
    ('pt-ramesh-001', 'ARV-2026-001', 'Ramesh Gowda', 58, 'Male', '+91 98801 12345', 'KANNADA', 'FEATURE_PHONE', ARRAY['Type 2 Diabetes Mellitus', 'Diabetic Neuropathy'], false, 'Near Maramma Temple, Ramanagara District, Karnataka', 'Manjunath Gowda (Son)', '+91 98801 54321', true),
    ('pt-savitha-002', 'ARV-2026-002', 'Savitha Devi', 62, 'Female', '+91 94481 67890', 'KANNADA', 'FEATURE_PHONE', ARRAY['Essential Hypertension Stage II'], false, 'House #42, Doddaballapura Rural, Karnataka', 'Praveen Kumar (Son-in-law)', '+91 94481 99887', true),
    ('pt-anand-003', 'ARV-2026-003', 'Anand Kumar', 45, 'Male', '+91 98450 23456', 'ENGLISH', 'SMARTPHONE', ARRAY['Pre-Diabetes / Metabolic Syndrome', 'Dyslipidemia'], true, 'Indiranagar 100ft Road, Bengaluru, Karnataka', NULL, NULL, false),
    ('pt-mary-004', 'ARV-2026-004', 'Mary D''Souza', 67, 'Female', '+91 98200 34567', 'ENGLISH', 'FEATURE_PHONE', ARRAY['Osteoarthritis Bilateral Knees', 'GERD'], true, 'Richmond Town, Bengaluru, Karnataka', 'Francis D''Souza (Husband)', '+91 98200 76543', true),
    ('pt-rafiq-005', 'ARV-2026-005', 'Mohammed Rafiq', 51, 'Male', '+91 98440 45678', 'HINDI', 'FEATURE_PHONE', ARRAY['Post-PCI (Stented 2024)', 'Type 2 Diabetes Mellitus'], true, 'Tipu Nagar, Shivamogga, Karnataka', 'Amina Rafiq (Wife)', '+91 98440 87654', true),
    ('pt-lakshmi-006', 'ARV-2026-006', 'Lakshmi Bai', 73, 'Female', '+91 94490 56789', 'KANNADA', 'FEATURE_PHONE', ARRAY['Hypertension', 'Mild Cognitive Impairment'], false, 'Mandya Rural Taluk, Mandya, Karnataka', 'Girish Bai (Son)', '+91 94490 12345', true),
    ('pt-suresh-007', 'ARV-2026-007', 'Suresh Patel', 39, 'Male', '+91 97240 67890', 'GUJARATI', 'SMARTPHONE', ARRAY['Bronchial Asthma (Moderate Persistent)'], true, 'Koramangala 4th Block, Bengaluru, Karnataka', NULL, NULL, false),
    ('pt-fathima-008', 'ARV-2026-008', 'Fathima Bi', 55, 'Female', '+91 98455 78901', 'URDU', 'FEATURE_PHONE', ARRAY['Hypothyroidism', 'Generalized Anxiety Disorder'], false, 'Channapatna Old Town, Ramanagara, Karnataka', 'Imran Khan (Son)', '+91 98455 23456', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    age = EXCLUDED.age,
    gender = EXCLUDED.gender,
    phone = EXCLUDED.phone,
    language = EXCLUDED.language,
    device_type = EXCLUDED.device_type,
    chronic_conditions = EXCLUDED.chronic_conditions,
    address = EXCLUDED.address;

-- 4. Demo Appointments
INSERT INTO appointments (id, patient_id, doctor_id, token_number, reason_for_visit, appointment_time, booking_channel, status)
VALUES
    ('apt-001', 'pt-ramesh-001', 'DOC84920', 'TOKEN-01', 'Diabetes Follow-up & High Fasting Blood Sugar (192 mg/dL)', 'Today • 09:30 AM', 'CLINIC_DESK', 'PENDING'),
    ('apt-002', 'pt-savitha-002', 'DOC84920', 'TOKEN-02', 'BP Spike (164/98 mmHg) & Morning Dizziness', 'Today • 10:00 AM', 'AI_VOICE_OUTBOUND', 'PENDING'),
    ('apt-003', 'pt-anand-003', 'DOC84920', 'TOKEN-03', 'Routine Health Checkup & Fasting Lipid Panel Review', 'Today • 10:30 AM', 'PATIENT_PORTAL', 'PENDING'),
    ('apt-004', 'pt-mary-004', 'DOC84920', 'TOKEN-04', 'Bilateral Knee Osteoarthritis Pain & Gastric Acidity Evaluation', 'Today • 11:15 AM', 'INBOUND_IVR', 'PENDING'),
    ('apt-005', 'pt-rafiq-005', 'DOC84920', 'TOKEN-05', 'Post-Stent Follow-up & Antiplatelet Therapy Refill', 'Today • 11:45 AM', 'CLINIC_DESK', 'PENDING')
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    reason_for_visit = EXCLUDED.reason_for_visit;

-- 5. Demo Prescriptions
INSERT INTO prescriptions (id, patient_id, doctor_id, doctor_name, prescription_type, symptoms_notes, follow_up_date, follow_up_notes, telephony_trigger_enabled, status, created_at)
VALUES
    ('rx-ramesh-v1', 'pt-ramesh-001', 'DOC84920', 'Dr. Suresh Sharma, MD', 'NORMAL', 'Patient reported excessive thirst (polydipsia), fatigue in the afternoons, and mild numbness in feet. Fasting blood sugar 192 mg/dL.', '2026-11-12', 'Review HbA1c and Serum Creatinine lab reports to titrate Metformin', true, 'COMMITTED', NOW() - INTERVAL '30 days'),
    ('rx-ramesh-ortho', 'pt-ramesh-001', 'DOC74921', 'Dr. K. R. Nambiar, MS (Orthopedics)', 'NORMAL', 'Patient evaluated for knee osteoarthritis joint stiffness.', NULL, NULL, false, 'COMMITTED', NOW() - INTERVAL '60 days'),
    ('rx-savitha-v1', 'pt-savitha-002', 'DOC84920', 'Dr. Suresh Sharma, MD', 'NORMAL', 'Patient complained of morning occipital headaches and mild dizziness on standing up quickly. Resting BP 164/98 mmHg.', '2026-11-10', 'Review 12-Lead ECG and 2D ECHO scan reports', true, 'COMMITTED', NOW() - INTERVAL '2 days'),
    ('rx-savitha-nephro', 'pt-savitha-002', 'DOC61034', 'Dr. Anita Sen, MD (Nephrology)', 'NORMAL', 'Pedal edema assessment. Serum creatinine normal.', NULL, NULL, false, 'COMMITTED', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    symptoms_notes = EXCLUDED.symptoms_notes;

-- 6. Demo Prescription Medicines
INSERT INTO prescription_medicines (id, prescription_id, medicine_name, dosage, frequency, no_of_days, meal_relation, instructions, dispense_status)
VALUES
    ('med-metformin-001', 'rx-ramesh-v1', 'Metformin Hydrochloride', '500mg', '1-0-1', 30, 'After Food', 'Take with warm water after breakfast and dinner', 'DISPENSED'),
    ('med-glimepiride-001', 'rx-ramesh-v1', 'Glimepiride', '1mg', '1-0-0', 15, 'Before Food', 'Take 15 minutes before breakfast', 'DISPENSED'),
    ('med-paracetamol-ortho', 'rx-ramesh-ortho', 'Paracetamol', '650mg', 'SOS', 10, 'After Food', 'Take only in case of joint pain', 'DISPENSED'),
    ('med-amlodipine-002', 'rx-savitha-v1', 'Amlodipine Besylate', '5mg', '1-0-0', 30, 'After Food', 'Take in the morning with water', 'DISPENSED'),
    ('med-torsemide-nephro', 'rx-savitha-nephro', 'Torsemide', '10mg', '1-0-0', 15, 'Before Food', 'Take in morning before breakfast', 'DISPENSED')
ON CONFLICT (id) DO UPDATE SET
    medicine_name = EXCLUDED.medicine_name,
    dosage = EXCLUDED.dosage,
    frequency = EXCLUDED.frequency;

-- 7. Demo Diagnostics
INSERT INTO prescription_diagnostics (id, prescription_id, test_type, test_name, instructions, urgency, status)
VALUES
    ('diag-001', 'rx-ramesh-v1', 'LAB_TEST', 'HbA1c (Glycated Hemoglobin)', 'Fasting 8-10 hours required. Morning sample.', 'ROUTINE', 'PENDING'),
    ('diag-002', 'rx-ramesh-v1', 'LAB_TEST', 'Kidney Function Test (KFT / Creatinine, BUN)', 'Fasting blood & morning urine sample.', 'ROUTINE', 'PENDING'),
    ('diag-003', 'rx-savitha-v1', 'SCAN', '12-Lead Electrocardiogram (ECG)', 'Resting 12-lead ECG in supine position.', 'URGENT', 'PENDING'),
    ('diag-004', 'rx-savitha-v1', 'SCAN', '2D Echocardiography (ECHO)', 'Assess left ventricular hypertrophy and EF.', 'ROUTINE', 'PENDING')
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status;

-- 8. Demo Telephony Trigger
INSERT INTO telephony_triggers (id, prescription_id, patient_id, patient_phone, preferred_language, trigger_type, voice_call_status, sms_status, payload)
VALUES
    ('trig-rx-ramesh-v1', 'rx-ramesh-v1', 'pt-ramesh-001', '+91 98801 12345', 'KANNADA', 'MEDICATION_ADHERENCE', 'COMPLETED', 'DELIVERED', '{"doctor_name": "Dr. Suresh Sharma, MD", "medicines": [{"name": "Metformin Hydrochloride", "dosage": "500mg", "freq": "1-0-1"}, {"name": "Glimepiride", "dosage": "1mg", "freq": "1-0-0"}]}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 9. Demo Escalations (Care Team Triage)
INSERT INTO escalations (patient_id, patient_name, patient_phone, category, priority, target, notes, status, escalated_by)
VALUES
    ('pt-ramesh-001', 'Ramesh Gowda', '+91 98801 12345', 'ABNORMAL_VITALS', 'CRITICAL', 'Dr. Suresh Sharma, MD', 'Severe systolic spike (185/110 mmHg) recorded during field visit. Blurred vision reported.', 'PENDING', 'Meenakshi (ASHA Lead)'),
    ('pt-savitha-002', 'Savitha Devi', '+91 94481 67890', 'MISSED_MEDICATION', 'URGENT', 'Clinical Team', 'Ran out of Amlodipine 5mg 3 days ago. Unable to reach taluk pharmacy due to knee pain.', 'ACKNOWLEDGED', 'Basavaraj (Field Coordinator)')
ON CONFLICT DO NOTHING;
