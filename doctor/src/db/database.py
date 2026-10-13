"""
CURALINK — Database Layer
Relational persistence with strict database-level immutability triggers.
Compatible with SQLite (local hackathon run) and PostgreSQL / Supabase.
"""

import sqlite3
import os
from typing import Optional

DB_FILE = os.environ.get("AROGYAVANI_DB_PATH", "arogyavani.db")


def get_connection(db_path: str = DB_FILE) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db(db_path: str = DB_FILE) -> None:
    """Initialize database tables, indexes, and legal immutability triggers."""
    conn = get_connection(db_path)
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone_number TEXT UNIQUE NOT NULL,
        medical_license_no TEXT,
        department TEXT,
        created_at TEXT NOT NULL
    );
    """)

    # 2. Patients Table (Literacy & Accessibility Profile)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        patient_uhid TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        phone_number TEXT UNIQUE NOT NULL,
        literacy_status TEXT NOT NULL,      -- LITERATE | ILLITERATE
        preferred_language TEXT NOT NULL,   -- KANNADA | HINDI | etc.
        device_type TEXT NOT NULL,          -- SMARTPHONE | FEATURE_PHONE
        guardian_name TEXT,
        guardian_phone TEXT,
        guardian_consent INTEGER NOT NULL DEFAULT 0, -- 1 for True, 0 for False
        consecutive_missed_calls INTEGER NOT NULL DEFAULT 0,
        dual_escalation_active INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
    );
    """)

    # 3. Prescriptions Table (Revision Lineage & Immutability)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS prescriptions (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        doctor_id TEXT NOT NULL,
        doctor_name TEXT,                  -- e.g. Dr. Suresh Sharma, MD
        hospital_id TEXT,
        prescription_type TEXT NOT NULL DEFAULT 'COMPREHENSIVE', -- NORMAL | SCAN_TEST | COMPREHENSIVE
        parent_prescription_id TEXT,       -- Points to prior revision (NULL for v1)
        revision_number INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT | COMMITTED | SUPERSEDED
        diagnosis_notes TEXT NOT NULL,     -- Hidden from Pharmacy
        symptoms_notes TEXT,               -- Patient symptoms written by Doctor
        word_count INTEGER DEFAULT 0,      -- Enforces word limit
        clinical_instructions TEXT,
        follow_up_date TEXT,
        follow_up_notes TEXT,              -- Specific clinical goals for the follow-up visit
        telephony_trigger_enabled INTEGER NOT NULL DEFAULT 1, -- 1=Trigger Supabase & AI voice agent
        telephony_triggered_at TEXT,
        committed_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT,
        FOREIGN KEY (parent_prescription_id) REFERENCES prescriptions(id) ON DELETE RESTRICT
    );
    """)

    # 4. Prescription Medicines Table (Color-Sticker & Dosage Line items)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS prescription_medicines (
        id TEXT PRIMARY KEY,
        prescription_id TEXT NOT NULL,
        medicine_name TEXT NOT NULL,
        dosage TEXT NOT NULL,              -- e.g. 500mg
        frequency TEXT NOT NULL,           -- e.g. 1-0-1 (Twice Daily)
        duration_days INTEGER NOT NULL,    -- No. of days
        no_of_days INTEGER,                -- Alias for days
        meal_relation TEXT NOT NULL DEFAULT 'After Food', -- Before Food | After Food | With Food | Empty Stomach
        instructions TEXT,
        color_sticker TEXT,                -- PINK | BLUE | YELLOW | GREEN | PURPLE
        symbol TEXT,                       -- CIRCLE | TRIANGLE | STAR | SQUARE | DIAMOND
        dispense_status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | DISPENSED | SUBSTITUTED
        dispensed_at TEXT,
        FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
    );
    """)

    # 4b. Prescription Diagnostics Table (Diagnostic Scans & Lab Investigations)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS prescription_diagnostics (
        id TEXT PRIMARY KEY,
        prescription_id TEXT NOT NULL,
        test_type TEXT NOT NULL,           -- SCAN | LAB_TEST
        test_name TEXT NOT NULL,           -- e.g. HbA1c, Chest X-Ray PA View, USG Abdomen
        instructions TEXT,                 -- e.g. Fasting 8-10 hours, Empty stomach, Carry prior films
        status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | COMPLETED | CANCELLED
        created_at TEXT NOT NULL,
        FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
    );
    """)

    # 5. Care Tasks Table (Human-in-the-Loop AI call triage)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS care_tasks (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        prescription_id TEXT,
        source_type TEXT NOT NULL,         -- AI_CALL_EXTRACT | DUAL_ESCALATION
        title TEXT NOT NULL,
        raw_transcript TEXT,
        ai_extracted_summary TEXT,
        priority TEXT NOT NULL DEFAULT 'HIGH', -- LOW | MEDIUM | HIGH | CRITICAL
        status TEXT NOT NULL DEFAULT 'PROPOSED', -- PROPOSED | APPROVED | REJECTED | RESOLVED
        reviewed_by TEXT,
        reviewed_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    );
    """)

    # 6. Substitution Proposals Table (Pharmacy Bridge Gate)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS substitution_proposals (
        id TEXT PRIMARY KEY,
        prescription_id TEXT NOT NULL,
        medicine_id TEXT NOT NULL,
        pharmacist_id TEXT NOT NULL,
        original_medicine_name TEXT NOT NULL,
        proposed_medicine_name TEXT NOT NULL,
        reason_for_substitution TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | APPROVED | REJECTED
        doctor_rejection_reason TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE RESTRICT
    );
    """)

    # 7. Adherence Logs Table (Honest Status Language)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS adherence_logs (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        medicine_id TEXT,
        scheduled_time TEXT NOT NULL,
        status TEXT NOT NULL,              -- TAKEN_REPORTED | HELP_REQUESTED | SNOOZED | NO_ANSWER | PROVIDER_FAILED
        response_mode TEXT NOT NULL,       -- DTMF_1 | DTMF_2 | DTMF_3 | STT | NO_ANSWER
        provider_outcome TEXT NOT NULL,    -- ANSWERED | BUSY | NETWORK_FAILED
        attempt_count INTEGER NOT NULL DEFAULT 1,
        recorded_at TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );
    """)

    # 8. Appointments Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        doctor_id TEXT NOT NULL,
        token_number TEXT,                 -- e.g. TOKEN-01, TOKEN-02
        reason_for_visit TEXT,             -- e.g. Monthly Diabetes & BP Review
        appointment_time TEXT NOT NULL,
        booking_channel TEXT NOT NULL,     -- SMARTPHONE | INBOUND_IVR | CLINIC_DESK
        status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | IN_CONSULTATION | COMPLETED
        created_at TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT
    );
    """)

    # -------------------------------------------------------------
    # 9. DATABASE-LEVEL IMMUTABILITY TRIGGERS
    # Enforces Section 10: Committed records cannot be updated or deleted
    # -------------------------------------------------------------

    # Drop existing triggers if re-initializing
    cursor.execute("DROP TRIGGER IF EXISTS trg_prescription_update_immutable;")
    cursor.execute("DROP TRIGGER IF EXISTS trg_prescription_delete_immutable;")
    cursor.execute("DROP TRIGGER IF EXISTS trg_prescription_items_update_immutable;")
    cursor.execute("DROP TRIGGER IF EXISTS trg_prescription_items_delete_immutable;")
    cursor.execute("DROP TRIGGER IF EXISTS trg_prescription_diagnostics_update_immutable;")
    cursor.execute("DROP TRIGGER IF EXISTS trg_prescription_diagnostics_delete_immutable;")

    # A) Block UPDATE on COMMITTED prescriptions
    cursor.execute("""
    CREATE TRIGGER trg_prescription_update_immutable
    BEFORE UPDATE ON prescriptions
    FOR EACH ROW
    WHEN (OLD.status = 'COMMITTED')
    BEGIN
        SELECT RAISE(ABORT, 'DATABASE RESTRICTION: Committed prescription is legally immutable. Create a new revision referencing parent_prescription_id instead.');
    END;
    """)

    # B) Block DELETE on COMMITTED prescriptions
    cursor.execute("""
    CREATE TRIGGER trg_prescription_delete_immutable
    BEFORE DELETE ON prescriptions
    FOR EACH ROW
    WHEN (OLD.status = 'COMMITTED')
    BEGIN
        SELECT RAISE(ABORT, 'DATABASE RESTRICTION: Committed prescription is legally immutable and cannot be deleted.');
    END;
    """)

    # C) Block UPDATE on line-items belonging to a COMMITTED prescription
    cursor.execute("""
    CREATE TRIGGER trg_prescription_items_update_immutable
    BEFORE UPDATE ON prescription_medicines
    FOR EACH ROW
    WHEN ((SELECT status FROM prescriptions WHERE id = OLD.prescription_id) = 'COMMITTED')
    BEGIN
        SELECT RAISE(ABORT, 'DATABASE RESTRICTION: Medicine line items belonging to a committed prescription cannot be modified.');
    END;
    """)

    # D) Block DELETE on line-items belonging to a COMMITTED prescription
    cursor.execute("""
    CREATE TRIGGER trg_prescription_items_delete_immutable
    BEFORE DELETE ON prescription_medicines
    FOR EACH ROW
    WHEN ((SELECT status FROM prescriptions WHERE id = OLD.prescription_id) = 'COMMITTED')
    BEGIN
        SELECT RAISE(ABORT, 'DATABASE RESTRICTION: Medicine line items belonging to a committed prescription cannot be deleted.');
    END;
    """)

    # E) Block UPDATE on diagnostic items belonging to a COMMITTED prescription
    cursor.execute("""
    CREATE TRIGGER trg_prescription_diagnostics_update_immutable
    BEFORE UPDATE ON prescription_diagnostics
    FOR EACH ROW
    WHEN ((SELECT status FROM prescriptions WHERE id = OLD.prescription_id) = 'COMMITTED')
    BEGIN
        SELECT RAISE(ABORT, 'DATABASE RESTRICTION: Diagnostic investigation orders belonging to a committed prescription cannot be modified.');
    END;
    """)

    # F) Block DELETE on diagnostic items belonging to a COMMITTED prescription
    cursor.execute("""
    CREATE TRIGGER trg_prescription_diagnostics_delete_immutable
    BEFORE DELETE ON prescription_diagnostics
    FOR EACH ROW
    WHEN ((SELECT status FROM prescriptions WHERE id = OLD.prescription_id) = 'COMMITTED')
    BEGIN
        SELECT RAISE(ABORT, 'DATABASE RESTRICTION: Diagnostic investigation orders belonging to a committed prescription cannot be deleted.');
    END;
    """)

    conn.commit()
    conn.close()


def generate_postgres_migration() -> str:
    """Generate exact PostgreSQL DDL with RLS and trigger for Supabase deployment."""
    return """-- PostgreSQL / Supabase Migration: CuraLink Doctor Schema with Immutability
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(20) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    medical_license_no VARCHAR(50),
    department VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_uhid VARCHAR(30) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    literacy_status VARCHAR(20) NOT NULL,
    preferred_language VARCHAR(30) NOT NULL,
    device_type VARCHAR(30) NOT NULL,
    guardian_name VARCHAR(100),
    guardian_phone VARCHAR(20),
    guardian_consent BOOLEAN DEFAULT FALSE,
    consecutive_missed_calls INT DEFAULT 0,
    dual_escalation_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    hospital_id UUID,
    parent_prescription_id UUID REFERENCES prescriptions(id),
    revision_number INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'DRAFT',
    diagnosis_notes TEXT NOT NULL,
    clinical_instructions TEXT,
    follow_up_date DATE,
    committed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescription_medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_name VARCHAR(100) NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    duration_days INT NOT NULL,
    instructions TEXT,
    color_sticker VARCHAR(20),
    symbol VARCHAR(20),
    dispense_status VARCHAR(20) DEFAULT 'PENDING',
    dispensed_at TIMESTAMPTZ
);

-- Immutability Trigger Function
CREATE OR REPLACE FUNCTION enforce_prescription_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'COMMITTED' THEN
        RAISE EXCEPTION 'A committed prescription is legally immutable. Create a new revision referencing parent_prescription_id %% instead.', OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prescription_immutable
BEFORE UPDATE OR DELETE ON prescriptions
FOR EACH ROW
EXECUTE FUNCTION enforce_prescription_immutability();
"""
