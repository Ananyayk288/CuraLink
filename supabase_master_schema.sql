-- ============================================================================
-- CURALINK MASTER POSTGRESQL DATABASE SCHEMA
-- Unified Schema for:
--   1. Care Team Fieldworker Portal (Port 3001)
--   2. Doctor Clinical Consultation Desk (Port 3000)
--   3. Pharmacy Sticker & Dispensing Counter (Port 3002)
--
-- Instructions: Run this entire script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. DOCTORS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(50) PRIMARY KEY, -- e.g. DOC84920, DOC74921
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    age INT NOT NULL CHECK (age >= 18 AND age <= 120),
    pin VARCHAR(20) NOT NULL, -- 6-digit security PIN (default: 123456)
    is_verified BOOLEAN DEFAULT TRUE,
    department VARCHAR(100) DEFAULT 'General Medicine & Chronic Care',
    license VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. CARE TEAM USERS TABLE (Fieldworkers & ASHA Coordinators)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS care_team_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crt_id TEXT UNIQUE NOT NULL, -- e.g. CRT10001
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    pin VARCHAR(6) NOT NULL, -- 6-digit PIN (default: 123456)
    role TEXT DEFAULT 'Care Team Fieldworker',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. USERS TABLE (Pharmacy & Ecosystem Staff)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL DEFAULT 'PHARMACY' CHECK (role IN ('PHARMACY', 'DOCTOR', 'PATIENT', 'HOSPITAL', 'ADMIN')),
    full_name TEXT NOT NULL,
    phone_number TEXT,
    email TEXT UNIQUE,
    facility_id TEXT DEFAULT 'fac-city-general',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. PATIENTS TABLE (Fully Unified Schema)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('pt-' || substr(md5(random()::text), 1, 8)),
    uhid VARCHAR(50) UNIQUE NOT NULL, -- e.g. PAT10001 or ARV-2026-001
    name VARCHAR(150) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL DEFAULT 'Unspecified',
    phone VARCHAR(50) NOT NULL,
    language VARCHAR(50) NOT NULL DEFAULT 'Kannada',
    device_type VARCHAR(50) NOT NULL DEFAULT 'FEATURE_PHONE',
    chronic_conditions TEXT[] DEFAULT '{}',
    literacy BOOLEAN NOT NULL DEFAULT TRUE, -- TRUE = Literate, FALSE = Illiterate (Requires visual stickers)
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

-- Add compatibility generated columns if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='full_name') THEN
    ALTER TABLE patients ADD COLUMN full_name TEXT GENERATED ALWAYS AS (name) STORED;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='phone_number') THEN
    ALTER TABLE patients ADD COLUMN phone_number TEXT GENERATED ALWAYS AS (phone) STORED;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='literacy_status') THEN
    ALTER TABLE patients ADD COLUMN literacy_status TEXT GENERATED ALWAYS AS (CASE WHEN literacy THEN 'LITERATE' ELSE 'ILLITERATE' END) STORED;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='preferred_language') THEN
    ALTER TABLE patients ADD COLUMN preferred_language TEXT GENERATED ALWAYS AS (language) STORED;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Fallback if generated columns exist or fail
END $$;

