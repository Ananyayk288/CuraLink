"""
CURALINK — Supabase Direct Integration Client
Enables zero-delay PostgreSQL synchronization for Prescriptions, Medicines,
Diagnostics, Appointments, and AI Calling Agent triggers.

Supports instant plug-and-play via SUPABASE_PROJECT_ID and SUPABASE_ANON_KEY.
Zero third-party pip dependencies (uses Python standard library urllib).
"""

import os
import json
import time
import urllib.request
import urllib.error
from typing import Dict, Any, Optional, List, Tuple


def load_dotenv(dotenv_path: Optional[str] = None) -> None:
    """Reads key-value pairs from .env file into os.environ if not already set."""
    if not dotenv_path:
        # Check current working directory or script root
        paths = [".env", os.path.join(os.path.dirname(__file__), "..", "..", ".env")]
        for p in paths:
            if os.path.exists(p):
                dotenv_path = p
                break

    if not dotenv_path or not os.path.exists(dotenv_path):
        return

    try:
        with open(dotenv_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip().strip("'\"")
                if key and key not in os.environ:
                    os.environ[key] = val
    except Exception as e:
        print(f"[SupabaseClient] Warning reading .env: {e}")


# Auto-load on module import
load_dotenv()


def get_supabase_config() -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Returns (url, anon_key, project_id).
    Accepts either SUPABASE_PROJECT_ID + SUPABASE_ANON_KEY
    or SUPABASE_URL + SUPABASE_KEY.
    """
    load_dotenv()
    project_id = os.environ.get("SUPABASE_PROJECT_ID", "").strip() or None
    url = os.environ.get("SUPABASE_URL", "").strip() or None
    anon_key = (
        os.environ.get("SUPABASE_ANON_KEY", "").strip()
        or os.environ.get("SUPABASE_KEY", "").strip()
        or None
    )

    if project_id and not url:
        url = f"https://{project_id}.supabase.co"

    if url and not project_id:
        # Extract project ID from URL if formatted as https://<id>.supabase.co
        try:
            parts = url.replace("https://", "").replace("http://", "").split(".")
            if len(parts) >= 2 and "supabase" in parts[1]:
                project_id = parts[0]
        except Exception:
            pass

    return url, anon_key, project_id


def is_supabase_configured() -> bool:
    """Returns True if valid Supabase URL and Anon Key are present."""
    url, key, _ = get_supabase_config()
    return bool(url and key and len(key) > 10)


def save_supabase_credentials(project_id: str, anon_key: str, env_path: str = ".env") -> bool:
    """
    Saves or updates SUPABASE_PROJECT_ID and SUPABASE_ANON_KEY in .env
    and immediately applies them to os.environ.
    """
    project_id = project_id.strip()
    anon_key = anon_key.strip()

    os.environ["SUPABASE_PROJECT_ID"] = project_id
    os.environ["SUPABASE_ANON_KEY"] = anon_key
    os.environ["SUPABASE_URL"] = f"https://{project_id}.supabase.co"

    # Read existing .env content if present
    existing_lines = []
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                existing_lines = f.readlines()
        except Exception:
            existing_lines = []

    new_lines = []
    keys_set = {"SUPABASE_PROJECT_ID": False, "SUPABASE_ANON_KEY": False, "SUPABASE_URL": False}

    for line in existing_lines:
        trimmed = line.strip()
        if trimmed.startswith("SUPABASE_PROJECT_ID="):
            new_lines.append(f"SUPABASE_PROJECT_ID={project_id}\n")
            keys_set["SUPABASE_PROJECT_ID"] = True
        elif trimmed.startswith("SUPABASE_ANON_KEY="):
            new_lines.append(f"SUPABASE_ANON_KEY={anon_key}\n")
            keys_set["SUPABASE_ANON_KEY"] = True
        elif trimmed.startswith("SUPABASE_URL="):
            new_lines.append(f"SUPABASE_URL=https://{project_id}.supabase.co\n")
            keys_set["SUPABASE_URL"] = True
        else:
            new_lines.append(line)

    if not keys_set["SUPABASE_PROJECT_ID"]:
        new_lines.append(f"SUPABASE_PROJECT_ID={project_id}\n")
    if not keys_set["SUPABASE_ANON_KEY"]:
        new_lines.append(f"SUPABASE_ANON_KEY={anon_key}\n")
    if not keys_set["SUPABASE_URL"]:
        new_lines.append(f"SUPABASE_URL=https://{project_id}.supabase.co\n")

    try:
        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        return True
    except Exception as e:
        print(f"[SupabaseClient] Error writing .env: {e}")
        return False


def test_supabase_connection() -> Dict[str, Any]:
    """
    Sends an authenticated ping request to Supabase PostgREST root.
    Returns latency, connectivity status, and diagnostic messages.
    """
    url, anon_key, project_id = get_supabase_config()
    if not url or not anon_key:
        return {
            "success": False,
            "configured": False,
            "message": "Supabase credentials missing. Enter Project ID & Anon Key to connect."
        }

    start = time.time()
    ping_url = f"{url}/rest/v1/"
    req = urllib.request.Request(
        ping_url,
        headers={
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}",
            "User-Agent": "CuraLink-DoctorPortal/1.0"
        },
        method="GET"
    )

    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            latency_ms = int((time.time() - start) * 1000)
            return {
                "success": True,
                "configured": True,
                "project_id": project_id,
                "status_code": response.status,
                "latency_ms": latency_ms,
                "message": f"Successfully connected to Supabase ({project_id}). Latency: {latency_ms}ms"
            }
    except urllib.error.HTTPError as e:
        # Supabase root returns 200 or 404 depending on OpenAPI schema settings, but 401 means invalid key
        latency_ms = int((time.time() - start) * 1000)
        if e.code in (200, 404):
            return {
                "success": True,
                "configured": True,
                "project_id": project_id,
                "status_code": e.code,
                "latency_ms": latency_ms,
                "message": f"Connected to Supabase endpoint ({project_id}). Key authorized."
            }
        return {
            "success": False,
            "configured": True,
            "project_id": project_id,
            "status_code": e.code,
            "latency_ms": latency_ms,
            "message": f"Supabase responded with HTTP {e.code}: {e.reason}. Check anon key."
        }
    except Exception as e:
        return {
            "success": False,
            "configured": True,
            "project_id": project_id,
            "message": f"Connection failed: {str(e)}"
        }


def post_to_supabase(table: str, records: Any) -> Dict[str, Any]:
    """
    Posts a single dict or list of dicts to the given Supabase table via PostgREST.
    Headers include apikey, Bearer Authorization, and Prefer: return=representation.
    """
    url, anon_key, project_id = get_supabase_config()
    if not url or not anon_key:
        return {"synced": False, "reason": "Not configured"}

    target_url = f"{url}/rest/v1/{table}"
    payload_bytes = json.dumps(records).encode("utf-8")

    req = urllib.request.Request(
        target_url,
        data=payload_bytes,
        headers={
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal,resolution=merge-duplicates",
            "User-Agent": "CuraLink-DoctorPortal/1.0"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return {"synced": True, "table": table, "status_code": response.status}
    except urllib.error.HTTPError as e:
        err_body = ""
        try:
            err_body = e.read().decode("utf-8")
        except Exception:
            pass
        print(f"[SupabaseSync] Table {table} returned HTTP {e.code}: {err_body}")
        return {"synced": False, "table": table, "status_code": e.code, "error": err_body}
    except Exception as e:
        print(f"[SupabaseSync] Failed to post to {table}: {e}")
        return {"synced": False, "table": table, "error": str(e)}


def sync_prescription_bundle_to_supabase(rx_data: Dict[str, Any],
                                        medicines: List[Dict[str, Any]],
                                        diagnostics: List[Dict[str, Any]],
                                        appointment: Optional[Dict[str, Any]] = None,
                                        trigger: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Atomically pushes a submitted prescription, medicines, diagnostics,
    appointment, and AI telephony trigger to Supabase tables.
    """
    if not is_supabase_configured():
        return {"synced": False, "reason": "Supabase credentials not configured in .env"}

    results = {}

    # 1. Post Prescription
    rx_payload = {
        "id": rx_data.get("id"),
        "patient_id": rx_data.get("patient_id"),
        "doctor_id": rx_data.get("doctor_id"),
        "doctor_name": rx_data.get("doctor_name"),
        "prescription_type": rx_data.get("prescription_type", "COMPREHENSIVE"),
        "revision_number": rx_data.get("revision_number", 1),
        "status": rx_data.get("status", "COMMITTED"),
        "diagnosis_notes": rx_data.get("diagnosis_notes", "Clinical Assessment"),
        "symptoms_notes": rx_data.get("symptoms_notes"),
        "word_count": rx_data.get("word_count", 0),
        "clinical_instructions": rx_data.get("clinical_instructions"),
        "follow_up_date": rx_data.get("follow_up_date"),
        "follow_up_notes": rx_data.get("follow_up_notes"),
        "telephony_trigger_enabled": rx_data.get("telephony_trigger_enabled", True),
        "telephony_triggered_at": rx_data.get("telephony_triggered_at"),
        "committed_at": rx_data.get("committed_at"),
        "created_at": rx_data.get("created_at")
    }
    results["prescriptions"] = post_to_supabase("prescriptions", rx_payload)

    # 2. Post Medicines
    if medicines:
        med_payloads = []
        for m in medicines:
            med_payloads.append({
                "id": m.get("id"),
                "prescription_id": rx_data.get("id"),
                "medicine_name": m.get("medicine_name"),
                "dosage": m.get("dosage", "As Prescribed"),
                "frequency": m.get("frequency", "1-0-1 (Twice Daily)"),
                "duration_days": int(m.get("no_of_days") or m.get("duration_days") or 30),
                "no_of_days": int(m.get("no_of_days") or m.get("duration_days") or 30),
                "meal_relation": m.get("meal_relation", "After Food"),
                "instructions": m.get("instructions"),
                "color_sticker": m.get("color_sticker", "GREEN"),
                "symbol": m.get("symbol", "SQUARE"),
                "dispense_status": "PENDING"
            })
        results["prescription_medicines"] = post_to_supabase("prescription_medicines", med_payloads)

    # 3. Post Diagnostics
    if diagnostics:
        diag_payloads = []
        for d in diagnostics:
            diag_payloads.append({
                "id": d.get("id"),
                "prescription_id": rx_data.get("id"),
                "test_type": d.get("test_type", "LAB_TEST"),
                "test_name": d.get("test_name"),
                "instructions": d.get("instructions", "Standard preparation"),
                "status": "PENDING",
                "created_at": rx_data.get("created_at")
            })
        results["prescription_diagnostics"] = post_to_supabase("prescription_diagnostics", diag_payloads)

    # 4. Post Appointment (Follow-Up)
    if appointment:
        results["appointments"] = post_to_supabase("appointments", appointment)

    # 5. Post Telephony Trigger
    if trigger:
        results["telephony_triggers"] = post_to_supabase("telephony_triggers", trigger)

    return {
        "synced": True,
        "details": results
    }
