"""
CURALINK — Doctor Application Use Cases (Clean Architecture)
Encapsulates all clinical workflows, immutability business rules,
revision lineages, AI triage gates, and dual escalation thresholds.
"""

import uuid
import datetime
import sqlite3
from typing import Dict, List, Any, Optional
from src.db.database import get_connection, DB_FILE
from src.db.supabase_client import (
    is_supabase_configured,
    sync_prescription_bundle_to_supabase,
    post_to_supabase
)


PREFED_DIAGNOSTICS = [
    # Diagnostic Scans / Imaging
    {"name": "Chest X-Ray (PA View)", "type": "SCAN", "category": "Radiology", "instructions": "Remove metallic items from chest area. Routine imaging."},
    {"name": "Ultrasound Whole Abdomen & Pelvis (USG)", "type": "SCAN", "category": "Ultrasound", "instructions": "Full bladder required. Drink 1 liter water 1 hour prior."},
    {"name": "2D Echocardiography (ECHO)", "type": "SCAN", "category": "Cardiology", "instructions": "Assessment of cardiac chambers, valves & ejection fraction."},
    {"name": "12-Lead Electrocardiogram (ECG)", "type": "SCAN", "category": "Cardiology", "instructions": "Routine resting ECG in supine position."},
    {"name": "CT Scan Brain (Plain)", "type": "SCAN", "category": "Radiology", "instructions": "Non-contrast brain scan. Remove hairpins and metal jewelry."},
    {"name": "CT Scan Abdomen & Pelvis (Contrast)", "type": "SCAN", "category": "Radiology", "instructions": "Check Serum Creatinine first. Fasting 4-6 hours required."},
    {"name": "MRI Lumbar Spine", "type": "SCAN", "category": "Radiology", "instructions": "Contraindicated if cardiac pacemaker/metal implant present."},
    {"name": "MRI Knee Joint (Bilateral)", "type": "SCAN", "category": "Radiology", "instructions": "Non-invasive musculoskeletal imaging."},
    {"name": "Doppler Ultrasound - Lower Limbs (Venous/Arterial)", "type": "SCAN", "category": "Vascular", "instructions": "Vascular flow evaluation for DVT or peripheral arterial disease."},
    {"name": "Mammography (Bilateral)", "type": "SCAN", "category": "Radiology", "instructions": "Breast cancer screening. Do not apply talcum powder/deodorant."},
    {"name": "X-Ray Both Knees (AP & Lateral Weight-bearing)", "type": "SCAN", "category": "Radiology", "instructions": "Evaluation of joint space narrowing & osteoarthritis grade."},
    {"name": "Ultrasound Neck (Thyroid & Soft Tissues)", "type": "SCAN", "category": "Endocrinology", "instructions": "Evaluation of thyroid nodules, vascularity and goiter."},

    # Lab Investigations / Pathology
    {"name": "HbA1c (Glycated Hemoglobin)", "type": "LAB_TEST", "category": "Diabetology", "instructions": "3-month average glucose. Fasting or non-fasting blood sample."},
    {"name": "Fasting Blood Sugar (FBS)", "type": "LAB_TEST", "category": "Diabetology", "instructions": "Strict 8-10 hours overnight fasting. Water permitted."},
    {"name": "Postprandial Blood Sugar (PPBS)", "type": "LAB_TEST", "category": "Diabetology", "instructions": "Sample exactly 2 hours after standard breakfast/meal."},
    {"name": "Complete Blood Count (CBC) with ESR", "type": "LAB_TEST", "category": "Hematology", "instructions": "Routine venous EDTA blood sample. Tests hemoglobin, WBC, platelets."},
    {"name": "Lipid Profile (Full Panel)", "type": "LAB_TEST", "category": "Cardiology", "instructions": "Strict 10-12 hours overnight fasting. Measures Cholesterol, HDL, LDL, Triglycerides."},
    {"name": "Kidney Function Test (KFT / Creatinine, BUN, Uric Acid)", "type": "LAB_TEST", "category": "Nephrology", "instructions": "Serum sample. Hydrate normally before test."},
    {"name": "Liver Function Test (LFT / Bilirubin, SGOT, SGPT, ALP)", "type": "LAB_TEST", "category": "Gastroenterology", "instructions": "Serum sample. Avoid alcohol for 48 hours prior."},
    {"name": "Thyroid Profile (Total T3, T4 & Ultra-sensitive TSH)", "type": "LAB_TEST", "category": "Endocrinology", "instructions": "Morning blood sample before taking morning thyroid medication."},
    {"name": "Serum Creatinine & eGFR", "type": "LAB_TEST", "category": "Nephrology", "instructions": "Assessment of baseline renal clearance."},
    {"name": "Serum Electrolytes (Sodium, Potassium, Chloride)", "type": "LAB_TEST", "category": "Pathology", "instructions": "Serum sample for electrolyte balance."},
    {"name": "Serum Uric Acid", "type": "LAB_TEST", "category": "Rheumatology", "instructions": "Fasting preferred. Evaluates gout and hyperuricemia."},
    {"name": "Urine Routine & Microscopic Examination (Urine R/M)", "type": "LAB_TEST", "category": "Pathology", "instructions": "First morning clean-catch midstream urine sample."},
    {"name": "Urine Albumin to Creatinine Ratio (UACR)", "type": "LAB_TEST", "category": "Nephrology", "instructions": "Early diabetic nephropathy microalbuminuria screening."},
    {"name": "Vitamin D (25-Hydroxy Vitamin D)", "type": "LAB_TEST", "category": "Pathology", "instructions": "Serum testing for bone metabolism and deficiency."},
    {"name": "Vitamin B12 Level", "type": "LAB_TEST", "category": "Hematology", "instructions": "Fasting morning sample for peripheral neuropathy screening."},
    {"name": "Serum Ferritin & Iron Studies", "type": "LAB_TEST", "category": "Hematology", "instructions": "Iron deficiency anemia evaluation."},
    {"name": "Troponin-I (High Sensitivity hs-cTnI)", "type": "LAB_TEST", "category": "Cardiology", "instructions": "Emergency cardiac biomarker."},
    {"name": "C-Reactive Protein (Quantitative hs-CRP)", "type": "LAB_TEST", "category": "Pathology", "instructions": "Systemic inflammation and cardiovascular risk marker."}
]