-- ----------------------------------------------------------------------------
-- 5. GUARDIANS TABLE (Relational Caregiver Registry)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 6. APPOINTMENTS TABLE (Clinical Queue for Doctor Desk)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(50) PRIMARY KEY, -- e.g. apt-001, apt-PAT10001
    patient_id VARCHAR(50) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id VARCHAR(50) REFERENCES doctors(id) ON DELETE SET NULL,
    token_number VARCHAR(50),
    reason_for_visit TEXT,
    appointment_time VARCHAR(100) NOT NULL,
    booking_channel VARCHAR(50) NOT NULL DEFAULT 'CARE_TEAM_FIELD',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. PRESCRIPTIONS TABLE (Legally Sealed Clinical Records)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prescriptions (
    id VARCHAR(50) PRIMARY KEY, -- e.g. rx-ramesh-v1
    patient_id VARCHAR(50) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id VARCHAR(50) REFERENCES doctors(id) ON DELETE SET NULL,
    doctor_name VARCHAR(150) NOT NULL,
    hospital_id VARCHAR(50) DEFAULT 'HOSP-001',
    prescription_type VARCHAR(50) NOT NULL DEFAULT 'NORMAL' CHECK (prescription_type IN ('NORMAL', 'SCAN_TEST')),
    symptoms_notes TEXT,
    follow_up_date VARCHAR(50),
    follow_up_notes TEXT,
    telephony_trigger_enabled BOOLEAN DEFAULT TRUE,
    telephony_triggered_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'COMMITTED' CHECK (status IN ('DRAFT', 'COMMITTED', 'SUPERSEDED')),
    revision INT NOT NULL DEFAULT 1,
    parent_prescription_id VARCHAR(50) REFERENCES prescriptions(id) ON DELETE SET NULL,
    committed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. PRESCRIPTION MEDICINES TABLE (Dosage, Frequency & Sticker Slots)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prescription_medicines (
    id VARCHAR(100) PRIMARY KEY,
    prescription_id VARCHAR(50) NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(50) NOT NULL, -- e.g. '1-0-1', '1-0-0', '1-1-1', 'SOS'
    no_of_days INT NOT NULL DEFAULT 15,
    duration VARCHAR(50) DEFAULT '15 days',
    meal_relation VARCHAR(50) NOT NULL DEFAULT 'After Food',
    instructions TEXT,
    dispense_status VARCHAR(50) NOT NULL DEFAULT 'PRESCRIBED' CHECK (dispense_status IN ('PRESCRIBED', 'DISPENSED')),
    dose_slots TEXT[] DEFAULT '{MORNING}', -- DoseSlot enum strings: MORNING, AFTERNOON, NIGHT
    before_food BOOLEAN DEFAULT FALSE,
    quantity_prescribed INT NOT NULL DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. PRESCRIPTION DIAGNOSTICS TABLE (Scans & Lab Tests)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 10. TELEPHONY TRIGGERS TABLE (AI Voice Agent & SMS Outbound Queue)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS telephony_triggers (
    id VARCHAR(100) PRIMARY KEY,
    prescription_id VARCHAR(50) NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    patient_id VARCHAR(50) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    patient_phone VARCHAR(50),
    preferred_language VARCHAR(50),
    trigger_type VARCHAR(100) NOT NULL, -- 'MEDICATION_ADHERENCE', 'DIAGNOSTIC_ALERT'
    voice_call_status VARCHAR(50) NOT NULL DEFAULT 'QUEUED',
    sms_status VARCHAR(50) NOT NULL DEFAULT 'QUEUED',
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 11. ESCALATIONS TABLE (Care Team to Doctor Triage)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 12. PHARMACY INVENTORY TABLES (Stock, Batches, Movements)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_name TEXT NOT NULL UNIQUE,
    brand_or_generic TEXT NOT NULL,
    distributor_id TEXT NOT NULL DEFAULT 'dist-med-india-01',
    stock_quantity INT NOT NULL CHECK (stock_quantity >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 15,
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    medicine_name TEXT NOT NULL,
    batch_number TEXT NOT NULL UNIQUE,
    expiry_date DATE NOT NULL,
    stock_quantity INT NOT NULL CHECK (stock_quantity >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    medicine_name TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('DISPENSE', 'RESTOCK', 'ADJUSTMENT')),
    quantity_changed INT NOT NULL,
    quantity_after INT NOT NULL CHECK (quantity_after >= 0),
    reason TEXT,
    performed_by UUID,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 13. STICKER CONFIRMATIONS TABLE (Append-Only Physical Verification)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sticker_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_medicine_id VARCHAR(100) NOT NULL REFERENCES prescription_medicines(id) ON DELETE RESTRICT,
    confirmed_by UUID,
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_sticker_confirmations_medicine UNIQUE (prescription_medicine_id)
);

-- ----------------------------------------------------------------------------
-- 14. DISPENSE EVENTS TABLE (Append-Only with Idempotency)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dispense_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_medicine_id VARCHAR(100) NOT NULL REFERENCES prescription_medicines(id) ON DELETE RESTRICT,
    prescription_id VARCHAR(50) NOT NULL REFERENCES prescriptions(id) ON DELETE RESTRICT,
    patient_id VARCHAR(50) NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    pharmacy_id TEXT NOT NULL DEFAULT 'fac-city-general',
    medicine_name TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    receipt_no TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DISPENSED',
    idempotency_key TEXT NOT NULL UNIQUE,
    dispensed_by UUID,
    dispensed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 15. AUDIT LOGS TABLE (Append-Only System Ledger)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address TEXT,
    metadata JSONB DEFAULT '{}'::JSONB
);

-- ----------------------------------------------------------------------------
-- 16. SCOPED VIEW: PHARMACY ACTIVE PRESCRIPTIONS
-- Connects Doctor Prescriptions to Pharmacist Dispensing Desk
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW pharmacy_active_prescriptions AS
SELECT
    pr.id AS prescription_id,
    pr.patient_id,
    pt.uhid,
    COALESCE(pt.name, pt.full_name) AS patient_display_name,
    (NOT COALESCE(pt.literacy, pt.literacy_status = 'LITERATE', true)) AS requires_stickers,
    COALESCE(pt.language, pt.preferred_language, 'Kannada') AS preferred_language,
    COALESCE(pt.device_type, 'FEATURE_PHONE') AS device_type,
    pr.doctor_id,
    pr.doctor_name,
    COALESCE(pr.hospital_id, 'HOSP-001') AS hospital_id,
    pr.status,
    COALESCE(pr.revision, 1) AS revision,
    pr.parent_prescription_id,
    COALESCE(pr.committed_at, pr.created_at) AS committed_at
FROM prescriptions pr
JOIN patients pt ON (pt.id = pr.patient_id OR pt.uhid = pr.patient_id)
WHERE pr.status IN ('COMMITTED', 'SUPERSEDED');

-- ----------------------------------------------------------------------------
-- 17. AUTOMATED TRIGGER: CALCULATE DOSE SLOTS & STICKERS
-- Populates dose_slots, before_food, duration, and quantity_prescribed
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_calculate_medicine_stickers()
RETURNS TRIGGER AS $$
DECLARE
    f TEXT;
    slots TEXT[] := '{}';
    pills_per_day INT := 1;
BEGIN
    f := UPPER(COALESCE(NEW.frequency, '1-0-0'));

    -- Determine dose slots
    IF f = '1-0-1' THEN
        slots := ARRAY['MORNING', 'NIGHT'];
        pills_per_day := 2;
    ELSIF f = '1-1-1' THEN
        slots := ARRAY['MORNING', 'AFTERNOON', 'NIGHT'];
        pills_per_day := 3;
    ELSIF f = '1-0-0' THEN
        slots := ARRAY['MORNING'];
        pills_per_day := 1;
    ELSIF f = '0-1-0' THEN
        slots := ARRAY['AFTERNOON'];
        pills_per_day := 1;
    ELSIF f = '0-0-1' THEN
        slots := ARRAY['NIGHT'];
        pills_per_day := 1;
    ELSIF f = '0-1-1' THEN
        slots := ARRAY['AFTERNOON', 'NIGHT'];
        pills_per_day := 2;
    ELSE
        slots := ARRAY['MORNING'];
        pills_per_day := 1;
    END IF;

    IF NEW.dose_slots IS NULL OR array_length(NEW.dose_slots, 1) IS NULL THEN
        NEW.dose_slots := slots;
    END IF;

    -- Before food mini-sticker
    IF NEW.before_food IS NULL THEN
        NEW.before_food := (LOWER(COALESCE(NEW.meal_relation, '')) LIKE '%before%');
    END IF;

    -- Duration string
    IF NEW.duration IS NULL OR NEW.duration = '' THEN
        NEW.duration := (COALESCE(NEW.no_of_days, 15)::TEXT || ' days');
    END IF;

    -- Quantity prescribed
    IF NEW.quantity_prescribed IS NULL OR NEW.quantity_prescribed <= 0 THEN
        NEW.quantity_prescribed := (COALESCE(NEW.no_of_days, 15) * pills_per_day);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_meds_stickers_auto ON prescription_medicines;
CREATE TRIGGER trg_meds_stickers_auto
BEFORE INSERT OR UPDATE ON prescription_medicines
FOR EACH ROW
EXECUTE FUNCTION trg_calculate_medicine_stickers();

-- ----------------------------------------------------------------------------
-- 18. AUTOMATED TRIGGER: PRESCRIPTION IMMUTABILITY
-- Prevents editing or deleting legally signed and committed prescriptions
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 19. PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);
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
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);
CREATE INDEX IF NOT EXISTS idx_dispense_events_idempotency ON dispense_events(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_dispense_events_receipt ON dispense_events(receipt_no);

-- ----------------------------------------------------------------------------
-- 20. ROW LEVEL SECURITY (RLS) POLICIES
-- Permissive policies for full bidirectional real-time demo synchronization
-- ----------------------------------------------------------------------------
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_team_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE telephony_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sticker_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispense_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'doctors', 'care_team_users', 'users', 'patients', 'guardians',
      'appointments', 'prescriptions', 'prescription_medicines',
      'prescription_diagnostics', 'telephony_triggers', 'escalations',
      'inventory_items', 'inventory_batches', 'inventory_movements',
      'sticker_confirmations', 'dispense_events', 'audit_logs'
    ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow anon all on %I" ON %I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow anon all on %I" ON %I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 21. REALTIME PUBLICATION SUBSCRIPTION
-- Enables live WebSocket broadcasts across portals
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['patients', 'appointments', 'escalations', 'prescriptions', 'dispense_events'])
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I;', t);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ============================================================================
-- 22. RICH SEED DATA FOR IMMEDIATE DEMO TESTING
-- ============================================================================

