-- CuraLink Row-Level Security (RLS) & Scoped Privacy Views Migration 0003
-- Enforces least-privilege scoping: Pharmacy role has zero access to clinical notes or diagnoses.

-- 1. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE sticker_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispense_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper to extract user role from Supabase JWT
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN coalesce(
        auth.jwt() -> 'app_metadata' ->> 'role',
        auth.jwt() ->> 'role'
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Direct Table Policies for Prescriptions:
-- DOCTOR and ADMIN can read all clinical columns.
-- PHARMACY has NO direct SELECT permission on the prescriptions base table!
CREATE POLICY doctor_admin_prescriptions_select ON prescriptions
    FOR SELECT USING (current_user_role() IN ('DOCTOR', 'ADMIN', 'HOSPITAL'));

-- 3. Scoped View for Pharmacy Dispensing:
-- Exposes ONLY non-clinical operational fields required for dispensing.
CREATE OR REPLACE VIEW pharmacy_active_prescriptions AS
SELECT
    pr.id AS prescription_id,
    pr.patient_id,
    pt.full_name AS patient_display_name,
    (pt.literacy_status = 'ILLITERATE') AS requires_stickers,
    pt.preferred_language,
    pt.device_type,
    pr.doctor_id,
    pr.doctor_name,
    pr.hospital_id,
    pr.status,
    pr.revision,
    pr.parent_prescription_id,
    pr.committed_at
FROM prescriptions pr
JOIN patients pt ON pt.id = pr.patient_id
WHERE pr.status IN ('COMMITTED', 'SUPERSEDED');

-- Grant select on the view to authenticated users
GRANT SELECT ON pharmacy_active_prescriptions TO authenticated;

-- 4. Prescription Medicines Policies:
-- Accessible to PHARMACY, DOCTOR, HOSPITAL, ADMIN
CREATE POLICY pharmacy_medicines_select ON prescription_medicines
    FOR SELECT USING (current_user_role() IN ('PHARMACY', 'DOCTOR', 'HOSPITAL', 'ADMIN'));

-- 5. Sticker Assignments Policies:
-- PHARMACY can read and insert sticker assignments
CREATE POLICY pharmacy_stickers_all ON sticker_assignments
    FOR ALL USING (current_user_role() IN ('PHARMACY', 'DOCTOR', 'ADMIN'));

-- 6. Dispense Events Policies:
-- PHARMACY can read and insert dispense events
CREATE POLICY pharmacy_dispense_all ON dispense_events
    FOR ALL USING (current_user_role() IN ('PHARMACY', 'DOCTOR', 'ADMIN', 'HOSPITAL'));

-- 7. Inventory Policies:
-- PHARMACY and ADMIN can view and update inventory
CREATE POLICY pharmacy_inventory_all ON inventory_items
    FOR ALL USING (current_user_role() IN ('PHARMACY', 'ADMIN'));

-- 8. Audit Logs Policies:
-- Users can view their own audit logs; ADMIN can view all; insertion open to all authenticated services
CREATE POLICY audit_logs_insert ON audit_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY pharmacy_own_audit_select ON audit_logs
    FOR SELECT USING (
        current_user_role() = 'ADMIN' OR
        actor_id = auth.uid()
    );
