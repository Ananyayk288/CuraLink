-- ============================================================
-- CURALINK: PostgreSQL / Supabase Complete Schema
-- Compatible with Supabase SQL Editor and REST PostgREST APIs.
-- Features: Append-only Prescriptions, Immutability Triggers, Diagnostics, Appointments
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users & Roles
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(20) NOT NULL CHECK (role IN ('DOCTOR', 'PATIENT', 'PHARMACY', 'HOSPITAL', 'ADMIN')),
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    medical_license_no VARCHAR(50),
    department VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Patients & Profile
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_uhid VARCHAR(30) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    literacy_status VARCHAR(20) NOT NULL DEFAULT 'GENERAL',
    preferred_language VARCHAR(30) NOT NULL,
    device_type VARCHAR(30) NOT NULL CHECK (device_type IN ('SMARTPHONE', 'FEATURE_PHONE')),
    guardian_name VARCHAR(100),
    guardian_phone VARCHAR(20),
    guardian_consent BOOLEAN DEFAULT FALSE,
    consecutive_missed_calls INT DEFAULT 0,
    dual_escalation_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Prescriptions & Lineages
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    doctor_name VARCHAR(100),
    hospital_id UUID,
    prescription_type VARCHAR(20) NOT NULL DEFAULT 'COMPREHENSIVE' CHECK (prescription_type IN ('NORMAL', 'SCAN_TEST', 'COMPREHENSIVE')),
    parent_prescription_id UUID REFERENCES prescriptions(id),
    revision_number INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'COMMITTED', 'SUPERSEDED')),
    diagnosis_notes TEXT NOT NULL,
    symptoms_notes TEXT,
    word_count INT DEFAULT 0,
    clinical_instructions TEXT,
    follow_up_date VARCHAR(50),
    follow_up_notes TEXT,
    telephony_trigger_enabled BOOLEAN DEFAULT TRUE,
    telephony_triggered_at TIMESTAMPTZ,
    committed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Prescription Medicines (Auto Simple Colors & Dosage)
CREATE TABLE IF NOT EXISTS prescription_medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_name VARCHAR(100) NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    duration_days INT NOT NULL,
    no_of_days INT,
    meal_relation VARCHAR(50) NOT NULL DEFAULT 'After Food',
    instructions TEXT,
    color_sticker VARCHAR(20) CHECK (color_sticker IN ('RED', 'GREEN', 'BLUE', 'YELLOW', 'PURPLE', 'ORANGE', 'PINK')),
    symbol VARCHAR(20),
    dispense_status VARCHAR(20) DEFAULT 'PENDING' CHECK (dispense_status IN ('PENDING', 'DISPENSED', 'SUBSTITUTED')),
    dispensed_at TIMESTAMPTZ
);

-- 4b. Prescription Diagnostics (Scans & Lab Tests)
CREATE TABLE IF NOT EXISTS prescription_diagnostics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    test_type VARCHAR(20) NOT NULL CHECK (test_type IN ('SCAN', 'LAB_TEST')),
    test_name VARCHAR(150) NOT NULL,
    instructions TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    token_number VARCHAR(20),
    reason_for_visit TEXT,
    appointment_time VARCHAR(100) NOT NULL,
    booking_channel VARCHAR(30) NOT NULL DEFAULT 'CLINIC_DESK',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Telephony Triggers (Feeder Queue for AI Calling Agent)
CREATE TABLE IF NOT EXISTS telephony_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id),
    trigger_type VARCHAR(50) NOT NULL, -- NEW_PRESCRIPTION_COMMITTED | SCAN_TEST_ORDERED | FOLLOWUP_REMINDER_WITH_REPORTS
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING | DISPATCHED | COMPLETED | FAILED
    dispatched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Adherence Logs Table
CREATE TABLE IF NOT EXISTS adherence_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medicine_id UUID,
    scheduled_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL,
    response_mode VARCHAR(30) NOT NULL,
    provider_outcome VARCHAR(30) NOT NULL,
    attempt_count INT DEFAULT 1,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Care Tasks (AI Call Human-in-the-Loop Triage Desk)
CREATE TABLE IF NOT EXISTS care_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    prescription_id UUID,
    source_type VARCHAR(30) NOT NULL,
    title VARCHAR(150) NOT NULL,
    raw_transcript TEXT,
    ai_extracted_summary TEXT,
    priority VARCHAR(20) DEFAULT 'HIGH',
    status VARCHAR(20) DEFAULT 'PROPOSED',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Substitution Proposals (Pharmacy Gate)
CREATE TABLE IF NOT EXISTS substitution_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id),
    medicine_id UUID,
    pharmacist_id UUID,
    original_medicine_name VARCHAR(100) NOT NULL,
    proposed_medicine_name VARCHAR(100) NOT NULL,
    reason_for_substitution TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    doctor_rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Database Immutability Trigger (PostgreSQL Level)
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