-- 1. Demo Doctors
INSERT INTO doctors (id, name, phone, email, age, pin, is_verified, department, license)
VALUES
    ('DOC84920', 'Dr. Suresh Sharma, MD', '+91 98450 11223', 'dr.suresh@curalink.health', 48, '123456', true, 'Internal Medicine & Chronic Care', 'KMC-84920/MD'),
    ('DOC74921', 'Dr. K. R. Nambiar, MS', '+91 98450 44556', 'dr.nambiar@curalink.health', 52, '123456', true, 'Orthopedics & Joint Care', 'KMC-74921/MS'),
    ('DOC61034', 'Dr. Anita Sen, MD', '+91 98450 77889', 'dr.anita@curalink.health', 44, '123456', true, 'Nephrology & Renal Medicine', 'KMC-61034/MD')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    pin = EXCLUDED.pin;

-- 2. Demo Care Team Users
INSERT INTO care_team_users (crt_id, name, age, phone, email, pin, role)
VALUES 
    ('CRT10001', 'Meenakshi Gowda', 32, '+91 98451 00001', 'meenakshi@curalink.health', '123456', 'Lead ASHA Field Coordinator')
ON CONFLICT (crt_id) DO NOTHING;

-- 3. Demo Pharmacist User
INSERT INTO users (id, role, full_name, phone_number, email, facility_id)
VALUES
    ('c0a80101-0000-0000-0000-000000000001', 'PHARMACY', 'Pharmacist Rajiv', '+91 98451 99999', 'rajiv.pharmacy@curalink.health', 'fac-city-general')
