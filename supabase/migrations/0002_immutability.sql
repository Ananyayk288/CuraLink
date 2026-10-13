-- CuraLink Database Immutability Triggers Migration 0002
-- Enforces absolute immutability of committed clinical records, dispense events, sticker assignments, and audit logs.

-- 1. Immutability trigger for prescriptions
CREATE OR REPLACE FUNCTION trg_prescriptions_immutability()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow UPDATE only if transitioning status from COMMITTED to SUPERSEDED
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.status = 'COMMITTED' AND NEW.status = 'SUPERSEDED') THEN
            -- Verify no clinical fields were altered during supersede transition
            IF (OLD.patient_id != NEW.patient_id OR
                OLD.doctor_id != NEW.doctor_id OR
                OLD.revision != NEW.revision OR
                OLD.diagnosis IS DISTINCT FROM NEW.diagnosis OR
                OLD.committed_at IS DISTINCT FROM NEW.committed_at) THEN
                RAISE EXCEPTION 'Cannot alter clinical content when superseding a committed prescription.';
            END IF;
            RETURN NEW;
        END IF;

        IF (OLD.status IN ('COMMITTED', 'SUPERSEDED')) THEN
            RAISE EXCEPTION 'Committed prescriptions are strictly immutable. Update prohibited (ID: %).', OLD.id;
        END IF;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        IF (OLD.status IN ('COMMITTED', 'SUPERSEDED')) THEN
            RAISE EXCEPTION 'Deletion of committed prescriptions is prohibited (ID: %).', OLD.id;
        END IF;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_prescriptions_immutability ON prescriptions;
CREATE TRIGGER check_prescriptions_immutability
BEFORE UPDATE OR DELETE ON prescriptions
FOR EACH ROW EXECUTE FUNCTION trg_prescriptions_immutability();

-- 2. Immutability trigger for prescription medicines
CREATE OR REPLACE FUNCTION trg_prescription_medicines_immutability()
RETURNS TRIGGER AS $$
DECLARE
    v_status prescription_status;
BEGIN
    SELECT status INTO v_status FROM prescriptions WHERE id = OLD.prescription_id;
    IF (v_status IN ('COMMITTED', 'SUPERSEDED')) THEN
        RAISE EXCEPTION 'Prescription lines under committed prescriptions cannot be altered or deleted.';
    END IF;
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_prescription_medicines_immutability ON prescription_medicines;
CREATE TRIGGER check_prescription_medicines_immutability
BEFORE UPDATE OR DELETE ON prescription_medicines
FOR EACH ROW EXECUTE FUNCTION trg_prescription_medicines_immutability();

-- 3. Append-only enforcement for dispense_events
CREATE OR REPLACE FUNCTION trg_dispense_events_append_only()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Dispense events are append-only. Modification or deletion prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_dispense_events_append_only ON dispense_events;
CREATE TRIGGER check_dispense_events_append_only
BEFORE UPDATE OR DELETE ON dispense_events
FOR EACH ROW EXECUTE FUNCTION trg_dispense_events_append_only();

-- 4. Append-only enforcement for sticker_assignments (corrections insert a new version)
CREATE OR REPLACE FUNCTION trg_sticker_assignments_append_only()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Sticker assignments are append-only. Modification or deletion prohibited. Insert a new version instead.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_sticker_assignments_append_only ON sticker_assignments;
CREATE TRIGGER check_sticker_assignments_append_only
BEFORE UPDATE OR DELETE ON sticker_assignments
FOR EACH ROW EXECUTE FUNCTION trg_sticker_assignments_append_only();

-- 5. Append-only enforcement for audit_logs
CREATE OR REPLACE FUNCTION trg_audit_logs_append_only()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and tamper-evident. Modification or deletion prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_audit_logs_append_only ON audit_logs;
CREATE TRIGGER check_audit_logs_append_only
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION trg_audit_logs_append_only();

-- 6. Controlled Security-Definer Function to supersede a revision
CREATE OR REPLACE FUNCTION supersede_committed_prescription(
    p_prescription_id UUID,
    p_doctor_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE prescriptions
    SET status = 'SUPERSEDED'
    WHERE id = p_prescription_id
      AND status = 'COMMITTED';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Prescription % is not in COMMITTED status or does not exist.', p_prescription_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
