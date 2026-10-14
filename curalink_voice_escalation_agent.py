#!/usr/bin/env python3
"""
CuraLink AI Voice Agent & Care Team Escalation Worker
Monitors Supabase for doctor prescription triggers, dials via Twilio Voice,
and automatically escalates missed calls to the Care Team fieldworker portal.
"""

import os
import time
from twilio.rest import Client as TwilioClient
from supabase import create_client, Client as SupabaseClient

# ============================================================
# CONFIGURATION
# ============================================================
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://dynlezhahqxpcmavvqqe.supabase.co")
SUPABASE_KEY = os.getenv(
    "SUPABASE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5bmxlemhhaHF4cGNtYXZ2cXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4Njk1MDksImV4cCI6MjEwNzQ0NTUwOX0.pxq5FqAhGKXnzOciYEljhvSan2Z2xaeSug8xZUNwk4s",
)

TWILIO_ACCOUNT_SID  = os.getenv("TWILIO_ACCOUNT_SID", "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
TWILIO_AUTH_TOKEN   = os.getenv("TWILIO_AUTH_TOKEN", "your_auth_token_here")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "+1xxxxxxxxxx")

MAX_CALL_ATTEMPTS = 3
POLL_INTERVAL_SECONDS = 5

supabase: SupabaseClient = create_client(SUPABASE_URL, SUPABASE_KEY)
twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# In-memory dictionary tracking missed call attempts per trigger: { trigger_id: count }
call_attempt_tracker = {}

# ============================================================
# SPEECH GENERATION (Kannada & Indian English)
# ============================================================
def build_spoken_twiml(language: str, payload: dict) -> str:
    doctor_name = payload.get("doctor_name", "your doctor")
    medicines = payload.get("medicines", [])
    diagnostics = payload.get("diagnostics", [])
    follow_up = payload.get("follow_up_date", "")

    is_kannada = str(language).strip().lower() == "kannada"
    voice = "Polly.Aditi" if is_kannada else "Polly.Raveena"
    lang_code = "kn-IN" if is_kannada else "en-IN"

    med_lines = []
    for m in medicines:
        name = m.get("name", "Medicine")
        freq = m.get("frequency", "1-0-0")
        meal = m.get("meal", "After Food")
        days = m.get("days", 15)

        freq_text = "once a day in the morning"
        if freq == "1-0-1":
            freq_text = "twice a day, morning and night"
        elif freq == "1-1-1":
            freq_text = "three times a day, morning, afternoon, and night"
        elif freq == "0-0-1":
            freq_text = "once a day at night"

        med_lines.append(f"{name}, {freq_text}, {meal}, for {days} days.")

    meds_summary = " ".join(med_lines)
    diag_summary = f"Also remember your tests: {', '.join([d.get('name', '') for d in diagnostics])}." if diagnostics else ""
    followup_summary = f"Your next clinic visit is scheduled on {follow_up}." if follow_up else ""

    if is_kannada:
        speech = (
            f"ನಮಸ್ಕಾರ, ಕ್ಯೂರಾಲಿಂಕ್ ಆರೋಗ್ಯ ಸೇವೆಯಿಂದ ಕರೆ ಮಾಡುತ್ತಿದ್ದೇವೆ. "
            f"ಡಾಕ್ಟರ್ {doctor_name} ಅವರು ನಿಮ್ಮ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ನೀಡಿದ್ದಾರೆ. "
            f"ನಿಮ್ಮ ಔಷಧಿಗಳು: {meds_summary} "
            f"{diag_summary} {followup_summary} "
            f"ದಯವಿಟ್ಟು ಮಾತ್ರೆಗಳನ್ನು ಸರಿಯಾದ ಸಮಯಕ್ಕೆ ತೆಗೆದುಕೊಳ್ಳಿ. ಆರೋಗ್ಯವಾಗಿರಿ."
        )
    else:
        speech = (
            f"Hello, this is CuraLink Healthcare calling on behalf of {doctor_name}. "
            f"Here is your medication guidance: {meds_summary} "
            f"{diag_summary} {followup_summary} "
            f"Please take your medicines on time as prescribed. Take care and get well soon."
        )

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="{voice}" language="{lang_code}">{speech}</Say>
    <Pause length="1"/>
    <Say voice="{voice}" language="{lang_code}">Thank you. Goodbye.</Say>
