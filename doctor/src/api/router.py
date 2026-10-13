"""
CURALINK — REST API Router (Clean Architecture Interface Adapter)
Implements all routes in Appendix A of the project report.
"""

import json
import re
from typing import Dict, Any, Tuple, Optional
from src.usecases.doctor_usecases import DoctorUseCases
from src.db.supabase_client import (
    is_supabase_configured,
    get_supabase_config,
    save_supabase_credentials,
    test_supabase_connection
)


class ApiRouter:
    def __init__(self, use_cases: DoctorUseCases):
        self.use_cases = use_cases

    def route_request(self, method: str, path: str, query_params: Dict[str, Any], body: Optional[Dict[str, Any]] = None) -> Tuple[int, Dict[str, Any]]:
        """Dispatches HTTP request to domain use cases and returns (status_code, json_dict)."""
        try:
            # 1. Doctor Dashboard KPI Stats
            if method == "GET" and path == "/api/v1/doctor/stats":
                doctor_id = query_params.get("doctor_id", ["doc-1"])[0]
                stats = self.use_cases.get_dashboard_kpis(doctor_id)
                return 200, {"success": True, "data": stats}

            # 1b. Pending Appointments Queue (Command Center)
            elif method == "GET" and path == "/api/v1/doctor/appointments/pending":
                doctor_id = query_params.get("doctor_id", ["doc-1"])[0]
                appointments = self.use_cases.get_pending_appointments(doctor_id)
                return 200, {"success": True, "data": appointments}

            # 1c. Patient Encounter Data for 3-Tab Workspace
            match_enc = re.match(r"^/api/v1/doctor/patient-encounter/([^/]+)$", path)
            if method == "GET" and match_enc:
                patient_id = match_enc.group(1)
                enc_data = self.use_cases.get_patient_encounter_data(patient_id)
                return 200, {"success": True, "data": enc_data}

            # 1d. Submit Complete Prescription & Medication Regimen (Atomic)
            elif method == "POST" and path == "/api/v1/doctor/prescriptions/submit-complete":
                if not body:
                    return 400, {"error": "Missing request body."}
                doctor_id = body.get("doctor_id", "doc-1")
                doctor_name = body.get("doctor_name", "Dr. Suresh Sharma, MD")
                patient_id = body.get("patient_id")
                appointment_id = body.get("appointment_id")
                res = self.use_cases.submit_new_prescription(
                    doctor_id=doctor_id,
                    doctor_name=doctor_name,
                    patient_id=patient_id,
                    appointment_id=appointment_id,
                    data=body
                )
                return 201, {"success": True, "data": res}

            # 1e. Telephony Triggers Feeder (For AI Calling Agent & SMS service)
            elif method == "GET" and path == "/api/v1/telephony/pending-triggers":
                triggers = self.use_cases.get_pending_telephony_triggers()
                return 200, {"success": True, "data": triggers}

            # 1f. Pre-fed Diagnostics Library (Scans & Lab Tests autocomplete)
            elif method == "GET" and path == "/api/v1/doctor/diagnostics/prefed":
                diags = self.use_cases.get_prefed_diagnostics()
                return 200, {"success": True, "data": diags}

            # 1g. Supabase Connection Status & Health Ping
            elif method == "GET" and path == "/api/v1/doctor/supabase/status":
                url, key, proj_id = get_supabase_config()
                do_ping = query_params.get("ping", ["false"])[0].lower() == "true"
                ping_res = test_supabase_connection() if do_ping else None
                return 200, {
                    "success": True,
                    "configured": is_supabase_configured(),
                    "project_id": proj_id,
                    "supabase_url": url,
                    "has_anon_key": bool(key),
                    "ping_success": ping_res.get("success") if ping_res else None,
                    "ping_latency_ms": ping_res.get("latency_ms") if ping_res else None,
                    "ping_message": ping_res.get("message") if ping_res else None
                }

            # 1h. Supabase Dynamic Credentials Configuration
            elif method == "POST" and path == "/api/v1/doctor/supabase/configure":
                if not body:
                    return 400, {"success": False, "error": "Missing JSON request body."}
                project_id = body.get("project_id", "").strip()
                anon_key = body.get("anon_key", "").strip()
                if not project_id or not anon_key:
                    return 400, {"success": False, "error": "Both project_id and anon_key are required."}
                saved = save_supabase_credentials(project_id, anon_key)
                ping_res = test_supabase_connection()
                return 200, {
                    "success": True,
                    "saved": saved,
                    "configured": is_supabase_configured(),
                    "project_id": project_id,
                    "ping": ping_res
                }

            # 2. Patient Directory
            elif method == "GET" and path == "/api/v1/doctor/patients":
                search = query_params.get("search", [None])[0]
                literacy = query_params.get("literacy", [None])[0]
                patients = self.use_cases.get_patients_list(search=search, literacy=literacy)
                return 200, {"success": True, "data": patients}

            # 3. Patient Registration (Appendix A: POST /api/v1/patients/register)
            elif method == "POST" and path == "/api/v1/patients/register":
                if not body:
                    return 400, {"error": "Missing request body."}
                doctor_id = body.get("doctor_id", "doc-1")
                res = self.use_cases.register_patient(doctor_id, body)
                return 201, {"success": True, "data": res}

            # 4. Patient Chart (Appendix A: GET /api/v1/patients/{id}/profile)
            match_pt = re.match(r"^/api/v1/patients/([^/]+)/profile$", path)
            if method == "GET" and match_pt:
                patient_id = match_pt.group(1)
                chart = self.use_cases.get_patient_chart(patient_id)
                return 200, {"success": True, "data": chart}

            # 5. Prescription Draft (Appendix A: POST /api/v1/prescriptions/draft)
            elif method == "POST" and path == "/api/v1/prescriptions/draft":
                if not body:
                    return 400, {"error": "Missing request body."}
                res = self.use_cases.draft_prescription(
                    doctor_id=body.get("doctor_id", "doc-1"),
                    patient_id=body["patient_id"],
                    medicines=body["medicines"],
                    diagnosis_notes=body.get("diagnosis_notes", "Clinical observation notes"),
                    clinical_instructions=body.get("clinical_instructions"),
                    follow_up_date=body.get("follow_up_date"),
                    draft_id=body.get("draft_id")
                )
                return 200, {"success": True, "data": res}

            # 6. Prescription Commit (Appendix A: POST /api/v1/prescriptions/{id}/commit)
            match_commit = re.match(r"^/api/v1/prescriptions/([^/]+)/commit$", path)
            if method == "POST" and match_commit:
                rx_id = match_commit.group(1)
                doctor_id = (body or {}).get("doctor_id", "doc-1")
                res = self.use_cases.commit_prescription(doctor_id, rx_id)
                return 200, {"success": True, "data": res}

            # 7. Prescription Revise (Appendix A: POST /api/v1/prescriptions/{id}/revise)
            match_revise = re.match(r"^/api/v1/prescriptions/([^/]+)/revise$", path)
            if method == "POST" and match_revise:
                parent_id = match_revise.group(1)
                if not body:
                    return 400, {"error": "Missing request body."}
                res = self.use_cases.revise_prescription(
                    doctor_id=body.get("doctor_id", "doc-1"),
                    parent_prescription_id=parent_id,
                    reason=body.get("reason", "Clinical adjustment"),
                    medicines=body["medicines"],
                    diagnosis_notes=body.get("diagnosis_notes"),
                    clinical_instructions=body.get("clinical_instructions"),
                    follow_up_date=body.get("follow_up_date")
                )
                return 201, {"success": True, "data": res}

            # 8. Prescription Immutability Delete Guard (Appendix A: DELETE /api/v1/prescriptions/{id})
            match_del = re.match(r"^/api/v1/prescriptions/([^/]+)$", path)
            if method == "DELETE" and match_del:
                # Appendix A: "All roles: blocked; reject with 405 or 403 per API policy."
                return 405, {
                    "error": "Method Not Allowed (405): Committed clinical prescriptions are legally immutable and cannot be deleted.",
                    "legal_rule": "CuraLink enforces append-only revision lineages. Use POST /api/v1/prescriptions/{id}/revise instead."
                }

            # 9. Interactive Immutability Proof Test (for demo/judge testing)
            match_test_imm = re.match(r"^/api/v1/prescriptions/([^/]+)/test-immutability$", path)
            if method == "POST" and match_test_imm:
                rx_id = match_test_imm.group(1)
                res = self.use_cases.test_immutability_violation(rx_id)
                return 200, {"success": True, "data": res}

            # 10. AI Tasks List & Approval (Appendix A: POST /api/v1/tasks/{id}/approve)
            if method == "GET" and path == "/api/v1/doctor/tasks/pending":
                tasks = self.use_cases.get_pending_ai_tasks()
                return 200, {"success": True, "data": tasks}

            match_task_app = re.match(r"^/api/v1/tasks/([^/]+)/approve$", path)
            if method == "POST" and match_task_app:
                task_id = match_task_app.group(1)
                doctor_id = (body or {}).get("doctor_id", "doc-1")
                decision = (body or {}).get("decision", "APPROVE")
                notes = (body or {}).get("notes")
                res = self.use_cases.review_ai_task(doctor_id, task_id, decision, notes)
                return 200, {"success": True, "data": res}

            # 11. Pharmacy Substitution Proposals
            if method == "GET" and path == "/api/v1/doctor/substitutions/pending":
                subs = self.use_cases.get_pending_substitutions()
                return 200, {"success": True, "data": subs}

            match_sub_rev = re.match(r"^/api/v1/doctor/substitutions/([^/]+)/review$", path)
            if method == "POST" and match_sub_rev:
                sub_id = match_sub_rev.group(1)
                doctor_id = (body or {}).get("doctor_id", "doc-1")
                decision = (body or {}).get("decision", "APPROVE")
                notes = (body or {}).get("notes")
                res = self.use_cases.review_substitution(doctor_id, sub_id, decision, notes)
                return 200, {"success": True, "data": res}

            # 12. Telephony Adherence Ingestion (Appendix A: POST /api/v1/telephony/adherence-gather)
            if method == "POST" and path == "/api/v1/telephony/adherence-gather":
                if not body:
                    return 400, {"error": "Missing payload"}
                # DTMF Mapping per Section 5.4:
                # 1: TAKEN_REPORTED
                # 2: HELP_REQUESTED
                # 3: SNOOZED
                dtmf = str(body.get("digits", "1"))
                status_map = {
                    "1": "TAKEN_REPORTED",
                    "2": "HELP_REQUESTED",
                    "3": "SNOOZED"
                }
                status = status_map.get(dtmf, "TAKEN_REPORTED")
                res = self.use_cases.record_adherence_event(
                    patient_id=body["patient_id"],
                    medicine_id=body.get("medicine_id"),
                    status=status,
                    response_mode=f"DTMF_{dtmf}",
                    provider_outcome=body.get("provider_outcome", "ANSWERED")
                )
                return 200, {"success": True, "data": res}

            # 13. Telephony Interactive Call Simulator (For Demo)
            if method == "POST" and path == "/api/v1/telephony/simulate-call":
                if not body:
                    return 400, {"error": "Missing payload"}
                pt_id = body["patient_id"]
                call_type = body.get("call_type", "DTMF_1_TAKEN")
                
                if call_type == "DTMF_1_TAKEN":
                    res = self.use_cases.record_adherence_event(
                        patient_id=pt_id,
                        medicine_id=body.get("medicine_id"),
                        status="TAKEN_REPORTED",
                        response_mode="DTMF_1",
                        provider_outcome="ANSWERED"
                    )
                elif call_type == "DTMF_2_HELP":
                    res = self.use_cases.record_adherence_event(
                        patient_id=pt_id,
                        medicine_id=body.get("medicine_id"),
                        status="HELP_REQUESTED",
                        response_mode="DTMF_2",
                        provider_outcome="ANSWERED"
                    )
                elif call_type == "NO_ANSWER_QUALIFYING":
                    res = self.use_cases.record_adherence_event(
                        patient_id=pt_id,
                        medicine_id=body.get("medicine_id"),
                        status="NO_ANSWER",
                        response_mode="NO_ANSWER",
                        provider_outcome="NO_ANSWER"
                    )
                elif call_type == "NETWORK_FAILURE":
                    res = self.use_cases.record_adherence_event(
                        patient_id=pt_id,
                        medicine_id=body.get("medicine_id"),
                        status="PROVIDER_FAILED",
                        response_mode="NO_ANSWER",
                        provider_outcome="NETWORK_FAILED"
                    )
                else:
                    return 400, {"error": f"Unknown call type: {call_type}"}

                return 200, {"success": True, "data": res}

            # 14. Escalation Resolution
            match_esc_res = re.match(r"^/api/v1/escalations/([^/]+)/resolve$", path)
            if method == "POST" and match_esc_res:
                pt_id = match_esc_res.group(1)
                doctor_id = (body or {}).get("doctor_id", "doc-1")
                notes = (body or {}).get("notes", "Patient contacted by clinical staff; care plan reinforced.")
                res = self.use_cases.resolve_escalation(doctor_id, pt_id, notes)
                return 200, {"success": True, "data": res}

            # 15. Pharmacy Scoped View (Appendix A: GET /api/v1/pharmacy/patient/{id}/active)
            match_pharm = re.match(r"^/api/v1/pharmacy/patient/([^/]+)/active$", path)
            if method == "GET" and match_pharm:
                pt_id = match_pharm.group(1)
                chart = self.use_cases.get_patient_chart(pt_id)
                # Filter strictly to latest committed medicines, exclude diagnosis notes
                latest_committed = [rx for rx in chart["prescriptions"] if rx["status"] == "COMMITTED"]
                if not latest_committed:
                    return 200, {"success": True, "data": {"patient_uhid": chart["patient"]["patient_uhid"], "medicines": []}}
                
                latest_rx = latest_committed[-1]
                return 200, {
                    "success": True,
                    "data": {
                        "patient_uhid": chart["patient"]["patient_uhid"],
                        "literacy_status": chart["patient"]["literacy_status"],
                        "preferred_language": chart["patient"]["preferred_language"],
                        "revision_number": latest_rx["revision_number"],
                        "medicines": latest_rx["medicines"]  # Color sticker & symbols only, no diagnosis notes!
                    }
                }

            return 404, {"error": f"API route not found: {method} {path}"}

        except ValueError as ve:
            return 400, {"error": str(ve)}
        except Exception as e:
            return 500, {"error": f"Internal Server Error: {str(e)}"}