class DoctorUseCases:
    def __init__(self, db_path: str = DB_FILE):
        self.db_path = db_path

    def get_prefed_diagnostics(self) -> List[Dict[str, Any]]:
        """Returns the pre-fed clinical diagnostics (scans and lab tests) library."""
        return PREFED_DIAGNOSTICS

    # -------------------------------------------------------------
    # 1. Patient Registration & Literacy Profiling (Section 4.2 & 5.1)
    # -------------------------------------------------------------
    def register_patient(self, doctor_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Registers a patient with mandatory literacy and device profiling."""
        conn = get_connection(self.db_path)
        cursor = conn.cursor()

        # Generate unique UHID
        cursor.execute("SELECT COUNT(*) AS count FROM patients")
        count = cursor.fetchone()["count"] + 1
        uhid = f"ARV-2026-{count:03d}"
        patient_id = str(uuid.uuid4())
        created_at = datetime.datetime.now().isoformat()

        cursor.execute("""
        INSERT INTO patients (
            id, patient_uhid, full_name, age, gender, phone_number,
            literacy_status, preferred_language, device_type,
            guardian_name, guardian_phone, guardian_consent,
            consecutive_missed_calls, dual_escalation_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
        """, (
            patient_id,
            uhid,
            data["full_name"],
            int(data["age"]),
            data["gender"],
            data["phone_number"],
            data.get("literacy_status", "ILLITERATE"),
            data.get("preferred_language", "KANNADA"),
            data.get("device_type", "FEATURE_PHONE"),
            data.get("guardian_name"),
            data.get("guardian_phone"),
            1 if data.get("guardian_consent") else 0,
            created_at
        ))

        conn.commit()
        conn.close()

        if is_supabase_configured():
            try:
                post_to_supabase("patients", {
                    "id": patient_id,
                    "patient_uhid": uhid,
                    "full_name": data["full_name"],
                    "age": int(data["age"]),
                    "gender": data["gender"],
                    "phone_number": data["phone_number"],
                    "literacy_status": data.get("literacy_status", "GENERAL"),
                    "preferred_language": data.get("preferred_language", "KANNADA"),
                    "device_type": data.get("device_type", "FEATURE_PHONE"),
                    "guardian_name": data.get("guardian_name"),
                    "guardian_phone": data.get("guardian_phone"),
                    "guardian_consent": bool(data.get("guardian_consent")),
                    "created_at": created_at
                })
            except Exception as e:
                print(f"[Supabase] Error syncing registered patient: {e}")

        return {
            "id": patient_id,
            "patient_uhid": uhid,
            "full_name": data["full_name"],
            "literacy_status": data.get("literacy_status", "ILLITERATE"),
            "preferred_language": data.get("preferred_language", "KANNADA"),
            "device_type": data.get("device_type", "FEATURE_PHONE"),
            "status": "REGISTERED"
        }

    # -------------------------------------------------------------
    # 2. Patient Directory & Longitudinal Chart
    # -------------------------------------------------------------
    def get_patients_list(self, search: Optional[str] = None, literacy: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = get_connection(self.db_path)
        cursor = conn.cursor()

        query = "SELECT * FROM patients WHERE 1=1"
        params = []

        if search:
            query += " AND (full_name LIKE ? OR patient_uhid LIKE ? OR phone_number LIKE ?)"
            s = f"%{search}%"
            params.extend([s, s, s])

        if literacy and literacy != "ALL":
            query += " AND literacy_status = ?"
            params.append(literacy)

        query += " ORDER BY created_at DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()

        results = []
        for r in rows:
            # Get latest prescription status
            cursor.execute("""
            SELECT id, revision_number, status, follow_up_date 
            FROM prescriptions 
            WHERE patient_id = ? 
            ORDER BY revision_number DESC LIMIT 1
            """, (r["id"],))
            latest_rx = cursor.fetchone()

            # Adherence calculation
            cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'TAKEN_REPORTED' THEN 1 ELSE 0 END) as taken
            FROM adherence_logs WHERE patient_id = ?
            """, (r["id"],))
            adh = cursor.fetchone()
            total_logs = adh["total"] if adh else 0
            taken_logs = adh["taken"] or 0
            adherence_rate = int((taken_logs / total_logs) * 100) if total_logs > 0 else 100

            results.append({
                "id": r["id"],
                "patient_uhid": r["patient_uhid"],
                "full_name": r["full_name"],
                "age": r["age"],
                "gender": r["gender"],
                "phone_number": r["phone_number"],
                "literacy_status": r["literacy_status"],
                "preferred_language": r["preferred_language"],
                "device_type": r["device_type"],
                "guardian_name": r["guardian_name"],
                "guardian_phone": r["guardian_phone"],
                "consecutive_missed_calls": r["consecutive_missed_calls"],
                "dual_escalation_active": bool(r["dual_escalation_active"]),
                "latest_prescription": dict(latest_rx) if latest_rx else None,
                "adherence_rate": adherence_rate
            })

        conn.close()
        return results

    def get_patient_chart(self, patient_id: str) -> Dict[str, Any]:
        """Returns patient details, prescription revision lineage, medicines & adherence feed."""
        conn = get_connection(self.db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM patients WHERE id = ?", (patient_id,))
        patient_row = cursor.fetchone()
        if not patient_row:
            conn.close()
            raise ValueError(f"Patient with id {patient_id} not found.")

        # Prescriptions with Lineage
        cursor.execute("""
        SELECT * FROM prescriptions 
        WHERE patient_id = ? 
        ORDER BY revision_number ASC
        """, (patient_id,))
        rx_rows = cursor.fetchall()

        prescriptions = []
        for rx in rx_rows:
            cursor.execute("SELECT * FROM prescription_medicines WHERE prescription_id = ?", (rx["id"],))
            meds = [dict(m) for m in cursor.fetchall()]
            prescriptions.append({
                "id": rx["id"],
                "parent_prescription_id": rx["parent_prescription_id"],
                "revision_number": rx["revision_number"],
                "status": rx["status"],
                "diagnosis_notes": rx["diagnosis_notes"],
                "clinical_instructions": rx["clinical_instructions"],
                "follow_up_date": rx["follow_up_date"],
                "committed_at": rx["committed_at"],
                "created_at": rx["created_at"],
                "medicines": meds
            })

        # Adherence Logs with Honest Status Language
        cursor.execute("""
        SELECT a.*, pm.medicine_name, pm.color_sticker, pm.symbol
        FROM adherence_logs a
        LEFT JOIN prescription_medicines pm ON a.medicine_id = pm.id
        WHERE a.patient_id = ?
        ORDER BY a.recorded_at DESC
        LIMIT 50
        """, (patient_id,))
        logs = [dict(log) for log in cursor.fetchall()]

        # Care Tasks
        cursor.execute("""
        SELECT * FROM care_tasks WHERE patient_id = ? ORDER BY created_at DESC
        """, (patient_id,))
        tasks = [dict(t) for t in cursor.fetchall()]

        conn.close()
        return {
            "patient": dict(patient_row),
            "prescriptions": prescriptions,
            "adherence_logs": logs,
            "care_tasks": tasks
        }

    # -------------------------------------------------------------
    # 3. Prescription Studio: Draft, Commit & Revision Engine
    # -------------------------------------------------------------
    def draft_prescription(self, doctor_id: str, patient_id: str, medicines: List[Dict[str, Any]],
                           diagnosis_notes: str, clinical_instructions: Optional[str] = None,
                           follow_up_date: Optional[str] = None, draft_id: Optional[str] = None) -> Dict[str, Any]:
        """Creates or edits an editable draft prescription."""
        conn = get_connection(self.db_path)
        cursor = conn.cursor()

        created_at = datetime.datetime.now().isoformat()

        if draft_id:
            # Check draft status
            cursor.execute("SELECT status FROM prescriptions WHERE id = ?", (draft_id,))
            rx = cursor.fetchone()
            if not rx or rx["status"] != "DRAFT":
                conn.close()
                raise ValueError("Only DRAFT prescriptions can be edited directly.")

            cursor.execute("""
            UPDATE prescriptions 
            SET diagnosis_notes = ?, clinical_instructions = ?, follow_up_date = ?
            WHERE id = ?
            """, (diagnosis_notes, clinical_instructions, follow_up_date, draft_id))

            cursor.execute("DELETE FROM prescription_medicines WHERE prescription_id = ?", (draft_id,))
            rx_id = draft_id
        else:
            rx_id = str(uuid.uuid4())
            cursor.execute("""
            INSERT INTO prescriptions (
                id, patient_id, doctor_id, revision_number, status,
                diagnosis_notes, clinical_instructions, follow_up_date, created_at
            ) VALUES (?, ?, ?, 1, 'DRAFT', ?, ?, ?, ?)
            """, (rx_id, patient_id, doctor_id, diagnosis_notes, clinical_instructions, follow_up_date, created_at))

        # Universal Tablet Color Code: Red (Morning), Green (Afternoon), Blue (Night)
        sticker_palette = [
            ("RED", "CIRCLE"),       # Morning
            ("GREEN", "SQUARE"),     # Afternoon
            ("BLUE", "TRIANGLE")     # Night
        ]

        for i, m in enumerate(medicines):
            med_id = str(uuid.uuid4())
            sticker, symbol = sticker_palette[i % len(sticker_palette)]
            cursor.execute("""
            INSERT INTO prescription_medicines (
                id, prescription_id, medicine_name, dosage, frequency,
                duration_days, instructions, color_sticker, symbol, dispense_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
            """, (
                med_id, rx_id, m["medicine_name"], m["dosage"], m["frequency"],
                int(m["duration_days"]), m.get("instructions"),
                m.get("color_sticker", sticker),
                m.get("symbol", symbol)
            ))

        conn.commit()
        conn.close()

        return {"id": rx_id, "status": "DRAFT", "message": "Prescription draft saved successfully."}

    def commit_prescription(self, doctor_id: str, prescription_id: str) -> Dict[str, Any]:
        """Locks prescription into COMMITTED state. Activates DB immutability & triggers."""
        conn = get_connection(self.db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM prescriptions WHERE id = ?", (prescription_id,))
        rx = cursor.fetchone()
        if not rx:
            conn.close()
            raise ValueError("Prescription not found.")

        if rx["status"] != "DRAFT":
            conn.close()
            raise ValueError(f"Cannot commit prescription with status '{rx['status']}'.")

        committed_at = datetime.datetime.now().isoformat()
        cursor.execute("""
        UPDATE prescriptions 
        SET status = 'COMMITTED', committed_at = ?
        WHERE id = ?
        """, (committed_at, prescription_id))

        conn.commit()
        conn.close()

        return {
            "id": prescription_id,
            "status": "COMMITTED",
            "committed_at": committed_at,
            "message": "Prescription committed & locked legally. Immutability active."
        }

    def revise_prescription(self, doctor_id: str, parent_prescription_id: str, reason: str,
                            medicines: List[Dict[str, Any]], diagnosis_notes: Optional[str] = None,
                            clinical_instructions: Optional[str] = None,
                            follow_up_date: Optional[str] = None) -> Dict[str, Any]:
        """Creates an append-only revision (v+1) referencing the prior committed prescription."""
        conn = get_connection(self.db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM prescriptions WHERE id = ?", (parent_prescription_id,))
        parent = cursor.fetchone()
        if not parent:
            conn.close()
            raise ValueError("Parent prescription not found.")

        if parent["status"] != "COMMITTED":
            conn.close()
            raise ValueError("Revisions can only be spawned from COMMITTED prescriptions.")

        # 1. Supersede parent prescription (we use direct SQL before trigger or mark superseded)
        # Note: In SQLite, our trigger blocks updates on COMMITTED rows, so we either create
        # a new row or allow status transition COMMITTED -> SUPERSEDED. Let's see: in trigger,
        # we can adjust or we can insert revision pointing to parent.
        # To preserve history: parent is retained as ancestor!
        new_revision_num = parent["revision_number"] + 1
        new_rx_id = str(uuid.uuid4())
        created_at = datetime.datetime.now().isoformat()
        committed_at = created_at  # Automatically commit approved revision

        notes = diagnosis_notes or parent["diagnosis_notes"]
        instr = f"Revision note: {reason}. " + (clinical_instructions or parent["clinical_instructions"] or "")
        f_up = follow_up_date or parent["follow_up_date"]

        cursor.execute("""
        INSERT INTO prescriptions (
            id, patient_id, doctor_id, hospital_id, parent_prescription_id,
            revision_number, status, diagnosis_notes, clinical_instructions,
            follow_up_date, committed_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'COMMITTED', ?, ?, ?, ?, ?)
        """, (
            new_rx_id, parent["patient_id"], doctor_id, parent["hospital_id"],
            parent_prescription_id, new_revision_num, notes, instr, f_up, committed_at, created_at
        ))

        # Universal Tablet Color Code: Red (Morning), Green (Afternoon), Blue (Night)
        sticker_palette = [
            ("RED", "CIRCLE"),       # Morning
            ("GREEN", "SQUARE"),     # Afternoon
            ("BLUE", "TRIANGLE")     # Night
        ]

        for i, m in enumerate(medicines):
            med_id = str(uuid.uuid4())
            sticker, symbol = sticker_palette[i % len(sticker_palette)]
            cursor.execute("""
            INSERT INTO prescription_medicines (
                id, prescription_id, medicine_name, dosage, frequency,
                duration_days, instructions, color_sticker, symbol, dispense_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
            """, (
                med_id, new_rx_id, m["medicine_name"], m["dosage"], m["frequency"],
                int(m["duration_days"]), m.get("instructions"),
                m.get("color_sticker", sticker),
                m.get("symbol", symbol)
            ))

        conn.commit()
        conn.close()

        return {
            "id": new_rx_id,
            "parent_prescription_id": parent_prescription_id,
            "revision_number": new_revision_num,
            "status": "COMMITTED",
            "message": f"Successfully created Revision v{new_revision_num} linked to parent v{parent['revision_number']}."
        }

    def test_immutability_violation(self, prescription_id: str) -> Dict[str, Any]:
        """Attempts an explicit SQL UPDATE/DELETE on a COMMITTED prescription to prove trigger protection."""
        conn = get_connection(self.db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT status, revision_number FROM prescriptions WHERE id = ?", (prescription_id,))
        rx = cursor.fetchone()
        if not rx:
            conn.close()
            return {"success": False, "error": "Prescription not found."}

        try:
            # Attempt forbidden modification
            cursor.execute("""
            UPDATE prescriptions 
            SET diagnosis_notes = 'Illegal overwrite attempt'
            WHERE id = ?
            """, (prescription_id,))
            conn.commit()
            conn.close()
            return {"success": False, "error": "SECURITY FAILURE: Database allowed modifying a committed prescription!"}
        except sqlite3.DatabaseError as e:
            conn.close()
            return {
                "success": True,
                "verified": True,
                "database_trigger_message": str(e),
                "explanation": "PostgreSQL/SQLite Trigger actively intercepted and aborted the modification attempt. Immutability mathematically verified."
            }

    # -------------------------------------------------------------
    # 4. Human-in-the-Loop AI Call-to-Task Triage Desk (Section 4.2 & 10)
    # -------------------------------------------------------------
    def get_pending_ai_tasks(self) -> List[Dict[str, Any]]:
        conn = get_connection(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
        SELECT t.*, p.full_name as patient_name, p.patient_uhid, p.phone_number, p.literacy_status, p.preferred_language
        FROM care_tasks t
        JOIN patients p ON t.patient_id = p.id
        WHERE t.status = 'PROPOSED'
        ORDER BY t.created_at DESC
        """)
        tasks = [dict(t) for t in cursor.fetchall()]
        conn.close()
        return tasks

    def review_ai_task(self, doctor_id: str, task_id: str, decision: str, notes: Optional[str] = None) -> Dict[str, Any]:
        """Doctor validates, approves or rejects candidate tasks before clinical workflow changes."""
        conn = get_connection(self.db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM care_tasks WHERE id = ?", (task_id,))
        task = cursor.fetchone()
        if not task:
            conn.close()
            raise ValueError("Task not found.")

        reviewed_at = datetime.datetime.now().isoformat()
        new_status = "APPROVED" if decision == "APPROVE" else "REJECTED"

        cursor.execute("""
        UPDATE care_tasks 
        SET status = ?, reviewed_by = ?, reviewed_at = ?
        WHERE id = ?
        """, (new_status, doctor_id, reviewed_at, task_id))

        conn.commit()
        conn.close()

        return {
            "id": task_id,
            "status": new_status,
            "message": f"Task decision '{new_status}' recorded by Doctor."
        }

    # -------------------------------------------------------------
    # 5. Pharmacy Substitution Gate (Section 4.4 & 10)
    # -------------------------------------------------------------
    def get_pending_substitutions(self) -> List[Dict[str, Any]]:
        conn = get_connection(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
        SELECT s.*, p.patient_uhid, p.full_name as patient_name, rx.revision_number
        FROM substitution_proposals s
        JOIN prescriptions rx ON s.prescription_id = rx.id
        JOIN patients p ON rx.patient_id = p.id
        WHERE s.status = 'PENDING'
        ORDER BY s.created_at DESC
        """)
        proposals = [dict(p) for p in cursor.fetchall()]
        conn.close()
        return proposals

    def review_substitution(self, doctor_id: str, proposal_id: str, decision: str, notes: Optional[str] = None) -> Dict[str, Any]:
        """Approving a pharmacy substitution automatically generates a traceable prescription revision."""
        conn = get_connection(self.db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM substitution_proposals WHERE id = ?", (proposal_id,))
        sub = cursor.fetchone()
        if not sub:
            conn.close()
            raise ValueError("Substitution proposal not found.")

        if decision == "REJECT":
            cursor.execute("""
            UPDATE substitution_proposals 
            SET status = 'REJECTED', doctor_rejection_reason = ? 
            WHERE id = ?
            """, (notes or "Doctor requested original medicine", proposal_id))
            conn.commit()
            conn.close()
            return {"status": "REJECTED", "message": "Substitution rejected. Pharmacy notified to retain original therapy."}

        # APPROVE: Mark proposal approved and spawn prescription revision
        cursor.execute("UPDATE substitution_proposals SET status = 'APPROVED' WHERE id = ?", (proposal_id,))
        conn.commit()
        conn.close()

        # Fetch original medicines from the parent prescription
        conn2 = get_connection(self.db_path)
        c2 = conn2.cursor()
        c2.execute("SELECT * FROM prescription_medicines WHERE prescription_id = ?", (sub["prescription_id"],))
        parent_meds = [dict(m) for m in c2.fetchall()]
        conn2.close()

        # Replace the substituted item
        revised_medicines = []
        for m in parent_meds:
            if m["id"] == sub["medicine_id"]:
                revised_medicines.append({
                    "medicine_name": sub["proposed_medicine_name"],
                    "dosage": m["dosage"],
                    "frequency": m["frequency"],
                    "duration_days": m["duration_days"],
                    "instructions": f"Generic equivalent approved: {sub['reason_for_substitution']}",
                    "color_sticker": m["color_sticker"],
                    "symbol": m["symbol"]
                })
            else:
                revised_medicines.append(m)

        # Create revision
        rev = self.revise_prescription(
            doctor_id=doctor_id,
            parent_prescription_id=sub["prescription_id"],
            reason=f"Approved pharmacy substitute: {sub['original_medicine_name']} -> {sub['proposed_medicine_name']}",
            medicines=revised_medicines
        )

        return {
            "status": "APPROVED",
            "new_revision_id": rev["id"],
            "revision_number": rev["revision_number"],
            "message": f"Pharmacy substitute approved. Generated Revision v{rev['revision_number']}."
        }

    # -------------------------------------------------------------
    # 6. Adherence Simulator & Dual-Escalation Engine (Section 5.7 & 5.8)
    # -------------------------------------------------------------
    def record_adherence_event(self, patient_id: str, medicine_id: Optional[str],
                               status: str, response_mode: str, provider_outcome: str) -> Dict[str, Any]:
        """
        Records adherence with honest status language.
        Tracks consecutive failures and triggers dual escalation at threshold >= 3.
        """
        conn = get_connection(self.db_path)
        cursor = conn.cursor()

        now = datetime.datetime.now().isoformat()
        log_id = str(uuid.uuid4())

        cursor.execute("""
        INSERT INTO adherence_logs (
            id, patient_id, medicine_id, scheduled_time, status,
            response_mode, provider_outcome, attempt_count, recorded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
        """, (log_id, patient_id, medicine_id, now, status, response_mode, provider_outcome, now))

        # Check consecutive failure counter
        cursor.execute("SELECT consecutive_missed_calls, full_name, patient_uhid FROM patients WHERE id = ?", (patient_id,))
        pt = cursor.fetchone()

        dual_escalation_fired = False

        if status == "NO_ANSWER" and provider_outcome != "NETWORK_FAILED":
            # Qualifying unanswered call increments counter
            new_missed = pt["consecutive_missed_calls"] + 1
            if new_missed >= 3:
                # Trigger Dual Escalation!
                cursor.execute("""
                UPDATE patients 
                SET consecutive_missed_calls = ?, dual_escalation_active = 1
                WHERE id = ?
                """, (new_missed, patient_id))

                # Create immediate care task for Doctor & Hospital
                task_id = str(uuid.uuid4())
                cursor.execute("""
                INSERT INTO care_tasks (
                    id, patient_id, source_type, title, raw_transcript,
                    ai_extracted_summary, priority, status, created_at
                ) VALUES (?, ?, 'DUAL_ESCALATION', ?, ?, ?, 'CRITICAL', 'PROPOSED', ?)
                """, (
                    task_id, patient_id,
                    f"CRITICAL ESCALATION: 3 consecutive unanswered reminder calls for {pt['full_name']}",
                    "Telephony engine completed 3 retry cycles without patient response.",
                    "Threshold breached: Immediate human outreach required by Doctor and Hospital Care Team.",
                    now
                ))
                dual_escalation_fired = True
            else:
                cursor.execute("UPDATE patients SET consecutive_missed_calls = ? WHERE id = ?", (new_missed, patient_id))

        elif status == "TAKEN_REPORTED":
            # Reset missed call counter
            cursor.execute("UPDATE patients SET consecutive_missed_calls = 0 WHERE id = ?", (patient_id,))

        conn.commit()
        conn.close()

        return {
            "log_id": log_id,
            "status": status,
            "dual_escalation_fired": dual_escalation_fired,
            "message": "Adherence log recorded."
        }

    def resolve_escalation(self, doctor_id: str, patient_id: str, resolution_notes: str) -> Dict[str, Any]:
        """Doctor marks dual escalation as contacted and resolved."""
        conn = get_connection(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
        UPDATE patients 
        SET dual_escalation_active = 0, consecutive_missed_calls = 0 
        WHERE id = ?
        """, (patient_id,))

        # Resolve associated tasks
        now = datetime.datetime.now().isoformat()
        cursor.execute("""
        UPDATE care_tasks 
        SET status = 'RESOLVED', reviewed_by = ?, reviewed_at = ?
        WHERE patient_id = ? AND source_type = 'DUAL_ESCALATION' AND status = 'PROPOSED'
        """, (doctor_id, now, patient_id))

        conn.commit()
        conn.close()

        return {"success": True, "message": "Escalation resolved and documented in care timeline."}

    # -------------------------------------------------------------
    # 7. Doctor Dashboard KPI Aggregator & Appointments Queue
    # -------------------------------------------------------------
    def get_dashboard_kpis(self, doctor_id: str) -> Dict[str, Any]:
        conn = get_connection(self.db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) as count FROM patients")
        total_patients = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) as count FROM appointments WHERE status = 'PENDING'")
        pending_appointments = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) as count FROM patients WHERE dual_escalation_active = 1")
        critical_escalations = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) as count FROM care_tasks WHERE status = 'PROPOSED'")
        pending_ai_tasks = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) as count FROM substitution_proposals WHERE status = 'PENDING'")
        pending_substitutions = cursor.fetchone()["count"]

        conn.close()

        return {
            "total_patients": total_patients,
            "pending_appointments": pending_appointments,
            "critical_escalations": critical_escalations,
            "pending_ai_tasks": pending_ai_tasks,
            "pending_substitutions": pending_substitutions
        }

    # -------------------------------------------------------------
    # 8. Pending Appointments & Encounter Management
    # -------------------------------------------------------------
    def get_pending_appointments(self, doctor_id: str) -> List[Dict[str, Any]]:
        """Returns pending appointments for the Command Center queue."""
        conn = get_connection(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
        SELECT a.*, p.full_name, p.patient_uhid, p.age, p.gender, p.phone_number,
               p.literacy_status, p.preferred_language, p.device_type,
               p.dual_escalation_active, p.consecutive_missed_calls
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.status = 'PENDING'
        ORDER BY a.token_number ASC, a.created_at ASC
        """)
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    def get_patient_encounter_data(self, patient_id: str) -> Dict[str, Any]:
        """
        Returns full patient data for the 3-tab encounter workspace:
        Tab 1: New Prescription Starter
        Tab 2: Prescription History (Read-only, with Doctor Name & Date)
        Tab 3: Medication History (Read-only, with Doctor Name, Date, Sticker)
        """
        conn = get_connection(self.db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM patients WHERE id = ?", (patient_id,))
        pt_row = cursor.fetchone()
        if not pt_row:
            conn.close()
            raise ValueError(f"Patient with id {patient_id} not found.")

        # Tab 2: Prescription History (Read-only)
        cursor.execute("""
        SELECT p.*, u.full_name as prescribing_doctor_name, u.department as doctor_department
        FROM prescriptions p
        LEFT JOIN users u ON p.doctor_id = u.id
        WHERE p.patient_id = ?
        ORDER BY p.revision_number DESC, p.created_at DESC
        """, (patient_id,))
        rx_rows = cursor.fetchall()

        prescription_history = []
        for rx in rx_rows:
            cursor.execute("SELECT * FROM prescription_medicines WHERE prescription_id = ?", (rx["id"],))
            meds = [dict(m) for m in cursor.fetchall()]

            cursor.execute("SELECT * FROM prescription_diagnostics WHERE prescription_id = ? ORDER BY test_type ASC, test_name ASC", (rx["id"],))
            diags = [dict(d) for d in cursor.fetchall()]

            doc_display = rx["doctor_name"] or rx["prescribing_doctor_name"] or "Dr. Suresh Sharma, MD"
            prescription_history.append({
                "id": rx["id"],
                "revision_number": rx["revision_number"],
                "status": rx["status"],
                "prescription_type": rx["prescription_type"] if "prescription_type" in rx.keys() else "COMPREHENSIVE",
                "doctor_name": doc_display,
                "doctor_department": rx["doctor_department"] or "Internal Medicine & Chronic Care",
                "diagnosis_notes": rx["diagnosis_notes"],
                "symptoms_notes": rx["symptoms_notes"] or "",
                "word_count": rx["word_count"] or 0,
                "clinical_instructions": rx["clinical_instructions"],
                "follow_up_date": rx["follow_up_date"],
                "follow_up_notes": rx["follow_up_notes"] if "follow_up_notes" in rx.keys() else "",
                "telephony_trigger_enabled": bool(rx["telephony_trigger_enabled"]),
                "telephony_triggered_at": rx["telephony_triggered_at"],
                "committed_at": rx["committed_at"],
                "created_at": rx["created_at"],
                "medicines": meds,
                "diagnostics": diags
            })

        # Tab 3: Medication History (Read-only, flattened chronological log)
        cursor.execute("""
        SELECT pm.*, p.revision_number, p.doctor_name, p.committed_at, p.created_at as rx_created_at,
               u.full_name as prescribing_doctor_name
        FROM prescription_medicines pm
        JOIN prescriptions p ON pm.prescription_id = p.id
        LEFT JOIN users u ON p.doctor_id = u.id
        WHERE p.patient_id = ?
        ORDER BY p.created_at DESC, pm.id ASC
        """, (patient_id,))
        med_rows = cursor.fetchall()

        medication_history = []
        for m in med_rows:
            doc_display = m["doctor_name"] or m["prescribing_doctor_name"] or "Dr. Suresh Sharma, MD"
            medication_history.append({
                "id": m["id"],
                "prescription_id": m["prescription_id"],
                "revision_number": m["revision_number"],
                "medicine_name": m["medicine_name"],
                "dosage": m["dosage"],
                "no_of_days": m["duration_days"],
                "frequency": m["frequency"],
                "meal_relation": m["meal_relation"] or "After Food",
                "instructions": m["instructions"],
                "color_sticker": m["color_sticker"] or "RED",
                "symbol": m["symbol"] or "CIRCLE",
                "dispense_status": m["dispense_status"],
                "prescribed_by": doc_display,
                "prescribed_date": m["committed_at"] or m["rx_created_at"]
            })

        # Diagnostic History (Read-only, all past scans and tests across visits)
        cursor.execute("""
        SELECT pd.*, p.revision_number, p.doctor_name, p.committed_at, p.created_at as rx_created_at,
               u.full_name as prescribing_doctor_name
        FROM prescription_diagnostics pd
        JOIN prescriptions p ON pd.prescription_id = p.id
        LEFT JOIN users u ON p.doctor_id = u.id
        WHERE p.patient_id = ?
        ORDER BY p.created_at DESC, pd.test_type ASC
        """, (patient_id,))
        diag_rows = cursor.fetchall()

        diagnostics_history = []
        for d in diag_rows:
            doc_display = d["doctor_name"] or d["prescribing_doctor_name"] or "Dr. Suresh Sharma, MD"
            diagnostics_history.append({
                "id": d["id"],
                "prescription_id": d["prescription_id"],
                "revision_number": d["revision_number"],
                "test_type": d["test_type"],
                "test_name": d["test_name"],
                "instructions": d["instructions"] or "Standard preparation",
                "status": d["status"],
                "prescribed_by": doc_display,
                "prescribed_date": d["committed_at"] or d["rx_created_at"]
            })

        conn.close()
        return {
            "patient": dict(pt_row),
            "prescription_history": prescription_history,
            "medication_history": medication_history,
            "diagnostics_history": diagnostics_history
        }

    # -------------------------------------------------------------
    # 9. Complete Prescription, Diagnostics & Follow-Up Submission
    # -------------------------------------------------------------
    def submit_new_prescription(self, doctor_id: str, doctor_name: str, patient_id: str,
                                appointment_id: Optional[str], data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Submits new prescription atomically with:
        - Mode: NORMAL (meds only) | SCAN_TEST (diagnostics only) | COMPREHENSIVE (both)
        - Symptoms notes (strictly validated against 300-word limit)
        - Medication Regimen table (medicine, days, frequency, meal relation, sticker)
        - Diagnostic Orders (Scans & Lab tests with prep instructions)
        - Doctor Follow-up scheduling with automatic appointment booking
        - Supabase / AI Calling Agent dual trigger activation
        """
        symptoms = data.get("symptoms_notes", "").strip()
        word_count = len(symptoms.split()) if symptoms else 0

        # Word limit constraint (Section 10 & database limits: max 300 words)
        MAX_WORD_LIMIT = 300
        if word_count > MAX_WORD_LIMIT:
            raise ValueError(f"Prescription symptoms note exceeds limit: {word_count} words entered (Maximum {MAX_WORD_LIMIT} words allowed).")

        rx_type = (data.get("prescription_type") or "COMPREHENSIVE").upper()
        if rx_type not in ("NORMAL", "SCAN_TEST", "COMPREHENSIVE"):
            rx_type = "COMPREHENSIVE"

        medicines = data.get("medicines", [])
        diagnostics = data.get("diagnostics", [])

        # Validate based on prescription mode
        if rx_type == "NORMAL" and not medicines:
            raise ValueError("Normal Prescription requires at least one medicine in the medication regimen.")
        elif rx_type == "SCAN_TEST" and not diagnostics:
            raise ValueError("Scan/Test order requires at least one diagnostic scan or lab test.")
        elif rx_type == "COMPREHENSIVE" and not medicines and not diagnostics:
            raise ValueError("Comprehensive prescription requires at least one medicine or diagnostic investigation.")

        conn = get_connection(self.db_path)
        cursor = conn.cursor()

        rx_id = str(uuid.uuid4())
        now = datetime.datetime.now().isoformat()
        committed_at = now

        # Determine revision number for this patient
        cursor.execute("SELECT MAX(revision_number) as max_rev FROM prescriptions WHERE patient_id = ?", (patient_id,))
        row = cursor.fetchone()
        rev_num = (row["max_rev"] or 0) + 1

        trigger_enabled = 1 if data.get("telephony_trigger_enabled", True) else 0
        triggered_at = now if trigger_enabled else None

        diagnosis = data.get("diagnosis_notes", "Clinical Assessment")
        follow_up_date = data.get("follow_up_date")
        follow_up_notes = data.get("follow_up_notes", "").strip()
        instructions = data.get("clinical_instructions")

        # 1. Insert Prescription directly as COMMITTED (legal immutability active)
        cursor.execute("""
        INSERT INTO prescriptions (
            id, patient_id, doctor_id, doctor_name, prescription_type, revision_number, status,
            diagnosis_notes, symptoms_notes, word_count, clinical_instructions,
            follow_up_date, follow_up_notes, telephony_trigger_enabled, telephony_triggered_at,
            committed_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'COMMITTED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            rx_id, patient_id, doctor_id, doctor_name, rx_type, rev_num,
            diagnosis, symptoms, word_count, instructions,
            follow_up_date, follow_up_notes, trigger_enabled, triggered_at,
            committed_at, now
        ))

        # Universal Tablet Color Code: Red (Morning), Green (Afternoon), Blue (Night)
        sticker_palette = [
            ("RED", "CIRCLE"),       # Morning
            ("GREEN", "SQUARE"),     # Afternoon
            ("BLUE", "TRIANGLE")     # Night
        ]

        if rx_type in ("NORMAL", "COMPREHENSIVE"):
            for i, m in enumerate(medicines):
                med_id = str(uuid.uuid4())
                palette_sticker, palette_symbol = sticker_palette[i % len(sticker_palette)]
                sticker = m.get("color_sticker") or palette_sticker
                symbol = m.get("symbol") or palette_symbol
                days = int(m.get("no_of_days") or m.get("duration_days") or 30)

                cursor.execute("""
                INSERT INTO prescription_medicines (
                    id, prescription_id, medicine_name, dosage, frequency,
                    duration_days, no_of_days, meal_relation, instructions,
                    color_sticker, symbol, dispense_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
                """, (
                    med_id, rx_id, m["medicine_name"], m.get("dosage", "As Prescribed"),
                    m.get("frequency", "1-0-1 (Twice Daily)"), days, days,
                    m.get("meal_relation", "After Food"), m.get("instructions"),
                    sticker, symbol
                ))

        # 3. Insert Diagnostic Scans & Lab Tests (if ordered)
        if rx_type in ("SCAN_TEST", "COMPREHENSIVE"):
            for d in diagnostics:
                diag_id = str(uuid.uuid4())
                test_type = (d.get("test_type") or "LAB_TEST").upper()
                test_name = d.get("test_name", "").strip()
                if not test_name:
                    continue
                diag_instructions = d.get("instructions", "Standard preparation").strip()

                cursor.execute("""
                INSERT INTO prescription_diagnostics (
                    id, prescription_id, test_type, test_name, instructions, status, created_at
                ) VALUES (?, ?, ?, ?, ?, 'PENDING', ?)
                """, (diag_id, rx_id, test_type, test_name, diag_instructions, now))

        # 4. Automatic Follow-Up Appointment Scheduling
        if follow_up_date:
            cursor.execute("SELECT COUNT(*) as count FROM appointments WHERE booking_channel = 'DOCTOR_FOLLOW_UP'")
            fol_cnt = (cursor.fetchone()["count"] or 0) + 1
            fol_token = f"FOL-{fol_cnt:02d}"
            follow_up_reason = f"Scheduled Follow-up: {follow_up_notes}" if follow_up_notes else "Scheduled Clinical Follow-up Review"

            cursor.execute("""
            INSERT INTO appointments (
                id, patient_id, doctor_id, token_number, reason_for_visit,
                appointment_time, booking_channel, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'DOCTOR_FOLLOW_UP', 'SCHEDULED', ?)
            """, (
                str(uuid.uuid4()), patient_id, doctor_id, fol_token,
                follow_up_reason, f"{follow_up_date} • Clinic Hours", now
            ))

        # 5. Mark prior appointment as COMPLETED if provided
        if appointment_id:
            cursor.execute("UPDATE appointments SET status = 'COMPLETED' WHERE id = ?", (appointment_id,))

        # 6. If Telephony trigger is enabled, record initial scheduled adherence queue log
        if trigger_enabled:
            cursor.execute("""
            INSERT INTO adherence_logs (
                id, patient_id, medicine_id, scheduled_time, status,
                response_mode, provider_outcome, attempt_count, recorded_at
            ) VALUES (?, ?, NULL, ?, 'SNOOZED', 'SYSTEM_SCHEDULED', 'QUEUED_FOR_AI_CALLER', 0, ?)
            """, (str(uuid.uuid4()), patient_id, now, now))

        conn.commit()
        conn.close()

        # 7. Supabase Realtime Synchronization
        supabase_synced = False
        if is_supabase_configured():
            try:
                rx_data_sync = {
                    "id": rx_id,
                    "patient_id": patient_id,
                    "doctor_id": doctor_id,
                    "doctor_name": doctor_name,
                    "prescription_type": rx_type,
                    "revision_number": rev_num,
                    "status": "COMMITTED",
                    "diagnosis_notes": diagnosis,
                    "symptoms_notes": symptoms,
                    "word_count": word_count,
                    "clinical_instructions": instructions,
                    "follow_up_date": follow_up_date,
                    "follow_up_notes": follow_up_notes,
                    "telephony_trigger_enabled": bool(trigger_enabled),
                    "telephony_triggered_at": triggered_at,
                    "committed_at": committed_at,
                    "created_at": now
                }
                sync_res = sync_prescription_bundle_to_supabase(
                    rx_data=rx_data_sync,
                    medicines=medicines if rx_type in ("NORMAL", "COMPREHENSIVE") else [],
                    diagnostics=diagnostics if rx_type in ("SCAN_TEST", "COMPREHENSIVE") else [],
                    appointment={
                        "id": str(uuid.uuid4()),
                        "patient_id": patient_id,
                        "doctor_id": doctor_id,
                        "token_number": fol_token if follow_up_date else None,
                        "reason_for_visit": follow_up_reason if follow_up_date else None,
                        "appointment_time": f"{follow_up_date} • Clinic Hours" if follow_up_date else None,
                        "booking_channel": "DOCTOR_FOLLOW_UP",
                        "status": "SCHEDULED",
                        "created_at": now
                    } if follow_up_date else None
                )
                supabase_synced = bool(sync_res and sync_res.get("synced"))
            except Exception as e:
                print(f"[Supabase] Sync notice: {e}")

        return {
            "id": rx_id,
            "revision_number": rev_num,
            "status": "COMMITTED",
            "prescription_type": rx_type,
            "doctor_name": doctor_name,
            "word_count": word_count,
            "telephony_trigger_enabled": bool(trigger_enabled),
            "medicines_count": len(medicines) if rx_type != "SCAN_TEST" else 0,
            "diagnostics_count": len(diagnostics) if rx_type != "NORMAL" else 0,
            "follow_up_date": follow_up_date,
            "supabase_synced": supabase_synced,
            "message": f"Prescription v{rev_num} ({rx_type}) submitted successfully. Follow-up: {follow_up_date or 'None'}. Telephony trigger: {'ACTIVE' if trigger_enabled else 'OFF'}. Supabase sync: {'ACTIVE' if supabase_synced else 'STANDBY'}."
        }

    # -------------------------------------------------------------
    # 10. AI Calling Agent & SMS Dual Trigger Feeder (Supabase Contract)
    # -------------------------------------------------------------
    def get_pending_telephony_triggers(self) -> List[Dict[str, Any]]:
        """
        Returns active prescriptions flagged for AI Calling Agent.
        Emits two distinct operational triggers:
        1. SCAN_TEST_ORDERED / MEDICATION_DISPATCH: Immediate call & SMS with scan instructions and regimen.
        2. FOLLOWUP_REMINDER_WITH_REPORTS: Pre-appointment call & SMS instructing patient to bring scan reports.
        """
        conn = get_connection(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
        SELECT p.id as prescription_id, p.doctor_name, p.prescription_type, p.created_at,
               p.follow_up_date, p.follow_up_notes,
               pt.id as patient_id, pt.patient_uhid, pt.full_name as patient_name,
               pt.phone_number, pt.literacy_status, pt.preferred_language, pt.device_type,
               pt.guardian_name, pt.guardian_phone, pt.guardian_consent
        FROM prescriptions p
        JOIN patients pt ON p.patient_id = pt.id
        WHERE p.status = 'COMMITTED' AND p.telephony_trigger_enabled = 1
        ORDER BY p.created_at DESC
        """)
        rx_rows = cursor.fetchall()

        triggers = []
        for rx in rx_rows:
            # Fetch medicines
            cursor.execute("SELECT * FROM prescription_medicines WHERE prescription_id = ?", (rx["prescription_id"],))
            meds = [dict(m) for m in cursor.fetchall()]

            # Fetch diagnostics
            cursor.execute("SELECT * FROM prescription_diagnostics WHERE prescription_id = ?", (rx["prescription_id"],))
            diags = [dict(d) for d in cursor.fetchall()]

            patient_lang = rx["preferred_language"] or "KANNADA"
            patient_name = rx["patient_name"]
            doc = rx["doctor_name"] or "Dr. Suresh Sharma, MD"
            diag_count = len(diags)
            med_count = len(meds)

            patient_info = {
                "id": rx["patient_id"],
                "uhid": rx["patient_uhid"],
                "name": patient_name,
                "phone_number": rx["phone_number"],
                "literacy_status": rx["literacy_status"],
                "preferred_language": patient_lang,
                "device_type": rx["device_type"],
                "guardian": {
                    "name": rx["guardian_name"],
                    "phone": rx["guardian_phone"],
                    "consent": bool(rx["guardian_consent"])
                }
            }

            meds_payload = [
                {
                    "medicine_name": m["medicine_name"],
                    "dosage": m["dosage"],
                    "no_of_days": m["duration_days"],
                    "frequency": m["frequency"],
                    "meal_relation": m["meal_relation"],
                    "color_sticker": m["color_sticker"],
                    "symbol": m["symbol"],
                    "voice_prompt_hint": (
                        f"Packet with {m['color_sticker']} Sticker ({m['symbol']})" 
                        if rx["literacy_status"] == "ILLITERATE" 
                        else f"{m['medicine_name']} {m['dosage']}"
                    )
                } for m in meds
            ]

            diags_payload = [
                {
                    "id": d["id"],
                    "test_type": d["test_type"],
                    "test_name": d["test_name"],
                    "instructions": d["instructions"],
                    "status": d["status"]
                } for d in diags
            ]

            test_names_list = [d["test_name"] for d in diags]
            test_names_str = ", ".join(test_names_list) if test_names_list else ""

            # -------------------------------------------------------------
            # TRIGGER 1: Primary Order & Adherence Dispatch (Immediate)
            # -------------------------------------------------------------
            if diag_count > 0 and med_count == 0:
                trig1_type = "SCAN_TEST_ORDERED"
            elif diag_count > 0 and med_count > 0:
                trig1_type = "COMPREHENSIVE_ORDER"
            else:
                trig1_type = "MEDICATION_ADHERENCE"

            # Multilingual scripts for Trigger 1
            if patient_lang == "KANNADA":
                if diag_count > 0 and med_count > 0:
                    voice_script = f"ನಮಸ್ಕಾರ {patient_name} ಅವರೇ, ನಾನು ಆರೋಗ್ಯವಾಣಿ ಕ್ಲಿನಿಕ್‌ನಿಂದ ಕರೆ ಮಾಡುತ್ತಿದ್ದೇನೆ. {doc} ಅವರು ನಿಮಗೆ ಔಷಧಿಗಳೊಂದಿಗೆ {test_names_str} ಪರೀಕ್ಷೆಗಳನ್ನು ಸೂಚಿಸಿದ್ದಾರೆ. ದಯವಿಟ್ಟು ಪರೀಕ್ಷೆಯನ್ನು ಶೀಘ್ರದಲ್ಲೇ ಮಾಡಿಸಿಕೊಳ್ಳಿ."
                    sms_script = f"ಆರೋಗ್ಯವಾಣಿ: {doc} ಅವರು ಔಷಧಿಗಳು ಮತ್ತು {test_names_str} ಪರೀಕ್ಷೆಗಳನ್ನು ಸೂಚಿಸಿದ್ದಾರೆ. ದಯವಿಟ್ಟು ಪರೀಕ್ಷೆ ಮಾಡಿಸಿಕೊಳ್ಳಿ."
                elif diag_count > 0:
                    voice_script = f"ನಮಸ್ಕಾರ {patient_name} ಅವರೇ, {doc} ಅವರು ನಿಮಗೆ {test_names_str} ಸ್ಕ್ಯಾನ್/ಲ್ಯಾಬ್ ಪರೀಕ್ಷೆಗಳನ್ನು ಸೂಚಿಸಿದ್ದಾರೆ. ದಯವಿಟ್ಟು ಲ್ಯಾಬ್‌ಗೆ ಭೇಟಿ ನೀಡಿ ಪರೀಕ್ಷೆ ಮಾಡಿಸಿಕೊಳ್ಳಿ."
                    sms_script = f"ಆರೋಗ್ಯವಾಣಿ: {doc} ಅವರು {test_names_str} ಪರೀಕ್ಷೆಗಳನ್ನು ಸೂಚಿಸಿದ್ದಾರೆ. ದಯವಿಟ್ಟು ಪರೀಕ್ಷಾ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ."
                else:
                    voice_script = f"ನಮಸ್ಕಾರ {patient_name} ಅವರೇ, {doc} ಅವರು ಸೂಚಿಸಿದ ಬಣ್ಣದ ಸ್ಟಿಕ್ಕರ್ ಔಷಧಿಗಳನ್ನು ಸಕಾಲದಲ್ಲಿ ತೆಗೆದುಕೊಳ್ಳಿ."
                    sms_script = f"ಆರೋಗ್ಯವಾಣಿ: {doc} ಅವರು ಸೂಚಿಸಿದ ಔಷಧಿಗಳನ್ನು ನಿಯಮಿತವಾಗಿ ತೆಗೆದುಕೊಳ್ಳಿ."
            elif patient_lang == "HINDI":
                if diag_count > 0:
                    voice_script = f"नमस्ते {patient_name}, {doc} ने आपके लिए {test_names_str} जांच लिखी है। कृपया जल्द से जल्द अपनी जांच करा लें।"
                    sms_script = f"आरोग्यवाणी: {doc} ने {test_names_str} जांच लिखी है। कृपया जांच केंद्र जाएं।"
                else:
                    voice_script = f"नमस्ते {patient_name}, {doc} द्वारा दी गई दवाइयां समय पर लें।"
                    sms_script = f"आरोग्यवाणी: {doc} द्वारा दी गई दवाइयां नियमित रूप से लें।"
            else:
                if diag_count > 0:
                    voice_script = f"Hello {patient_name}, {doc} has ordered diagnostic investigations: {test_names_str}. Please visit the diagnostic lab to get these tests done."
                    sms_script = f"CuraLink: {doc} ordered {test_names_str}. Please complete tests before your follow-up."
                else:
                    voice_script = f"Hello {patient_name}, please take your prescribed medications on time as directed by {doc}."
                    sms_script = f"CuraLink: Please adhere to your medication schedule prescribed by {doc}."

            triggers.append({
                "trigger_id": f"trig-primary-{rx['prescription_id']}",
                "trigger_type": trig1_type,
                "prescription_id": rx["prescription_id"],
                "doctor_name": doc,
                "patient": patient_info,
                "medication_regimen": meds_payload,
                "diagnostic_orders": diags_payload,
                "scheduled_dispatch": "IMMEDIATE",
                "voice_call_payload": {
                    "preferred_language": patient_lang,
                    "voice_tts_text": voice_script,
                    "requires_dtmf_confirmation": True
                },
                "sms_payload": {
                    "phone_number": rx["phone_number"],
                    "sms_text": sms_script
                }
            })

            # -------------------------------------------------------------
            # TRIGGER 2: Pre-Appointment Reminder WITH Reports Checklist
            # -------------------------------------------------------------
            if rx["follow_up_date"]:
                fol_date = rx["follow_up_date"]
                if diag_count > 0:
                    if patient_lang == "KANNADA":
                        fol_voice = f"ನಮಸ್ಕಾರ {patient_name} ಅವರೇ, {doc} ಅವರೊಂದಿಗೆ ನಿಮ್ಮ ಮುಂದಿನ ಭೇಟಿ {fol_date} ರಂದು ನಿಗದಿಯಾಗಿದೆ. ಆಸ್ಪತ್ರೆಗೆ ಬರುವಾಗ ನಿಮ್ಮ {test_names_str} ವರದಿಗಳನ್ನು (Reports) ತಪ್ಪದೇ ತೆಗೆದುಕೊಂಡು ಬನ್ನಿ."
                        fol_sms = f"ಆರೋಗ್ಯವಾಣಿ ನೆನಪೋಲೆ: {doc} ಅವರೊಂದಿಗೆ ಭೇಟಿ {fol_date}. ಮುಖ್ಯ ಸೂಚನೆ: ನಿಮ್ಮ {test_names_str} ವರದಿಗಳನ್ನು ತಪ್ಪದೇ ತನ್ನಿ!"
                    elif patient_lang == "HINDI":
                        fol_voice = f"नमस्ते {patient_name}, {doc} से आपकी अगली मुलाकात {fol_date} को है। आते समय अपनी {test_names_str} रिपोर्ट साथ लाना न भूलें।"
                        fol_sms = f"आरोग्यवाणी अलर्ट: {doc} से अपॉइंटमेंट {fol_date} को है। आवश्यक: अपनी {test_names_str} रिपोर्ट साथ लाएं।"
                    else:
                        fol_voice = f"Hello {patient_name}, your follow-up appointment with {doc} is scheduled for {fol_date}. Please remember to bring your {test_names_str} reports with you."
                        fol_sms = f"CuraLink Reminder: Follow-up with {doc} on {fol_date}. MANDATORY: Please carry your {test_names_str} reports!"
                else:
                    if patient_lang == "KANNADA":
                        fol_voice = f"ನಮಸ್ಕಾರ {patient_name} ಅವರೇ, {doc} ಅವರೊಂದಿಗೆ ನಿಮ್ಮ ಮುಂದಿನ ಭೇಟಿ {fol_date} ರಂದು ನಿಗದಿಯಾಗಿದೆ. ದಯವಿಟ್ಟು ಕ್ಲಿನಿಕ್‌ಗೆ ಸರಿಯಾದ ಸಮಯಕ್ಕೆ ಬನ್ನಿ."
                        fol_sms = f"ಆರೋಗ್ಯವಾಣಿ: {doc} ಅವರೊಂದಿಗೆ ಭೇಟಿ {fol_date} ರಂದು ನಿಗದಿಯಾಗಿದೆ."
                    elif patient_lang == "HINDI":
                        fol_voice = f"नमस्ते {patient_name}, {doc} से आपकी अगली मुलाकात {fol_date} को है। कृपया समय पर पहुंचें।"
                        fol_sms = f"आरोग्यवाणी: {doc} से अपॉइंटमेंट {fol_date} को है।"
                    else:
                        fol_voice = f"Hello {patient_name}, your follow-up appointment with {doc} is scheduled for {fol_date}. Please visit the clinic on time."
                        fol_sms = f"CuraLink Reminder: Your follow-up with {doc} is on {fol_date}."

                triggers.append({
                    "trigger_id": f"trig-followup-{rx['prescription_id']}",
                    "trigger_type": "FOLLOWUP_REMINDER_WITH_REPORTS",
                    "prescription_id": rx["prescription_id"],
                    "doctor_name": doc,
                    "patient": patient_info,
                    "follow_up_date": fol_date,
                    "follow_up_notes": rx["follow_up_notes"] or "",
                    "required_reports_checklist": test_names_list,
                    "scheduled_dispatch": f"24h_BEFORE_{fol_date}",
                    "voice_call_payload": {
                        "preferred_language": patient_lang,
                        "voice_tts_text": fol_voice,
                        "requires_dtmf_confirmation": True
                    },
                    "sms_payload": {
                        "phone_number": rx["phone_number"],
                        "sms_text": fol_sms
                    }
                })

        conn.close()
        return triggers
