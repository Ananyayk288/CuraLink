# 📞 CuraLink AI Voice Agent & Care Team Escalation Worker

This module is an autonomous background service that connects our **Doctor Consultation Desk** to **Twilio Voice** and **Supabase PostgreSQL**.

---

## 🚀 How the System Works

```
1. Doctor Desk (Port 3001)
   Doctor signs Rx & enables AI call
              │
              ▼
2. Supabase `telephony_triggers` Table
   Row inserted with status: 'QUEUED'
              │
              ▼
3. This Worker (`curalink_voice_escalation_agent.py`)
   Picks up queued job & dials via Twilio Voice
              │
      ┌───────┴────────────────────────┐
      ▼                                ▼
[Patient Answers]             [Patient Doesn't Answer]
Speaks Rx regimen in          Tracks missed call attempts (1, 2, 3)
Kannada / Indian English      If 3 calls missed:
Status: 'COMPLETED'           🚨 AUTO-ESCALATES to `escalations` table!
                                      │
                                      ▼
                              Care Team Portal (Port 3002)
                              Fieldworker visits patient in person!
```

---

## 🔑 1. Pre-Configured Live Supabase Credentials

The database is live and fully seeded. Use these connection credentials:

- **Supabase URL**: `https://dynlezhahqxpcmavvqqe.supabase.co`
- **Anon Public API Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5bmxlemhhaHF4cGNtYXZ2cXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4Njk1MDksImV4cCI6MjEwNzQ0NTUwOX0.pxq5FqAhGKXnzOciYEljhvSan2Z2xaeSug8xZUNwk4s`

---

## 📱 2. Required Twilio Credentials

You will need your Twilio credentials:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER` (E.164 format, e.g. `+1xxxxxxxxxx` or `+91xxxxxxxxxx`)

---

## 🛠️ 3. Quickstart & Installation

### Step 1: Install Python dependencies
```bash
pip install twilio supabase
```

### Step 2: Set environment variables
```bash
export TWILIO_ACCOUNT_SID="your_twilio_sid"
export TWILIO_AUTH_TOKEN="your_twilio_token"
export TWILIO_PHONE_NUMBER="+1xxxxxxxxxx"
```
*(On Windows PowerShell, use `$env:TWILIO_ACCOUNT_SID="your_twilio_sid"`, etc.)*

### Step 3: Run the worker
```bash
python curalink_voice_escalation_agent.py
```

---

## 🗄️ 4. Supabase Database Schema

### Table 1: `telephony_triggers` (Polled by worker)
- `id`: Unique trigger ID (e.g. `trig-rx-17918...`)
- `patient_id`: Patient UHID (e.g. `PAT10001`)
- `patient_phone`: E.164 phone number to dial
- `preferred_language`: `'Kannada'` or `'English'`
- `voice_call_status`: `'QUEUED'` $\rightarrow$ `'IN_PROGRESS'` $\rightarrow$ `'COMPLETED'` / `'FAILED'`
- `payload`: JSONB containing:
  ```json
  {
    "doctor_name": "Dr. Suresh Sharma, MD",
    "medicines": [
      {
        "name": "Metformin 500mg",
        "dosage": "500mg",
        "days": 30,
        "frequency": "1-0-1",
        "meal": "After Food"
      },
      {
        "name": "Glimepiride 1mg",
        "dosage": "1mg",
        "days": 15,
        "frequency": "1-0-0",
        "meal": "Before Food"
      }
    ],
    "diagnostics": [
      { "name": "HbA1c Blood Test", "type": "LAB_TEST", "urgency": "ROUTINE" }
    ],
    "follow_up_date": "2026-11-12"
  }
  ```

### Table 2: `escalations` (Auto-inserted after 3 missed calls)
When a patient fails to answer 3 consecutive calls, this ticket is automatically created:
```sql
INSERT INTO escalations (
    patient_id,
    patient_name,
    patient_phone,
    category,
    priority,
    target,
    notes,
    status,
    escalated_by
) VALUES (
    :patient_id,
    :patient_name,
    :patient_phone,
    'MISSED_CALLS_UNREACHABLE',
    'URGENT',
    'Care Team Fieldworker',
    'Patient did not answer 3 consecutive AI follow-up calls regarding prescription by ' || :doctor_name || '. In-person home visit required.',
    'PENDING',
    'CuraLink AI Voice Agent'
);
```

---

## 🗣️ 5. Multilingual Voice & Speech Details

The worker generates high-quality Amazon Polly neural speech via Twilio:
- **Kannada**: Uses `<Say voice="Polly.Aditi" language="kn-IN">`
  - Explains dosages, timings (`1-0-0` = ಬೆಳಗ್ಗೆ / morning, `1-0-1` = ಬೆಳಗ್ಗೆ ಮತ್ತು ರಾತ್ರಿ / morning & night), and meal relations (`Before Food` = ಊಟಕ್ಕೆ ಮುಂಚೆ, `After Food` = ಊಟದ ನಂತರ).
- **Indian English**: Uses `<Say voice="Polly.Raveena" language="en-IN">`
  - Friendly clinical reminder on behalf of the prescribing physician.
