-- CuraLink Database Schema Migration 0001
-- Tables: users, patients, prescriptions, prescription_medicines, sticker_assignments, dispense_events, inventory_items, audit_logs

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Enums
CREATE TYPE user_role AS ENUM ('PHARMACY', 'DOCTOR', 'PATIENT', 'HOSPITAL', 'ADMIN');
CREATE TYPE prescription_status AS ENUM ('DRAFT', 'COMMITTED', 'SUPERSEDED');
CREATE TYPE dispense_status AS ENUM ('PENDING', 'DISPENSED', 'CANCELLED');
CREATE TYPE dose_slot AS ENUM ('MORNING', 'AFTERNOON', 'NIGHT');

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role user_role NOT NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    email TEXT UNIQUE,
    facility_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Patients Table (Doctor/Hospital side includes confidential profiles)
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    literacy_status TEXT NOT NULL CHECK (literacy_status IN ('LITERATE', 'ILLITERATE')),
    preferred_language TEXT NOT NULL DEFAULT 'en-IN',
    device_type TEXT NOT NULL CHECK (device_type IN ('SMARTPHONE', 'FEATURE_PHONE')),
    phone_number TEXT NOT NULL,
    guardian_name TEXT,
    guardian_phone TEXT,
    emergency_contact TEXT,
    blood_group TEXT,
    allergies TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    doctor_name TEXT NOT NULL,
    hospital_id TEXT NOT NULL,
    status prescription_status NOT NULL DEFAULT 'DRAFT',
    revision INT NOT NULL DEFAULT 1,
    parent_prescription_id UUID REFERENCES prescriptions(id) ON DELETE RESTRICT,
    committed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    -- Confidential Clinical Fields (Never directly exposed to Pharmacy)
    diagnosis TEXT,
    consultation_notes TEXT,
    psychiatric_evaluation TEXT,
    encounter_notes TEXT,
    lab_findings_summary TEXT,
    CONSTRAINT uq_patient_revision UNIQUE (patient_id, revision)
);

-- 5. Prescription Medicines Line Items (Immutable Once Committed)
CREATE TABLE IF NOT EXISTS prescription_medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE RESTRICT,
    medicine_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Sticker Assignments (Time-of-Day Slots & Before-Food Mini Sticker; Append-Only by Version)
CREATE TABLE IF NOT EXISTS sticker_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_medicine_id UUID NOT NULL REFERENCES prescription_medicines(id) ON DELETE RESTRICT,
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE RESTRICT,
    slots dose_slot[] NOT NULL,
    before_food BOOLEAN NOT NULL DEFAULT FALSE,
    version INT NOT NULL DEFAULT 1,
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_prescription_medicine_version UNIQUE (prescription_medicine_id, version),
    CONSTRAINT chk_slots_non_empty CHECK (array_length(slots, 1) > 0)
);

-- 7. Dispense Events (Append-Only with Idempotency Key)
CREATE TABLE IF NOT EXISTS dispense_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_medicine_id UUID NOT NULL REFERENCES prescription_medicines(id) ON DELETE RESTRICT,
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    pharmacy_id TEXT NOT NULL,
    medicine_name TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    receipt_no TEXT NOT NULL,
    status dispense_status NOT NULL DEFAULT 'DISPENSED',
    idempotency_key TEXT NOT NULL UNIQUE,
    dispensed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    dispensed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Inventory Items
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medicine_name TEXT NOT NULL UNIQUE,
    brand_or_generic TEXT NOT NULL,
    distributor_id TEXT NOT NULL,
    stock_quantity INT NOT NULL CHECK (stock_quantity >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 15,
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Audit Logs (Append-Only)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID NOT NULL,
    actor_role TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ip_address TEXT,
    metadata JSONB DEFAULT '{}'::JSONB
);