ON CONFLICT (id) DO NOTHING;

-- 4. Demo Patients
INSERT INTO patients (id, uhid, name, age, gender, phone, language, device_type, chronic_conditions, literacy, address, guardian_name, guardian_phone, guardian_consent)
VALUES
    ('pt-ramesh-001', 'PAT10001', 'Ramesh Gowda', 58, 'Male', '+91 98801 12345', 'Kannada', 'FEATURE_PHONE', ARRAY['Type 2 Diabetes Mellitus', 'Diabetic Neuropathy'], false, 'Near Maramma Temple, Ramanagara District, Karnataka', 'Suresh Gowda (Son)', '+91 98801 54321', true),
    ('pt-savitha-002', 'PAT10002', 'Savitha Devi', 62, 'Female', '+91 94481 67890', 'Kannada', 'FEATURE_PHONE', ARRAY['Essential Hypertension Stage II'], false, 'House #42, Doddaballapura Rural, Karnataka', 'Anitha Devi (Daughter)', '+91 94481 99887', true),
    ('pt-anand-003', 'PAT10003', 'Anand Kumar', 45, 'Male', '+91 98450 23456', 'English', 'SMARTPHONE', ARRAY['Pre-Diabetes / Metabolic Syndrome', 'Dyslipidemia'], true, 'Indiranagar 100ft Road, Bengaluru, Karnataka', NULL, NULL, false)
ON CONFLICT (id) DO UPDATE SET
    uhid = EXCLUDED.uhid,
    name = EXCLUDED.name,
    literacy = EXCLUDED.literacy;

-- 5. Demo Appointments (Pending in Doctor Desk)
INSERT INTO appointments (id, patient_id, doctor_id, token_number, reason_for_visit, appointment_time, booking_channel, status)
VALUES
    ('apt-001', 'pt-ramesh-001', 'DOC84920', 'TOKEN-01', 'Diabetes Follow-up & High Fasting Blood Sugar (192 mg/dL)', 'Today • 09:30 AM', 'CARE_TEAM_FIELD', 'PENDING'),
    ('apt-002', 'pt-savitha-002', 'DOC84920', 'TOKEN-02', 'BP Spike (164/98 mmHg) & Morning Dizziness', 'Today • 10:00 AM', 'CARE_TEAM_FIELD', 'PENDING')
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status;