</Response>"""

# ============================================================
# CARE TEAM ESCALATION (Triggered on 3 Missed Calls)
# ============================================================
def trigger_care_team_escalation(patient_id: str, patient_name: str, patient_phone: str, doctor_name: str):
    print(f"\n🚨 [ESCALATION] Patient {patient_name} ({patient_phone}) unreachable after {MAX_CALL_ATTEMPTS} attempts!")
    
    escalation_entry = {
        "patient_id": patient_id,
        "patient_name": patient_name,
        "patient_phone": patient_phone or "Not Provided",
        "category": "MISSED_CALLS_UNREACHABLE",
        "priority": "URGENT",
        "target": "Care Team Fieldworker",
        "notes": f"Patient did not answer {MAX_CALL_ATTEMPTS} consecutive AI follow-up calls regarding prescription by {doctor_name}. Immediate in-person home visit required.",
        "status": "PENDING",
        "escalated_by": "CuraLink AI Voice Agent"
    }

    try:
        supabase.table("escalations").insert(escalation_entry).execute()
        print(f"✅ Escalation ticket filed in Supabase! Care Team fieldworker portal alerted.")
    except Exception as err:
        print(f"❌ Failed to insert escalation ticket: {err}")

# ============================================================
# MAIN POLLING LOOP
# ============================================================
def run_telephony_daemon():
    print("🎧 CuraLink AI Voice & Escalation Worker Active.")
    print("Connecting to Supabase and polling for queued doctor prescriptions...")

    while True:
        try:
            # 1. Fetch queued calls
            res = supabase.table("telephony_triggers") \
                .select("*") \
                .eq("voice_call_status", "QUEUED") \
                .order("created_at", desc=False) \
                .limit(5) \
                .execute()

            jobs = res.data or []
            for job in jobs:
                trigger_id = job["id"]
                patient_id = job.get("patient_id", "UNKNOWN")
                phone = job.get("patient_phone")
                language = job.get("preferred_language", "Kannada")
                payload = job.get("payload", {})
                doctor_name = payload.get("doctor_name", "Doctor")
                patient_name = payload.get("patient_name") or f"Patient ({patient_id})"

                attempts = call_attempt_tracker.get(trigger_id, 0) + 1
                call_attempt_tracker[trigger_id] = attempts
                print(f"\n⚡ New Call Job: {trigger_id} | Attempt {attempts}/{MAX_CALL_ATTEMPTS} | Calling: {phone}")

                # 2. Mark IN_PROGRESS
                supabase.table("telephony_triggers") \
                    .update({"voice_call_status": "IN_PROGRESS"}) \
                    .eq("id", trigger_id) \
                    .execute()

                # 3. Dial through Twilio Voice
                call_succeeded = False
                try:
                    twiml_body = build_spoken_twiml(language, payload)
                    call = twilio_client.calls.create(
                        twiml=twiml_body,
                        to=phone,
                        from_=TWILIO_PHONE_NUMBER
                    )
                    print(f"📞 Twilio Call Dispatched! SID: {call.sid}")
                    call_succeeded = True
                except Exception as twilio_err:
                    print(f"⚠️ Twilio Call Error: {twilio_err}")
                    call_succeeded = False

                # 4. Handle Result & Escalation Trigger
                if call_succeeded:
                    supabase.table("telephony_triggers") \
                        .update({"voice_call_status": "COMPLETED"}) \
                        .eq("id", trigger_id) \
                        .execute()
                    print(f"🎉 Call completed successfully for {patient_id}")
                    if trigger_id in call_attempt_tracker:
                        del call_attempt_tracker[trigger_id]
                else:
                    if attempts >= MAX_CALL_ATTEMPTS:
                        # 3 Missed Calls reached -> Fail call and Escalate to Care Team
                        supabase.table("telephony_triggers") \
                            .update({"voice_call_status": "FAILED"}) \
                            .eq("id", trigger_id) \
                            .execute()
                        trigger_care_team_escalation(patient_id, patient_name, phone, doctor_name)
                        if trigger_id in call_attempt_tracker:
                            del call_attempt_tracker[trigger_id]
                    else:
                        # Re-queue for next retry attempt
                        print(f"🔄 Re-queuing trigger for retry {attempts + 1}/{MAX_CALL_ATTEMPTS}...")
                        supabase.table("telephony_triggers") \
                            .update({"voice_call_status": "QUEUED"}) \
                            .eq("id", trigger_id) \
                            .execute()

        except Exception as loop_err:
            print(f"⚠️ Polling loop error: {loop_err}")

        time.sleep(POLL_INTERVAL_SECONDS)

if __name__ == "__main__":
    run_telephony_daemon()
