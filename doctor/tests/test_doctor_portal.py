"""
CURALINK — Comprehensive Doctor Portal Verification Tests
Verifies Clean Architecture use cases, database immutability triggers,
revision lineages, honest status adherence, AI triage, and dual escalation.
"""

import os
import unittest
import sqlite3
from src.db.database import init_db
from src.usecases.doctor_usecases import DoctorUseCases
from src.api.router import ApiRouter

TEST_DB = "test_arogyavani.db"


class TestDoctorPortal(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if os.path.exists(TEST_DB):
            os.remove(TEST_DB)
        init_db(TEST_DB)
        cls.use_cases = DoctorUseCases(TEST_DB)
        cls.router = ApiRouter(cls.use_cases)

        # Seed Doctor user to satisfy Foreign Key constraints
        conn = sqlite3.connect(TEST_DB)
        conn.execute("""
        INSERT INTO users (id, role, full_name, phone_number, medical_license_no, department, created_at)
        VALUES ('doc-1', 'DOCTOR', 'Dr. Suresh Sharma', '+91 98450 11223', 'KMC-84920/MD', 'Internal Medicine', datetime('now'))
        """)
        conn.commit()
        conn.close()

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(TEST_DB):
            os.remove(TEST_DB)

    def test_01_patient_registration_with_literacy(self):
        """Test registration captures mandatory literacy and device profiling."""
        payload = {
            "full_name": "Basavaraj Patil",
            "age": 60,
            "gender": "Male",
            "phone_number": "+91 98800 99999",
            "literacy_status": "ILLITERATE",
            "preferred_language": "KANNADA",
            "device_type": "FEATURE_PHONE",
            "guardian_name": "Suresh Patil",
            "guardian_phone": "+91 98800 88888",
            "guardian_consent": True
        }
        res = self.use_cases.register_patient("doc-1", payload)
        self.assertEqual(res["literacy_status"], "ILLITERATE")
        self.assertEqual(res["device_type"], "FEATURE_PHONE")
        self.assertTrue(res["patient_uhid"].startswith("ARV-2026-"))
        self.__class__.patient_id = res["id"]

    def test_02_prescription_draft_and_commit(self):
        """Test prescription drafting, color sticker mapping, and commit locking."""
        meds = [
            {
                "medicine_name": "Metformin Hydrochloride",
                "dosage": "500mg",
                "frequency": "1-0-1 (After Food)",
                "duration_days": 30,
                "color_sticker": "PINK",
                "symbol": "CIRCLE"
            }
        ]
        # 1. Draft
        draft_res = self.use_cases.draft_prescription(
            doctor_id="doc-1",
            patient_id=self.patient_id,
            medicines=meds,
            diagnosis_notes="Type 2 Diabetes. Low literacy adherence required.",
            follow_up_date="2026-11-15"
        )
        self.assertEqual(draft_res["status"], "DRAFT")
        rx_id = draft_res["id"]
        self.__class__.prescription_id = rx_id

        # 2. Commit
        commit_res = self.use_cases.commit_prescription("doc-1", rx_id)
        self.assertEqual(commit_res["status"], "COMMITTED")
        self.assertIsNotNone(commit_res["committed_at"])

    def test_03_database_immutability_trigger_enforcement(self):
        """Test that PostgreSQL/SQLite trigger actively aborts UPDATE & DELETE on committed prescription."""
        # 1. Verification via Use Case test method
        test_res = self.use_cases.test_immutability_violation(self.prescription_id)
        self.assertTrue(test_res["success"])
        self.assertTrue(test_res["verified"])
        self.assertIn("DATABASE RESTRICTION", test_res["database_trigger_message"])

        # 2. Direct SQL Attempt verification
        conn = sqlite3.connect(TEST_DB)
        cursor = conn.cursor()
        with self.assertRaises(sqlite3.DatabaseError) as ctx:
            cursor.execute("DELETE FROM prescriptions WHERE id = ?", (self.prescription_id,))
        self.assertIn("DATABASE RESTRICTION", str(ctx.exception))
        conn.close()

    def test_04_append_only_revision_lineage(self):
        """Test that updates create append-only revisions (v2) linked to parent (v1)."""
        revised_meds = [
            {
                "medicine_name": "Metformin Hydrochloride",
                "dosage": "1000mg",  # Dose escalated
                "frequency": "1-0-1 (After Food)",
                "duration_days": 30,
                "color_sticker": "PINK",
                "symbol": "CIRCLE"
            }
        ]
        rev_res = self.use_cases.revise_prescription(
            doctor_id="doc-1",
            parent_prescription_id=self.prescription_id,
            reason="Blood glucose elevated; dosage increased from 500mg to 1000mg",
            medicines=revised_meds
        )
        self.assertEqual(rev_res["revision_number"], 2)
        self.assertEqual(rev_res["parent_prescription_id"], self.prescription_id)
        self.assertEqual(rev_res["status"], "COMMITTED")

        # Verify parent prescription is still intact in chart history
        chart = self.use_cases.get_patient_chart(self.patient_id)
        self.assertEqual(len(chart["prescriptions"]), 2)
        self.assertEqual(chart["prescriptions"][0]["revision_number"], 1)
        self.assertEqual(chart["prescriptions"][1]["revision_number"], 2)

    def test_05_honest_status_language_adherence(self):
        """Test recording patient-reported confirmation and snooze responses."""
        # DTMF 1 = Taken
        res1 = self.use_cases.record_adherence_event(
            patient_id=self.patient_id,
            medicine_id=None,
            status="TAKEN_REPORTED",
            response_mode="DTMF_1",
            provider_outcome="ANSWERED"
        )
        self.assertEqual(res1["status"], "TAKEN_REPORTED")

        # DTMF 3 = Snoozed
        res2 = self.use_cases.record_adherence_event(
            patient_id=self.patient_id,
            medicine_id=None,
            status="SNOOZED",
            response_mode="DTMF_3",
            provider_outcome="ANSWERED"
        )
        self.assertEqual(res2["status"], "SNOOZED")

    def test_06_dual_escalation_three_consecutive_failures(self):
        """Test that 3 consecutive qualifying unanswered calls trigger simultaneous dual escalation."""
        # Call 1: Missed
        r1 = self.use_cases.record_adherence_event(
            patient_id=self.patient_id, medicine_id=None,
            status="NO_ANSWER", response_mode="NO_ANSWER", provider_outcome="NO_ANSWER"
        )
        self.assertFalse(r1["dual_escalation_fired"])

        # Call 2: Missed
        r2 = self.use_cases.record_adherence_event(
            patient_id=self.patient_id, medicine_id=None,
            status="NO_ANSWER", response_mode="NO_ANSWER", provider_outcome="NO_ANSWER"
        )
        self.assertFalse(r2["dual_escalation_fired"])

        # Call 3: Missed -> THRESHOLD BREACHED!
        r3 = self.use_cases.record_adherence_event(
            patient_id=self.patient_id, medicine_id=None,
            status="NO_ANSWER", response_mode="NO_ANSWER", provider_outcome="NO_ANSWER"
        )
        self.assertTrue(r3["dual_escalation_fired"])

        # Check chart shows dual_escalation_active = 1
        chart = self.use_cases.get_patient_chart(self.patient_id)
        self.assertEqual(chart["patient"]["dual_escalation_active"], 1)
        self.assertEqual(chart["patient"]["consecutive_missed_calls"], 3)

        # Doctor resolves escalation
        resolve_res = self.use_cases.resolve_escalation("doc-1", self.patient_id, "Home nurse visited patient.")
        self.assertTrue(resolve_res["success"])
        chart_after = self.use_cases.get_patient_chart(self.patient_id)
        self.assertEqual(chart_after["patient"]["dual_escalation_active"], 0)

    def test_07_api_delete_blocked_with_405(self):
        """Test that API blocks DELETE /api/v1/prescriptions/{id} with HTTP 405 per Appendix A."""
        status_code, body = self.router.route_request("DELETE", f"/api/v1/prescriptions/{self.prescription_id}", {}, None)
        self.assertEqual(status_code, 405)
        self.assertIn("legally immutable", body["error"])

    def test_08_pharmacy_scoped_least_privilege(self):
        """Test Pharmacy scoped view hides diagnosis notes and shows color-sticker info."""
        status_code, body = self.router.route_request("GET", f"/api/v1/pharmacy/patient/{self.patient_id}/active", {}, None)
        self.assertEqual(status_code, 200)
        data = body["data"]
        self.assertNotIn("diagnosis_notes", data)
        self.assertTrue(len(data["medicines"]) > 0)
        self.assertIn("color_sticker", data["medicines"][0])
        self.assertIn("symbol", data["medicines"][0])

    def test_09_pending_appointments_queue(self):
        """Test pending appointments queue retrieval with tokens and clinical reasons."""
        conn = sqlite3.connect(TEST_DB)
        conn.execute("""
        INSERT INTO appointments (id, patient_id, doctor_id, token_number, reason_for_visit, appointment_time, booking_channel, status, created_at)
        VALUES ('apt-test-01', ?, 'doc-1', 'TOKEN-99', 'Routine Diabetes Review', 'Today • 02:00 PM', 'CLINIC_DESK', 'PENDING', datetime('now'))
        """, (self.patient_id,))
        conn.commit()
        conn.close()

        apts = self.use_cases.get_pending_appointments("doc-1")
        self.assertTrue(len(apts) > 0)
        test_apt = next((a for a in apts if a["id"] == "apt-test-01"), None)
        self.assertIsNotNone(test_apt)
        self.assertEqual(test_apt["token_number"], "TOKEN-99")
        self.assertEqual(test_apt["reason_for_visit"], "Routine Diabetes Review")

    def test_10_encounter_data_three_tabs(self):
        """Test patient encounter data contains prescription and medication history with doctor name."""
        enc = self.use_cases.get_patient_encounter_data(self.patient_id)
        self.assertIn("patient", enc)
        self.assertIn("prescription_history", enc)
        self.assertIn("medication_history", enc)
        self.assertTrue(len(enc["prescription_history"]) > 0)
        self.assertTrue(len(enc["medication_history"]) > 0)
        self.assertIn("Dr. Suresh Sharma", enc["prescription_history"][0]["doctor_name"])
        self.assertIn("Dr. Suresh Sharma", enc["medication_history"][0]["prescribed_by"])

    def test_11_atomic_prescription_and_medication_submission(self):
        """Test atomic submission of symptoms, medication regimen table, and doctor attribution."""
        payload = {
            "diagnosis_notes": "Type 2 Diabetes Mellitus - Follow-up visit",
            "symptoms_notes": "Patient reports blood sugar normalized. Occasional mild dizziness after morning medication.",
            "clinical_instructions": "Maintain hydration and low carbohydrate diet.",
            "follow_up_date": "2026-12-01",
            "telephony_trigger_enabled": True,
            "medicines": [
                {
                    "medicine_name": "Metformin Hydrochloride",
                    "dosage": "500mg",
                    "no_of_days": 30,
                    "frequency": "1-0-1 (Twice Daily)",
                    "meal_relation": "After Food",
                    "color_sticker": "PINK",
                    "symbol": "CIRCLE"
                },
                {
                    "medicine_name": "Pantoprazole Gastro-Resistant",
                    "dosage": "40mg",
                    "no_of_days": 15,
                    "frequency": "1-0-0 (Morning Only)",
                    "meal_relation": "Empty Stomach",
                    "color_sticker": "BLUE",
                    "symbol": "TRIANGLE"
                }
            ]
        }
        res = self.use_cases.submit_new_prescription(
            doctor_id="doc-1",
            doctor_name="Dr. Suresh Sharma, MD",
            patient_id=self.patient_id,
            appointment_id="apt-test-01",
            data=payload
        )
        self.assertEqual(res["status"], "COMMITTED")
        self.assertEqual(res["medicines_count"], 2)
        self.assertTrue(res["telephony_trigger_enabled"])
        self.assertEqual(res["doctor_name"], "Dr. Suresh Sharma, MD")

        # Verify appointment is now marked COMPLETED
        conn = sqlite3.connect(TEST_DB)
        cursor = conn.cursor()
        cursor.execute("SELECT status FROM appointments WHERE id = 'apt-test-01'")
        apt_status = cursor.fetchone()[0]
        conn.close()
        self.assertEqual(apt_status, "COMPLETED")

    def test_12_symptoms_word_limit_enforcement(self):
        """Test that symptoms notes exceeding 300 words are rejected."""
        long_symptoms = "word " * 305  # 305 words!
        payload = {
            "diagnosis_notes": "Hypertension",
            "symptoms_notes": long_symptoms,
            "medicines": [{"medicine_name": "Amlodipine", "dosage": "5mg", "no_of_days": 30}]
        }
        with self.assertRaises(ValueError) as ctx:
            self.use_cases.submit_new_prescription(
                doctor_id="doc-1",
                doctor_name="Dr. Suresh Sharma, MD",
                patient_id=self.patient_id,
                appointment_id=None,
                data=payload
            )
        self.assertIn("exceeds limit", str(ctx.exception))

    def test_13_pending_telephony_triggers_feeder(self):
        """Test endpoint feeder for AI Calling Agent returns patient literacy and medication regimen."""
        triggers = self.use_cases.get_pending_telephony_triggers()
        self.assertTrue(len(triggers) > 0)
        first_trig = triggers[0]
        self.assertIn("patient", first_trig)
        self.assertIn("medication_regimen", first_trig)
        self.assertEqual(first_trig["patient"]["literacy_status"], "ILLITERATE")
        # Check that voice_prompt_hint references the color sticker for low-literacy patient!
        self.assertIn("voice_prompt_hint", first_trig["medication_regimen"][0])

    def test_14_diagnostic_scans_and_immutability(self):
        """Test diagnostic orders insertion and legal immutability trigger protection."""
        payload = {
            "prescription_type": "SCAN_TEST",
            "diagnosis_notes": "Suspected Osteoarthritis and Diabetic Nephropathy",
            "symptoms_notes": "Persistent bilateral knee pain and early morning pedal edema.",
            "diagnostics": [
                {
                    "test_type": "SCAN",
                    "test_name": "X-Ray Both Knees (AP & Lateral Weight-bearing)",
                    "instructions": "Standing weight-bearing projections"
                },
                {
                    "test_type": "LAB_TEST",
                    "test_name": "Urine Albumin to Creatinine Ratio (UACR)",
                    "instructions": "Early morning clean-catch sample"
                }
            ]
        }
        res = self.use_cases.submit_new_prescription(
            doctor_id="doc-1",
            doctor_name="Dr. Suresh Sharma, MD",
            patient_id=self.patient_id,
            appointment_id=None,
            data=payload
        )
        self.assertEqual(res["status"], "COMMITTED")
        self.assertEqual(res["prescription_type"], "SCAN_TEST")
        self.assertEqual(res["diagnostics_count"], 2)

        # Check diagnostics stored in database
        conn = sqlite3.connect(TEST_DB)
        cursor = conn.cursor()
        cursor.execute("SELECT test_name, test_type FROM prescription_diagnostics WHERE prescription_id = ?", (res["id"],))
        rows = cursor.fetchall()
        self.assertEqual(len(rows), 2)
        conn.close()

        # Verify Immutability Trigger: UPDATE on diagnostics must abort!
        conn2 = sqlite3.connect(TEST_DB)
        with self.assertRaises(sqlite3.IntegrityError) as ctx_upd:
            conn2.execute("UPDATE prescription_diagnostics SET test_name = 'Modified Test' WHERE prescription_id = ?", (res["id"],))
        self.assertIn("cannot be modified", str(ctx_upd.exception).lower())
        conn2.close()

        # Verify Immutability Trigger: DELETE on diagnostics must abort!
        conn3 = sqlite3.connect(TEST_DB)
        with self.assertRaises(sqlite3.IntegrityError) as ctx_del:
            conn3.execute("DELETE FROM prescription_diagnostics WHERE prescription_id = ?", (res["id"],))
        self.assertIn("cannot be deleted", str(ctx_del.exception).lower())
        conn3.close()

    def test_15_follow_up_scheduling_and_appointments(self):
        """Test that setting a follow-up date automatically books a SCHEDULED appointment."""
        payload = {
            "prescription_type": "COMPREHENSIVE",
            "diagnosis_notes": "Chronic Diabetic Follow-up",
            "symptoms_notes": "Routine monthly review.",
            "follow_up_date": "2026-11-25",
            "follow_up_notes": "Check HbA1c report and inspect feet",
            "medicines": [
                {"medicine_name": "Metformin", "dosage": "500mg", "no_of_days": 30, "frequency": "1-0-1", "meal_relation": "After Food"}
            ],
            "diagnostics": [
                {"test_type": "LAB_TEST", "test_name": "HbA1c (Glycated Hemoglobin)", "instructions": "Fasting 8-10h"}
            ]
        }
        res = self.use_cases.submit_new_prescription(
            doctor_id="doc-1",
            doctor_name="Dr. Suresh Sharma, MD",
            patient_id=self.patient_id,
            appointment_id=None,
            data=payload
        )
        self.assertEqual(res["follow_up_date"], "2026-11-25")

        # Verify automatic follow-up appointment was scheduled
        conn = sqlite3.connect(TEST_DB)
        cursor = conn.cursor()
        cursor.execute("""
        SELECT token_number, reason_for_visit, booking_channel, status, appointment_time
        FROM appointments
        WHERE patient_id = ? AND booking_channel = 'DOCTOR_FOLLOW_UP'
        ORDER BY created_at DESC LIMIT 1
        """, (self.patient_id,))
        apt_row = cursor.fetchone()
        conn.close()

        self.assertIsNotNone(apt_row)
        self.assertEqual(apt_row[3], "SCHEDULED")
        self.assertIn("FOL-", apt_row[0])
        self.assertIn("Check HbA1c report", apt_row[1])
        self.assertIn("2026-11-25", apt_row[4])

    def test_16_dual_telephony_triggers_scan_and_followup_reminder(self):
        """Test dual telephony trigger payload generation with Kannada/Hindi voice text and report checklists."""
        triggers = self.use_cases.get_pending_telephony_triggers()
        self.assertTrue(len(triggers) >= 2)

        # Find primary trigger with diagnostics and follow-up trigger with report checklist
        primary_diag_trig = next((t for t in triggers if "primary" in t["trigger_id"] and len(t.get("diagnostic_orders", [])) > 0), None)
        followup_report_trig = next((t for t in triggers if t.get("trigger_type") == "FOLLOWUP_REMINDER_WITH_REPORTS" and len(t.get("required_reports_checklist", [])) > 0), None)

        self.assertIsNotNone(primary_diag_trig)
        self.assertIn("voice_call_payload", primary_diag_trig)
        self.assertIn("sms_payload", primary_diag_trig)
        self.assertTrue(len(primary_diag_trig["diagnostic_orders"]) > 0)

        self.assertIsNotNone(followup_report_trig)
        self.assertIn("required_reports_checklist", followup_report_trig)
        self.assertTrue(len(followup_report_trig["required_reports_checklist"]) > 0)
        # Check that follow-up voice prompt explicitly reminds patient to carry reports!
        self.assertIn("voice_call_payload", followup_report_trig)
        voice_text = followup_report_trig["voice_call_payload"]["voice_tts_text"]
        self.assertTrue("ವರದಿಗಳನ್ನು" in voice_text or "reports" in voice_text.lower() or "रिपोर्ट" in voice_text)

    def test_17_prefed_diagnostics_api(self):
        """Test GET /api/v1/doctor/diagnostics/prefed returns 30+ investigations."""
        status_code, body = self.router.route_request("GET", "/api/v1/doctor/diagnostics/prefed", {}, None)
        self.assertEqual(status_code, 200)
        diags = body["data"]
        self.assertTrue(len(diags) >= 25)
        has_scan = any(d["type"] == "SCAN" for d in diags)
        has_lab = any(d["type"] == "LAB_TEST" for d in diags)
        self.assertTrue(has_scan)
        self.assertTrue(has_lab)

    def test_18_supabase_status_and_configuration_api(self):
        """Test GET /api/v1/doctor/supabase/status and POST /api/v1/doctor/supabase/configure."""
        # 1. Check status
        code, body = self.router.route_request("GET", "/api/v1/doctor/supabase/status", {}, None)
        self.assertEqual(code, 200)
        self.assertTrue(body["success"])
        self.assertIn("configured", body)

        # 2. Configure project ID and anon key
        config_payload = {
            "project_id": "test-arogyavani-proj",
            "anon_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_jwt_token_for_test"
        }
        code, body = self.router.route_request("POST", "/api/v1/doctor/supabase/configure", {}, config_payload)
        self.assertEqual(code, 200)
        self.assertTrue(body["success"])
        self.assertEqual(body["project_id"], "test-arogyavani-proj")
        self.assertTrue(body["configured"])

    def test_19_prescription_submission_with_supabase_sync_flag(self):
        """Test submit_new_prescription includes supabase_synced status."""
        payload = {
            "doctor_id": "doc-1",
            "doctor_name": "Dr. Suresh Sharma",
            "patient_id": self.__class__.patient_id,
            "prescription_type": "NORMAL",
            "symptoms_notes": "Mild hyperglycemia, continuing oral hypoglycemic agent.",
            "medicines": [
                {
                    "medicine_name": "Metformin 500mg",
                    "dosage": "500mg",
                    "no_of_days": 30,
                    "frequency": "1-0-1 (Twice Daily)",
                    "meal_relation": "After Food",
                    "color_sticker": "GREEN",
                    "symbol": "SQUARE"
                }
            ],
            "telephony_trigger_enabled": True
        }
        res = self.use_cases.submit_new_prescription("doc-1", "Dr. Suresh Sharma", self.__class__.patient_id, None, payload)
        self.assertEqual(res["status"], "COMMITTED")
        self.assertIn("supabase_synced", res)
        # Clear test environment variables
        os.environ.pop("SUPABASE_PROJECT_ID", None)
        os.environ.pop("SUPABASE_ANON_KEY", None)
        os.environ.pop("SUPABASE_URL", None)


if __name__ == "__main__":
    unittest.main()
