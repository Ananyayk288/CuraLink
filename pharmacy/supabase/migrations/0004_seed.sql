-- CuraLink Synthetic Data Seed Migration 0004

-- 1. Users
INSERT INTO users (id, role, full_name, phone_number, email, facility_id)
VALUES
    ('a0000001-0000-0000-0000-000000000001', 'PHARMACY', 'Rajiv Sharma, R.Ph', '+919876543210', 'rajiv.pharmacy@curalink.health', 'fac-city-general'),
    ('a0000001-0000-0000-0000-000000000002', 'DOCTOR', 'Dr. Amit Sen, MD', '+919876543211', 'dr.amit@curalink.health', 'fac-city-general'),
    ('a0000001-0000-0000-0000-000000000003', 'ADMIN', 'Systems Administrator', '+919876543212', 'admin@curalink.health', 'fac-city-general')
ON CONFLICT (id) DO NOTHING;

-- 2. Patients
INSERT INTO patients (id, full_name, literacy_status, preferred_language, device_type, phone_number, guardian_name, guardian_phone, emergency_contact, blood_group, allergies)
VALUES
    ('b0000001-0000-0000-0000-000000000001', 'Suresh Patil', 'ILLITERATE', 'hi-IN', 'FEATURE_PHONE', '+919876500001', 'Ramesh Patil (Son)', '+919876500002', '+919876500002', 'B+', ARRAY['Penicillin']),
    ('b0000001-0000-0000-0000-000000000002', 'Ananya Sharma', 'LITERATE', 'en-IN', 'SMARTPHONE', '+919876500003', 'Deepak Sharma', '+919876500004', '+919876500004', 'O+', ARRAY[]::TEXT[]),
    ('b0000001-0000-0000-0000-000000000003', 'Vikram Rao', 'ILLITERATE', 'kn-IN', 'FEATURE_PHONE', '+919876500005', 'Sunita Rao', '+919876500006', '+919876500006', 'A+', ARRAY['Sulfa drugs'])
ON CONFLICT (id) DO NOTHING;

-- 3. Prescriptions
INSERT INTO prescriptions (id, patient_id, doctor_id, doctor_name, hospital_id, status, revision, committed_at, diagnosis, consultation_notes)
VALUES
    ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', 'Dr. Amit Sen, MD', 'fac-city-general', 'COMMITTED', 1, '2026-10-10T09:30:00Z', 'Type 2 Diabetes with neuropathy', 'Fasting glucose elevated. Advised stickers.'),
    ('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'Dr. Amit Sen, MD', 'fac-city-general', 'COMMITTED', 1, '2026-10-11T11:00:00Z', 'Sinusitis', 'Antibiotic therapy.'),
    ('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000002', 'Dr. Amit Sen, MD', 'fac-city-general', 'COMMITTED', 2, '2026-10-12T16:00:00Z', 'Hypertension', 'Escalated dose.')
ON CONFLICT (id) DO NOTHING;

-- 4. Prescription Medicines
INSERT INTO prescription_medicines (id, prescription_id, medicine_name, dosage, frequency, duration)
VALUES
    ('d0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'Metformin 500mg', '500 mg', 'Twice daily after meals', '30 days'),
    ('d0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', 'Glimepiride 1mg', '1 mg', 'Once daily before breakfast', '30 days'),
    ('d0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000001', 'Atorvastatin 10mg', '10 mg', 'Once daily at night', '30 days'),
    ('d0000001-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000002', 'Amoxicillin 500mg', '500 mg', 'Three times daily', '7 days'),
    ('d0000001-0000-0000-0000-000000000006', 'c0000001-0000-0000-0000-000000000004', 'Amlodipine 10mg', '10 mg', 'Once daily in morning', '30 days')
ON CONFLICT (id) DO NOTHING;

-- 5. Inventory
INSERT INTO inventory_items (id, medicine_name, brand_or_generic, distributor_id, stock_quantity, low_stock_threshold, last_updated_at)
VALUES
    ('e0000001-0000-0000-0000-000000000001', 'Metformin 500mg', 'Glyciphage', 'dist-01', 120, 30, now() - INTERVAL '2 hours'),
    ('e0000001-0000-0000-0000-000000000002', 'Glimepiride 1mg', 'Amaryl', 'dist-01', 6, 20, now() - INTERVAL '30 hours'),
    ('e0000001-0000-0000-0000-000000000003', 'Atorvastatin 10mg', 'Atorva', 'dist-02', 45, 15, now() - INTERVAL '96 hours'),
    ('e0000001-0000-0000-0000-000000000004', 'Amoxicillin 500mg', 'Mox 500', 'dist-01', 80, 25, now() - INTERVAL '5 hours'),
    ('e0000001-0000-0000-0000-000000000005', 'Amlodipine 10mg', 'Norvasc', 'dist-02', 50, 15, now() - INTERVAL '10 hours'),
    ('e0000001-0000-0000-0000-000000000006', 'Paracetamol 650mg', 'Dolo 650', 'dist-01', 200, 50, now() - INTERVAL '1 hours')
ON CONFLICT (id) DO NOTHING;
