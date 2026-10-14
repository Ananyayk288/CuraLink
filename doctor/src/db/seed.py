"""
CURALINK — Extended Demo Seed Dataset
Includes rich demo patients, pending appointments queue, past prescription history,
and medication histories with physical color stickers and honest status adherence.
"""

import uuid
import datetime
import os
from src.db.database import get_connection, init_db, DB_FILE


def seed_data(db_path: str = DB_FILE, reset: bool = True):
    if reset and os.path.exists(db_path):
        os.remove(db_path)

    init_db(db_path)
    conn = get_connection(db_path)
    cursor = conn.cursor()

    now = datetime.datetime.now().isoformat()
    today_date = datetime.date.today().isoformat()
    yesterday = (datetime.datetime.now() - datetime.timedelta(days=1)).isoformat()
    two_days_ago = (datetime.datetime.now() - datetime.timedelta(days=2)).isoformat()
    one_month_ago = (datetime.datetime.now() - datetime.timedelta(days=30)).isoformat()

    doc_id = "doc-1"
    doc_name = "Dr. Suresh Sharma, MD"
    cursor.execute("""
    INSERT INTO users (id, role, full_name, phone_number, medical_license_no, department, created_at)
    VALUES (?, 'DOCTOR', ?, '+91 98450 11223', 'KMC-84920/MD', 'Internal Medicine & Chronic Care', ?)
    """, (doc_id, doc_name, now))

    pharm_id = "pharm-1"
    cursor.execute("""
    INSERT INTO users (id, role, full_name, phone_number, medical_license_no, department, created_at)
    VALUES (?, 'PHARMACY', 'Pooja Reddy (Chief Pharmacist)', '+91 98450 44556', 'KSPC-12044', 'Hospital Central Pharmacy', ?)
    """, (pharm_id, now))

    # -------------------------------------------------------------
    # DEMO PATIENT 1: Ramesh Gowda (Low Literacy, Kannada, Feature Phone)
    # -------------------------------------------------------------
    pt1_id = "pt-ramesh-001"
    cursor.execute("""
    INSERT INTO patients (
        id, patient_uhid, full_name, age, gender, phone_number,
        literacy_status, preferred_language, device_type,
        guardian_name, guardian_phone, guardian_consent,
        consecutive_missed_calls, dual_escalation_active, created_at
    ) VALUES (?, 'ARV-2026-001', 'Ramesh Gowda', 58, 'Male', '+91 98801 12345',
              'ILLITERATE', 'KANNADA', 'FEATURE_PHONE',
              'Manjunath Gowda (Son)', '+91 98801 54321', 1, 0, 0, ?)
    """, (pt1_id, one_month_ago))

    # Past Prescription v1
    rx1_id = "rx-ramesh-v1"
    cursor.execute("""
    INSERT INTO prescriptions (
        id, patient_id, doctor_id, doctor_name, revision_number, status,
        prescription_type, diagnosis_notes, symptoms_notes, word_count, clinical_instructions,
        follow_up_date, follow_up_notes, telephony_trigger_enabled, telephony_triggered_at, committed_at, created_at
    ) VALUES (?, ?, ?, ?, 1, 'COMMITTED',
              'COMPREHENSIVE', 'Type 2 Diabetes Mellitus with early diabetic neuropathy.',
              'Patient reported excessive thirst (polydipsia), fatigue in the afternoons, and mild numbness in feet. Fasting blood sugar 192 mg/dL.',
              24, 'Take after breakfast and dinner. Avoid barefoot walking. Follow-up in 30 days.',
              ?, 'Review HbA1c and Serum Creatinine lab reports to titrate Metformin', 1, ?, ?, ?)
    """, (rx1_id, pt1_id, doc_id, doc_name, today_date, one_month_ago, one_month_ago, one_month_ago))

    med1_id = "med-metformin-001"
    cursor.execute("""
    INSERT INTO prescription_medicines (
        id, prescription_id, medicine_name, dosage, frequency,
        duration_days, no_of_days, meal_relation, instructions, color_sticker, symbol, dispense_status, dispensed_at
    ) VALUES (?, ?, 'Metformin Hydrochloride', '500mg', '1-0-1 (Twice Daily)',
              30, 30, 'After Food', 'Take with warm water after food', 'RED', 'CIRCLE', 'DISPENSED', ?)
    """, (med1_id, rx1_id, one_month_ago))

    # Diagnostic orders for Ramesh Gowda
    cursor.execute("""
    INSERT INTO prescription_diagnostics (id, prescription_id, test_type, test_name, instructions, status, created_at)
    VALUES (?, ?, 'LAB_TEST', 'HbA1c (Glycated Hemoglobin)', 'Fasting 8-10 hours required. Morning sample.', 'PENDING', ?)
    """, (str(uuid.uuid4()), rx1_id, one_month_ago))
    cursor.execute("""
    INSERT INTO prescription_diagnostics (id, prescription_id, test_type, test_name, instructions, status, created_at)
    VALUES (?, ?, 'LAB_TEST', 'Kidney Function Test (KFT / Serum Creatinine)', 'Fasting blood & morning urine sample.', 'PENDING', ?)
    """, (str(uuid.uuid4()), rx1_id, one_month_ago))

    # Pending Appointment for Ramesh Gowda
    cursor.execute("""
    INSERT INTO appointments (id, patient_id, doctor_id, token_number, reason_for_visit, appointment_time, booking_channel, status, created_at)
    VALUES (?, ?, ?, 'TOKEN-01', 'Monthly Diabetes & Neuropathy Follow-up Checkup', 'Today • 09:30 AM', 'CLINIC_DESK', 'PENDING', ?)
    """, (str(uuid.uuid4()), pt1_id, doc_id, now))

    # Adherence logs for Patient 1
    cursor.execute("""
    INSERT INTO adherence_logs (id, patient_id, medicine_id, scheduled_time, status, response_mode, provider_outcome, attempt_count, recorded_at)
    VALUES (?, ?, ?, ?, 'TAKEN_REPORTED', 'DTMF_1', 'ANSWERED', 1, ?)
    """, (str(uuid.uuid4()), pt1_id, med1_id, yesterday, yesterday))

    # -------------------------------------------------------------
    # DEMO PATIENT 2: Savitha Devi (Low Literacy, Active Dual Escalation)
    # -------------------------------------------------------------
    pt2_id = "pt-savitha-002"
    cursor.execute("""
    INSERT INTO patients (
        id, patient_uhid, full_name, age, gender, phone_number,
        literacy_status, preferred_language, device_type,
        guardian_name, guardian_phone, guardian_consent,
        consecutive_missed_calls, dual_escalation_active, created_at
    ) VALUES (?, 'ARV-2026-002', 'Savitha Devi', 62, 'Female', '+91 94481 67890',
              'ILLITERATE', 'KANNADA', 'FEATURE_PHONE',
              'Kavitha (Daughter)', '+91 94481 99887', 1, 3, 1, ?)
    """, (pt2_id, two_days_ago))

    rx2_id = "rx-savitha-v1"
    cursor.execute("""
    INSERT INTO prescriptions (
        id, patient_id, doctor_id, doctor_name, revision_number, status,
        prescription_type, diagnosis_notes, symptoms_notes, word_count, clinical_instructions,
        follow_up_date, follow_up_notes, telephony_trigger_enabled, telephony_triggered_at, committed_at, created_at
    ) VALUES (?, ?, ?, ?, 1, 'COMMITTED',
              'COMPREHENSIVE', 'Essential Hypertension Stage II. Requires strict adherence monitoring.',
              'Patient complained of morning occipital headaches and mild dizziness on standing up quickly. Resting BP 164/98 mmHg.',
              20, 'Take 1 tablet every morning at 8:00 AM without fail.',
              ?, 'Review 12-Lead ECG and 2D ECHO scan reports', 1, ?, ?, ?)
    """, (rx2_id, pt2_id, doc_id, doc_name, today_date, two_days_ago, two_days_ago, two_days_ago))

    med2_id = "med-amlodipine-002"
    cursor.execute("""
    INSERT INTO prescription_medicines (
        id, prescription_id, medicine_name, dosage, frequency,
        duration_days, no_of_days, meal_relation, instructions, color_sticker, symbol, dispense_status, dispensed_at
    ) VALUES (?, ?, 'Amlodipine Besylate', '5mg', '1-0-0 (Morning)',
              30, 30, 'After Food', 'Take in the morning with water', 'RED', 'CIRCLE', 'DISPENSED', ?)
    """, (med2_id, rx2_id, two_days_ago))

    # Diagnostic orders for Savitha Devi
    cursor.execute("""
    INSERT INTO prescription_diagnostics (id, prescription_id, test_type, test_name, instructions, status, created_at)
    VALUES (?, ?, 'SCAN', '12-Lead Electrocardiogram (ECG)', 'Resting 12-lead ECG in supine position.', 'PENDING', ?)
    """, (str(uuid.uuid4()), rx2_id, two_days_ago))
    cursor.execute("""
    INSERT INTO prescription_diagnostics (id, prescription_id, test_type, test_name, instructions, status, created_at)
    VALUES (?, ?, 'SCAN', '2D Echocardiography (ECHO)', 'Assess left ventricular hypertrophy and EF.', 'PENDING', ?)
    """, (str(uuid.uuid4()), rx2_id, two_days_ago))

    # Pending Appointment for Savitha Devi
    cursor.execute("""
    INSERT INTO appointments (id, patient_id, doctor_id, token_number, reason_for_visit, appointment_time, booking_channel, status, created_at)
    VALUES (?, ?, ?, 'TOKEN-02', 'Urgent Clinical Review after 3 Unanswered Calls Alert', 'Today • 10:00 AM', 'CLINIC_DESK', 'PENDING', ?)
    """, (str(uuid.uuid4()), pt2_id, doc_id, now))

    # -------------------------------------------------------------
    # DEMO PATIENT 3: Anand Kumar (Literate, Smartphone, English)
    # -------------------------------------------------------------
    pt3_id = "pt-anand-003"
    cursor.execute("""
    INSERT INTO patients (
        id, patient_uhid, full_name, age, gender, phone_number,
        literacy_status, preferred_language, device_type,
        guardian_name, guardian_phone, guardian_consent,
        consecutive_missed_calls, dual_escalation_active, created_at
    ) VALUES (?, 'ARV-2026-003', 'Anand Kumar', 45, 'Male', '+91 99001 98765',
              'LITERATE', 'ENGLISH', 'SMARTPHONE',
              NULL, NULL, 0, 0, 0, ?)
    """, (pt3_id, yesterday))

    rx3_id = "rx-anand-v1"
    cursor.execute("""
    INSERT INTO prescriptions (
        id, patient_id, doctor_id, doctor_name, revision_number, status,
        prescription_type, diagnosis_notes, symptoms_notes, word_count, clinical_instructions,
        follow_up_date, follow_up_notes, telephony_trigger_enabled, telephony_triggered_at, committed_at, created_at
    ) VALUES (?, ?, ?, ?, 1, 'COMMITTED',
              'COMPREHENSIVE', 'New onset Type 2 Diabetes Mellitus with Dyslipidemia.',
              'Asymptomatic routine corporate health checkup detected HbA1c 7.9% and elevated LDL (148 mg/dL). Denies chest pain or breathlessness.',
              21, 'Dietary carbohydrate restriction and 30 minutes daily walking.',
              ?, 'Review Fasting Lipid Profile panel and dietary progress', 1, ?, ?, ?)
    """, (rx3_id, pt3_id, doc_id, doc_name, today_date, yesterday, yesterday, yesterday))

    med3_id = "med-glucophage-003"
    cursor.execute("""
    INSERT INTO prescription_medicines (
        id, prescription_id, medicine_name, dosage, frequency,
        duration_days, no_of_days, meal_relation, instructions, color_sticker, symbol, dispense_status, dispensed_at
    ) VALUES (?, ?, 'Glucophage (Brand)', '500mg', '1-0-1 (Twice Daily)',
              30, 30, 'After Food', 'Take with meals', 'BLUE', 'TRIANGLE', 'PENDING', NULL)
    """, (med3_id, rx3_id))

    cursor.execute("""
    INSERT INTO prescription_diagnostics (id, prescription_id, test_type, test_name, instructions, status, created_at)
    VALUES (?, ?, 'LAB_TEST', 'Lipid Profile (Full Panel)', '12-hour strict overnight fasting.', 'PENDING', ?)
    """, (str(uuid.uuid4()), rx3_id, yesterday))

    # Pending Appointment for Anand Kumar
    cursor.execute("""
    INSERT INTO appointments (id, patient_id, doctor_id, token_number, reason_for_visit, appointment_time, booking_channel, status, created_at)
    VALUES (?, ?, ?, 'TOKEN-03', 'Pharmacy Generic Substitution Confirmation & Diet Plan', 'Today • 10:30 AM', 'ONLINE_SMARTPHONE', 'PENDING', ?)
    """, (str(uuid.uuid4()), pt3_id, doc_id, now))

    # -------------------------------------------------------------
    # DEMO PATIENT 4: Gangamma Basappa (Low Literacy, Kannada, Feature Phone)
    # -------------------------------------------------------------
    pt4_id = "pt-gangamma-004"
    cursor.execute("""
    INSERT INTO patients (
        id, patient_uhid, full_name, age, gender, phone_number,
        literacy_status, preferred_language, device_type,
        guardian_name, guardian_phone, guardian_consent,
        consecutive_missed_calls, dual_escalation_active, created_at
    ) VALUES (?, 'ARV-2026-004', 'Gangamma Basappa', 67, 'Female', '+91 97410 45678',
              'ILLITERATE', 'KANNADA', 'FEATURE_PHONE',
              'Basavaraj (Husband)', '+91 97410 87654', 1, 0, 0, ?)
    """, (pt4_id, one_month_ago))

    # Pending Appointment for Gangamma Basappa
    cursor.execute("""
    INSERT INTO appointments (id, patient_id, doctor_id, token_number, reason_for_visit, appointment_time, booking_channel, status, created_at)
    VALUES (?, ?, ?, 'TOKEN-04', 'Bilateral Knee Osteoarthritis Pain & Gastric Acidity Evaluation', 'Today • 11:15 AM', 'INBOUND_IVR', 'PENDING', ?)
    """, (str(uuid.uuid4()), pt4_id, doc_id, now))

    # -------------------------------------------------------------
    # DEMO PATIENT 5: Mohammad Rafiq (Literate, Hindi, Feature Phone)
    # -------------------------------------------------------------
    pt5_id = "pt-rafiq-005"
    cursor.execute("""
    INSERT INTO patients (
        id, patient_uhid, full_name, age, gender, phone_number,
        literacy_status, preferred_language, device_type,
        guardian_name, guardian_phone, guardian_consent,
        consecutive_missed_calls, dual_escalation_active, created_at
    ) VALUES (?, 'ARV-2026-005', 'Mohammad Rafiq', 52, 'Male', '+91 98200 65432',
              'LITERATE', 'HINDI', 'FEATURE_PHONE',
              'Zarina Begum (Wife)', '+91 98200 98765', 1, 0, 0, ?)
    """, (pt5_id, one_month_ago))

    # Pending Appointment for Mohammad Rafiq
    cursor.execute("""
    INSERT INTO appointments (id, patient_id, doctor_id, token_number, reason_for_visit, appointment_time, booking_channel, status, created_at)
    VALUES (?, ?, ?, 'TOKEN-05', 'Post-Stent Follow-up & Antiplatelet Therapy Refill', 'Today • 11:45 AM', 'CLINIC_DESK', 'PENDING', ?)
    """, (str(uuid.uuid4()), pt5_id, doc_id, now))

    # -------------------------------------------------------------
    # DEMO PATIENTS 6, 7, 8: Additional directory patients
    # -------------------------------------------------------------
    cursor.execute("""
    INSERT INTO patients (
        id, patient_uhid, full_name, age, gender, phone_number,
        literacy_status, preferred_language, device_type,
        guardian_name, guardian_phone, guardian_consent,
        consecutive_missed_calls, dual_escalation_active, created_at
    ) VALUES
    ('pt-lakshmi-006', 'ARV-2026-006', 'Lakshmi Venkatesh', 39, 'Female', '+91 98490 23456', 'LITERATE', 'TELUGU', 'SMARTPHONE', 'Venkatesh Rao (Spouse)', '+91 98490 65432', 1, 0, 0, ?),
    ('pt-murugan-007', 'ARV-2026-007', 'Murugan Selvam', 61, 'Male', '+91 94440 34567', 'ILLITERATE', 'TAMIL', 'FEATURE_PHONE', 'Karthik (Son)', '+91 94440 76543', 1, 0, 0, ?),
    ('pt-shanta-008', 'ARV-2026-008', 'Shanta Bai', 70, 'Female', '+91 98220 45678', 'ILLITERATE', 'MARATHI', 'FEATURE_PHONE', 'Ashok (Son)', '+91 98220 87654', 1, 0, 0, ?)
    """, (one_month_ago, one_month_ago, one_month_ago))

    # Care Tasks (AI Call Extract from Ramesh Gowda)
    cursor.execute("""
    INSERT INTO care_tasks (
        id, patient_id, prescription_id, source_type, title, raw_transcript,
        ai_extracted_summary, priority, status, created_at
    ) VALUES (?, ?, ?, 'AI_CALL_EXTRACT',
              'Patient reported gastric discomfort after morning dose',
              'ಧ್ವನಿ ಕರೆ: "ಡಾಕ್ಟರ್ ಸಾಹೇಬ್ರೇ, ಕೆಂಪು ಬಣ್ಣದ ಮಾತ್ರೆ ತಗೊಂಡ್ಮೇಲೆ ಹೊಟ್ಟೆ ಉರೀತಿದೆ."',
              'Symptom: Gastric burning / acidity. Urgency: HIGH. Candidate Action: Add supportive antacid (Pantoprazole 40mg OD) or adjust dose timing.',
              'HIGH', 'PROPOSED', ?)
    """, (str(uuid.uuid4()), pt1_id, rx1_id, now))

    # Dual Escalation Task for Savitha Devi
    cursor.execute("""
    INSERT INTO care_tasks (
        id, patient_id, source_type, title, raw_transcript,
        ai_extracted_summary, priority, status, created_at
    ) VALUES (?, ?, 'DUAL_ESCALATION',
              'CRITICAL ALERT: 3 consecutive reminder calls unanswered for Savitha Devi',
              'Telephony worker: Bounded 3-attempt cycle completed without patient response.',
              'Threshold Exceeded: Patient has missed 3 consecutive scheduled contacts. Simultaneous alert sent to Dr. Suresh Sharma and Hospital Care Coordinator desk. Immediate caregiver or home health outreach required.',
              'CRITICAL', 'PROPOSED', ?)
    """, (str(uuid.uuid4()), pt2_id, now))

    # Pharmacy Substitution Proposal for Anand Kumar
    cursor.execute("""
    INSERT INTO substitution_proposals (
        id, prescription_id, medicine_id, pharmacist_id,
        original_medicine_name, proposed_medicine_name, reason_for_substitution,
        status, created_at
    ) VALUES (?, ?, ?, ?, 'Glucophage 500mg (Brand)', 'Glycomet 500mg (Generic Metformin Hydrochloride)',
              'Glucophage brand out of stock across hospital central depot. Glycomet is bioequivalent CDSCO approved batch with identical pharmacokinetics.',
              'PENDING', ?)
    """, (str(uuid.uuid4()), rx3_id, med3_id, pharm_id, now))

    conn.commit()
    conn.close()
    print("Extended seed data successfully populated:")
    print("  - 8 diverse demo patients across chronic conditions, languages, and literacy levels.")
    print("  - 5 pending appointments queue in Command Center with Token numbers.")
    print("  - Past prescription & medication histories with doctor attribution.")


if __name__ == "__main__":
    seed_data()