-- 6. Demo Prescriptions
INSERT INTO prescriptions (id, patient_id, doctor_id, doctor_name, prescription_type, symptoms_notes, follow_up_date, follow_up_notes, telephony_trigger_enabled, status, revision, committed_at)
VALUES
    ('rx-ramesh-v1', 'pt-ramesh-001', 'DOC84920', 'Dr. Suresh Sharma, MD', 'NORMAL', 'Excessive thirst and afternoon fatigue. Fasting sugar 192 mg/dL.', '2026-11-12', 'Review HbA1c in 30 days', true, 'COMMITTED', 1, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- 7. Demo Prescription Medicines
INSERT INTO prescription_medicines (id, prescription_id, medicine_name, dosage, frequency, no_of_days, meal_relation, instructions, dispense_status, dose_slots, before_food, quantity_prescribed)
VALUES
    ('med-metformin-001', 'rx-ramesh-v1', 'Metformin 500mg', '500mg', '1-0-1', 30, 'After Food', 'Take with warm water after breakfast and dinner', 'PRESCRIBED', ARRAY['MORNING', 'NIGHT'], false, 60),
    ('med-glimepiride-001', 'rx-ramesh-v1', 'Glimepiride 1mg', '1mg', '1-0-0', 15, 'Before Food', 'Take 15 minutes before breakfast', 'PRESCRIBED', ARRAY['MORNING'], true, 15)
ON CONFLICT (id) DO UPDATE SET
    medicine_name = EXCLUDED.medicine_name,
    frequency = EXCLUDED.frequency;

-- 8. Demo Pharmacy Inventory Items
INSERT INTO inventory_items (id, medicine_name, brand_or_generic, distributor_id, stock_quantity, low_stock_threshold)
VALUES
    ('e0000001-0000-0000-0000-000000000001', 'Metformin 500mg', 'Glyciphage (Generic Metformin)', 'dist-med-india-01', 120, 30),
    ('e0000001-0000-0000-0000-000000000002', 'Glimepiride 1mg', 'Amaryl (Glimepiride)', 'dist-med-india-01', 60, 20),
    ('e0000001-0000-0000-0000-000000000003', 'Atorvastatin 10mg', 'Atorva (Atorvastatin)', 'dist-med-india-02', 45, 15),
    ('e0000001-0000-0000-0000-000000000004', 'Amoxicillin 500mg', 'Mox 500', 'dist-med-india-01', 80, 25),
    ('e0000001-0000-0000-0000-000000000005', 'Amlodipine 10mg', 'Norvasc / Amlong', 'dist-med-india-02', 50, 15),
    ('e0000001-0000-0000-0000-000000000006', 'Paracetamol 650mg', 'Dolo 650', 'dist-med-india-01', 150, 40),
    ('e0000001-0000-0000-0000-000000000007', 'Torsemide 10mg', 'Dytor 10', 'dist-med-india-02', 40, 15)
ON CONFLICT (medicine_name) DO UPDATE SET
    stock_quantity = EXCLUDED.stock_quantity;

-- 9. Demo Pharmacy Inventory Batches
INSERT INTO inventory_batches (inventory_item_id, medicine_name, batch_number, expiry_date, stock_quantity)
VALUES
    ('e0000001-0000-0000-0000-000000000001', 'Metformin 500mg', 'BTH-MET-2026-01', CURRENT_DATE + INTERVAL '365 days', 120),
    ('e0000001-0000-0000-0000-000000000002', 'Glimepiride 1mg', 'BTH-GLI-2026-01', CURRENT_DATE + INTERVAL '240 days', 60),
    ('e0000001-0000-0000-0000-000000000003', 'Atorvastatin 10mg', 'BTH-ATO-2026-01', CURRENT_DATE + INTERVAL '180 days', 45),
    ('e0000001-0000-0000-0000-000000000004', 'Amoxicillin 500mg', 'BTH-AMX-2026-01', CURRENT_DATE + INTERVAL '300 days', 80),
    ('e0000001-0000-0000-0000-000000000005', 'Amlodipine 10mg', 'BTH-AML-2026-01', CURRENT_DATE + INTERVAL '320 days', 50),
    ('e0000001-0000-0000-0000-000000000006', 'Paracetamol 650mg', 'BTH-PCM-2026-01', CURRENT_DATE + INTERVAL '400 days', 150),
    ('e0000001-0000-0000-0000-000000000007', 'Torsemide 10mg', 'BTH-TOR-2026-01', CURRENT_DATE + INTERVAL '280 days', 40)
ON CONFLICT (batch_number) DO NOTHING;

-- 10. Demo Field Escalations
INSERT INTO escalations (patient_id, patient_name, patient_phone, category, priority, target, notes, status, escalated_by)
VALUES
    ('PAT10001', 'Ramesh Gowda', '+91 98801 12345', 'ABNORMAL_VITALS', 'CRITICAL', 'Dr. Suresh Sharma, MD', 'Severe systolic spike (185/110 mmHg) recorded during field visit. Blurred vision reported.', 'PENDING', 'Meenakshi (ASHA Lead)')
ON CONFLICT DO NOTHING;
