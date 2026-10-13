-- ============================================================
-- CURALINK: Supabase Complete PostgreSQL Production Schema
-- Designed for CURALINK Doctor Portal
-- Includes: Doctors (DOCxxxxx), Patients, Appointments,
-- Prescriptions, Medicines, Diagnostics, Telephony Triggers,
-- Row Level Security (RLS) policies, and Seed Data.
-- ============================================================

-- Enable UUID extension if needed
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
-- 2. PATIENTS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(50) PRIMARY KEY, -- e.g. pt-ramesh-001
    uhid VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    language VARCHAR(50) NOT NULL DEFAULT 'KANNADA',
    device_type VARCHAR(50) NOT NULL DEFAULT 'FEATURE_PHONE',
    chronic_conditions TEXT[] DEFAULT '{}',
    guardian_name VARCHAR(150),
    guardian_phone VARCHAR(50),
    guardian_consent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 3. APPOINTMENTS TABLE
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
-- 4. PRESCRIPTIONS TABLE
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
-- 5. PRESCRIPTION MEDICINES TABLE
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
-- 6. PRESCRIPTION DIAGNOSTICS (SCANS / LAB TESTS) TABLE
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
-- 7. TELEPHONY TRIGGERS TABLE (AI Call Adherence Queue)
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
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);
CREATE INDEX IF NOT EXISTS idx_doctors_phone ON doctors(phone);
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

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable public anon access for clinical portal synchronization
-- ------------------------------------------------------------
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE telephony_triggers ENABLE ROW LEVEL SECURITY;

-- Doctors policies
DROP POLICY IF EXISTS "Anon allow all on doctors" ON doctors;
CREATE POLICY "Anon allow all on doctors" ON doctors FOR ALL USING (true) WITH CHECK (true);

-- Patients policies
DROP POLICY IF EXISTS "Anon allow all on patients" ON patients;
CREATE POLICY "Anon allow all on patients" ON patients FOR ALL USING (true) WITH CHECK (true);

-- Appointments policies
DROP POLICY IF EXISTS "Anon allow all on appointments" ON appointments;
CREATE POLICY "Anon allow all on appointments" ON appointments FOR ALL USING (true) WITH CHECK (true);

-- Prescriptions policies
DROP POLICY IF EXISTS "Anon allow all on prescriptions" ON prescriptions;
CREATE POLICY "Anon allow all on prescriptions" ON prescriptions FOR ALL USING (true) WITH CHECK (true);

-- Prescription Medicines policies
DROP POLICY IF EXISTS "Anon allow all on prescription_medicines" ON prescription_medicines;
CREATE POLICY "Anon allow all on prescription_medicines" ON prescription_medicines FOR ALL USING (true) WITH CHECK (true);

-- Prescription Diagnostics policies
DROP POLICY IF EXISTS "Anon allow all on prescription_diagnostics" ON prescription_diagnostics;
CREATE POLICY "Anon allow all on prescription_diagnostics" ON prescription_diagnostics FOR ALL USING (true) WITH CHECK (true);

-- Telephony Triggers policies
DROP POLICY IF EXISTS "Anon allow all on telephony_triggers" ON telephony_triggers;
CREATE POLICY "Anon allow all on telephony_triggers" ON telephony_triggers FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- SEED DATA INSERTION
-- Populates demo clinical practitioners, patients, queue,
-- and past prescriptions with multi-doctor separation.
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

-- 2. Demo Patients
INSERT INTO patients (id, uhid, name, age, gender, phone, language, device_type, chronic_conditions, guardian_name, guardian_phone, guardian_consent)
VALUES
    ('pt-ramesh-001', 'ARV-2026-001', 'Ramesh Gowda', 58, 'Male', '+91 98801 12345', 'KANNADA', 'FEATURE_PHONE', ARRAY['Type 2 Diabetes Mellitus', 'Diabetic Neuropathy'], 'Manjunath Gowda (Son)', '+91 98801 54321', true),
    ('pt-savitha-002', 'ARV-2026-002', 'Savitha Devi', 62, 'Female', '+91 94481 67890', 'KANNADA', 'FEATURE_PHONE', ARRAY['Essential Hypertension Stage II'], 'Praveen Kumar (Son-in-law)', '+91 94481 99887', true),
    ('pt-anand-003', 'ARV-2026-003', 'Anand Kumar', 45, 'Male', '+91 98450 23456', 'ENGLISH', 'SMARTPHONE', ARRAY['Pre-Diabetes / Metabolic Syndrome', 'Dyslipidemia'], NULL, NULL, false),
    ('pt-mary-004', 'ARV-2026-004', 'Mary D''Souza', 67, 'Female', '+91 98200 34567', 'ENGLISH', 'FEATURE_PHONE', ARRAY['Osteoarthritis Bilateral Knees', 'GERD'], 'Francis D''Souza (Husband)', '+91 98200 76543', true),
    ('pt-rafiq-005', 'ARV-2026-005', 'Mohammed Rafiq', 51, 'Male', '+91 98440 45678', 'HINDI', 'FEATURE_PHONE', ARRAY['Post-PCI (Stented 2024)', 'Type 2 Diabetes Mellitus'], 'Amina Rafiq (Wife)', '+91 98440 87654', true),
    ('pt-lakshmi-006', 'ARV-2026-006', 'Lakshmi Bai', 73, 'Female', '+91 94490 56789', 'KANNADA', 'FEATURE_PHONE', ARRAY['Hypertension', 'Mild Cognitive Impairment'], 'Girish Bai (Son)', '+91 94490 12345', true),
    ('pt-suresh-007', 'ARV-2026-007', 'Suresh Patel', 39, 'Male', '+91 97240 67890', 'GUJARATI', 'SMARTPHONE', ARRAY['Bronchial Asthma (Moderate Persistent)'], NULL, NULL, false),
    ('pt-fathima-008', 'ARV-2026-008', 'Fathima Bi', 55, 'Female', '+91 98455 78901', 'URDU', 'FEATURE_PHONE', ARRAY['Hypothyroidism', 'Generalized Anxiety Disorder'], 'Imran Khan (Son)', '+91 98455 23456', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    age = EXCLUDED.age,
    gender = EXCLUDED.gender,
    phone = EXCLUDED.phone,
    language = EXCLUDED.language,
    device_type = EXCLUDED.device_type,
    chronic_conditions = EXCLUDED.chronic_conditions;

-- 3. Demo Appointments
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

-- 4. Demo Prescriptions
INSERT INTO prescriptions (id, patient_id, doctor_id, doctor_name, prescription_type, symptoms_notes, follow_up_date, follow_up_notes, telephony_trigger_enabled, status, created_at)
VALUES
    ('rx-ramesh-v1', 'pt-ramesh-001', 'DOC84920', 'Dr. Suresh Sharma, MD', 'NORMAL', 'Patient reported excessive thirst (polydipsia), fatigue in the afternoons, and mild numbness in feet. Fasting blood sugar 192 mg/dL.', '2026-11-12', 'Review HbA1c and Serum Creatinine lab reports to titrate Metformin', true, 'COMMITTED', NOW() - INTERVAL '30 days'),
    ('rx-ramesh-ortho', 'pt-ramesh-001', 'DOC74921', 'Dr. K. R. Nambiar, MS (Orthopedics)', 'NORMAL', 'Patient evaluated for knee osteoarthritis joint stiffness.', NULL, NULL, false, 'COMMITTED', NOW() - INTERVAL '60 days'),
    ('rx-savitha-v1', 'pt-savitha-002', 'DOC84920', 'Dr. Suresh Sharma, MD', 'NORMAL', 'Patient complained of morning occipital headaches and mild dizziness on standing up quickly. Resting BP 164/98 mmHg.', '2026-11-10', 'Review 12-Lead ECG and 2D ECHO scan reports', true, 'COMMITTED', NOW() - INTERVAL '2 days'),
    ('rx-savitha-nephro', 'pt-savitha-002', 'DOC61034', 'Dr. Anita Sen, MD (Nephrology)', 'NORMAL', 'Pedal edema assessment. Serum creatinine normal.', NULL, NULL, false, 'COMMITTED', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    symptoms_notes = EXCLUDED.symptoms_notes;

-- 5. Demo Prescription Medicines
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

-- 6. Demo Diagnostics
INSERT INTO prescription_diagnostics (id, prescription_id, test_type, test_name, instructions, urgency, status)
VALUES
    ('diag-001', 'rx-ramesh-v1', 'LAB_TEST', 'HbA1c (Glycated Hemoglobin)', 'Fasting 8-10 hours required. Morning sample.', 'ROUTINE', 'PENDING'),
    ('diag-002', 'rx-ramesh-v1', 'LAB_TEST', 'Kidney Function Test (KFT / Creatinine, BUN)', 'Fasting blood & morning urine sample.', 'ROUTINE', 'PENDING'),
    ('diag-003', 'rx-savitha-v1', 'SCAN', '12-Lead Electrocardiogram (ECG)', 'Resting 12-lead ECG in supine position.', 'URGENT', 'PENDING'),
    ('diag-004', 'rx-savitha-v1', 'SCAN', '2D Echocardiography (ECHO)', 'Assess left ventricular hypertrophy and EF.', 'ROUTINE', 'PENDING')
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status;

-- 7. Demo Telephony Trigger
INSERT INTO telephony_triggers (id, prescription_id, patient_id, patient_phone, preferred_language, trigger_type, voice_call_status, sms_status, payload)
VALUES
    ('trig-rx-ramesh-v1', 'rx-ramesh-v1', 'pt-ramesh-001', '+91 98801 12345', 'KANNADA', 'MEDICATION_ADHERENCE', 'COMPLETED', 'DELIVERED', '{"doctor_name": "Dr. Suresh Sharma, MD", "medicines": [{"name": "Metformin Hydrochloride", "freq": "1-0-1"}, {"name": "Glimepiride", "freq": "1-0-0"}]}'::jsonb)
ON CONFLICT (id) DO NOTHING;
