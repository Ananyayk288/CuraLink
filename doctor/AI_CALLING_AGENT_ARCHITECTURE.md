# CURALINK — AI Calling Agent & SMS Dispatcher Architecture
**Developer Specification: Dual-Trigger Telephony Engine for Medication Adherence, Diagnostic Scans, and Follow-Up Report Reminders**

> **Author**: CURALINK Platform Core Architecture Team  
> **Target Audience**: AI Telephony & Calling Agent Developer (Friend / Integration Partner)  
> **Integration Goal**: Consume Doctor Portal triggers to automate:
> 1. **Immediate Call & SMS**: Low-literacy color-sticker medicine reminders AND diagnostic scan/lab test preparation guidelines (fasting, etc.).
> 2. **Pre-Appointment Call & SMS**: Scheduled reminder for the upcoming doctor visit explicitly instructing the patient to **bring their scan/test reports**.

---

## 1. System Overview & The Dual Closed Loop

When Dr. Suresh Sharma submits a prescription in the Doctor Portal with the **"AI Voice Reminder & SMS Dual Trigger"** enabled, the system generates **two distinct operational triggers**:

```
┌────────────────────────────────────────────────────────┐
│                   DOCTOR PORTAL                        │
│ - Selects Mode: Normal Rx | Scan/Test | Comprehensive  │
│ - Types Symptoms (max 300 words)                       │
│ - Orders Medication Regimen (Autocomplete + Stickers)  │
│ - Orders Diagnostic Scans / Lab Tests (Prep notes)     │
│ - Sets Doctor Follow-Up Date & Purpose                 │
│ - Enables Supabase Telephony Trigger: ON               │
└───────────────────────────┬────────────────────────────┘
                            │ Atomic Database Commit
                            ▼
┌────────────────────────────────────────────────────────┐
│           SUPABASE / REST TELEPHONY FEEDER             │
│          GET /api/v1/telephony/pending-triggers        │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
   [DISPATCH: IMMEDIATE]      [DISPATCH: 24h PRIOR TO FOLLOW-UP]
               ▼                          ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│  TRIGGER 1: PRIMARY ORDER    │ │  TRIGGER 2: REPORT REMINDER  │
│  - Medicine Regimen Call     │ │  - Follow-up Visit Alert     │
│  - Color Sticker Voice TTS   │ │  - MANDATORY Report Reminder │
│  - Diagnostic Prep (Fasting) │ │  - Voice + SMS Checklist     │
│  - Companion SMS Sent        │ │  - Companion SMS Sent        │
└──────────────┬───────────────┘ └──────────────┬───────────────┘
               │                                │
               └──────────────┬─────────────────┘
                              ▼ Keypad / Speech Input
┌────────────────────────────────────────────────────────┐
│             PATIENT RESPONSE INGESTION                 │
│         POST /api/v1/telephony/adherence-gather        │
│  • DTMF 1 = Dose Confirmed Taken / Test Completed      │
│  • DTMF 2 = Help Requested (Routed to AI Triage Desk)  │
│  • DTMF 3 = Snoozed (15-min bounded retry)             │
│  • 3 Consecutive Missed Calls = DUAL ESCALATION ALERT  │
└────────────────────────────────────────────────────────┘
```

---

## 2. Trigger Ingestion Options

You can consume triggers using either of the following two mechanisms:

### Method A: Supabase Realtime CDC / Database Webhook (Cloud Production)
Configure a Supabase Webhook on the `prescriptions` table:
- **Event**: `INSERT` or `UPDATE` where `status = 'COMMITTED'` and `telephony_trigger_enabled = 1`.
- **Target URL**: Your AI Calling Agent Webhook endpoint (e.g., `https://your-agent.com/webhook/doctor-triggers`).

### Method B: REST Polling Feeder (Hackathon / Local Testing)
Poll the Arogyavani platform periodically (e.g., every 5 to 10 seconds):
```http
GET http://localhost:8080/api/v1/telephony/pending-triggers
```

---

## 3. Trigger Data Contracts (JSON Schemas)

The endpoint returns an array of active trigger objects. Note how each trigger defines its `trigger_type`, target dispatch time, localized voice TTS script, and companion SMS text:

### Trigger 1 Payload: Immediate Order & Adherence Dispatch (`SCAN_TEST_ORDERED` or `COMPREHENSIVE_ORDER`)

```json
{
  "trigger_id": "trig-primary-rx-ramesh-v1",
  "trigger_type": "COMPREHENSIVE_ORDER",
  "prescription_id": "rx-ramesh-v1",
  "doctor_name": "Dr. Suresh Sharma, MD",
  "scheduled_dispatch": "IMMEDIATE",
  "patient": {
    "id": "pt-ramesh-001",
    "uhid": "ARV-2026-001",
    "name": "Ramesh Gowda",
    "phone_number": "+919880112345",
    "literacy_status": "ILLITERATE",
    "preferred_language": "KANNADA",
    "device_type": "FEATURE_PHONE",
    "guardian": {
      "name": "Manjunath Gowda (Son)",
      "phone": "+919880154321",
      "consent": true
    }
  },
  "medication_regimen": [
    {
      "medicine_name": "Metformin Hydrochloride",
      "dosage": "500mg",
      "no_of_days": 30,
      "frequency": "1-0-1 (Twice Daily)",
      "meal_relation": "After Food",
      "color_sticker": "PINK",
      "symbol": "CIRCLE",
      "voice_prompt_hint": "Packet with PINK Sticker (CIRCLE)"
    }
  ],
  "diagnostic_orders": [
    {
      "id": "diag-001",
      "test_type": "LAB_TEST",
      "test_name": "HbA1c (Glycated Hemoglobin)",
      "instructions": "Fasting 8-10 hours required. Morning sample.",
      "status": "PENDING"
    },
    {
      "id": "diag-002",
      "test_type": "SCAN",
      "test_name": "Chest X-Ray (PA View)",
      "instructions": "Routine imaging. Remove metallic objects.",
      "status": "PENDING"
    }
  ],
  "voice_call_payload": {
    "preferred_language": "KANNADA",
    "voice_tts_text": "ನಮಸ್ಕಾರ ರಮೇಶ್ ಗೌಡ ಅವರೇ, ನಾನು ಆರೋಗ್ಯವಾಣಿ ಕ್ಲಿನಿಕ್‌ನಿಂದ ಕರೆ ಮಾಡುತ್ತಿದ್ದೇನೆ. ಡಾ. ಸುರೇಶ್ ಶರ್ಮಾ ಅವರು ನಿಮಗೆ ಔಷಧಿಗಳೊಂದಿಗೆ HbA1c ಮತ್ತು ಎದೆಯ ಎಕ್ಸ್-ರೇ ಪರೀಕ್ಷೆಗಳನ್ನು ಸೂಚಿಸಿದ್ದಾರೆ. ದಯವಿಟ್ಟು ನಾಳೆ ಬೆಳಿಗ್ಗೆ ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ ಪರೀಕ್ಷಾ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ.",
    "requires_dtmf_confirmation": true
  },
  "sms_payload": {
    "phone_number": "+919880112345",
    "sms_text": "ಆರೋಗ್ಯವಾಣಿ: ಡಾ. ಸುರೇಶ್ ಶರ್ಮಾ ಅವರು ಔಷಧಿಗಳು ಮತ್ತು HbA1c, ಎದೆಯ ಎಕ್ಸ್-ರೇ ಪರೀಕ್ಷೆಗಳನ್ನು ಸೂಚಿಸಿದ್ದಾರೆ. ದಯವಿಟ್ಟು ಪರೀಕ್ಷೆ ಮಾಡಿಸಿಕೊಳ್ಳಿ."
  }
}
```

---

### Trigger 2 Payload: Pre-Appointment Follow-up Reminder WITH Reports Checklist (`FOLLOWUP_REMINDER_WITH_REPORTS`)

Scheduled by your worker **24 to 48 hours prior to `follow_up_date`**:

```json
{
  "trigger_id": "trig-followup-rx-ramesh-v1",
  "trigger_type": "FOLLOWUP_REMINDER_WITH_REPORTS",
  "prescription_id": "rx-ramesh-v1",
  "doctor_name": "Dr. Suresh Sharma, MD",
  "follow_up_date": "2026-11-12",
  "follow_up_notes": "Review HbA1c & Creatinine reports; adjust Metformin if HbA1c > 7.5%",
  "required_reports_checklist": [
    "HbA1c (Glycated Hemoglobin)",
    "Chest X-Ray (PA View)"
  ],
  "scheduled_dispatch": "24h_BEFORE_2026-11-12",
  "patient": {
    "id": "pt-ramesh-001",
    "uhid": "ARV-2026-001",
    "name": "Ramesh Gowda",
    "phone_number": "+919880112345",
    "literacy_status": "ILLITERATE",
    "preferred_language": "KANNADA",
    "device_type": "FEATURE_PHONE"
  },
  "voice_call_payload": {
    "preferred_language": "KANNADA",
    "voice_tts_text": "ನಮಸ್ಕಾರ ರಮೇಶ್ ಗೌಡ ಅವರೇ, ಡಾ. ಸುರೇಶ್ ಶರ್ಮಾ ಅವರೊಂದಿಗೆ ನಿಮ್ಮ ಮುಂದಿನ ಭೇಟಿ 2026-11-12 ರಂದು ನಿಗದಿಯಾಗಿದೆ. ಆಸ್ಪತ್ರೆಗೆ ಬರುವಾಗ ನಿಮ್ಮ HbA1c ಮತ್ತು ಎಕ್ಸ್-ರೇ ವರದಿಗಳನ್ನು (Reports) ತಪ್ಪದೇ ತೆಗೆದುಕೊಂಡು ಬನ್ನಿ.",
    "requires_dtmf_confirmation": true
  },
  "sms_payload": {
    "phone_number": "+919880112345",
    "sms_text": "ಆರೋಗ್ಯವಾಣಿ ನೆನಪೋಲೆ: ಡಾ. ಸುರೇಶ್ ಶರ್ಮಾ ಅವರೊಂದಿಗೆ ಭೇಟಿ 2026-11-12. ಮುಖ್ಯ ಸೂಚನೆ: ನಿಮ್ಮ HbA1c ಮತ್ತು ಎಕ್ಸ್-ರೇ ವರದಿಗಳನ್ನು ತಪ್ಪದೇ ತನ್ನಿ!"
  }
}
```

---

## 4. Voice Prompt Dialogue Rules & Scripts

Your voice synthesis engine (ElevenLabs, Google Cloud TTS, or Azure Speech) **must branch based on literacy status**:

### A. For Low-Literacy / Rural Patients (`literacy_status == "ILLITERATE"`)
1. **Never read complex chemical drug names.** Refer strictly to the **physical color sticker** and **shape symbol** (e.g., *Pink Circle*, *Blue Triangle*, *Yellow Star*).
2. Use simple vernacular instructions with meal relations (*"ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ"* for before food, *"ಊಟದ ನಂತರ"* for after food).
3. If diagnostic tests are ordered, clearly state the test name and fasting requirement (*"ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ ಲ್ಯಾಬ್‌ಗೆ ಭೇಟಿ ನೀಡಿ"*).

#### Full Kannada Voice Script (Immediate Call):
> *"ನಮಸ್ಕಾರ ರಮೇಶ್ ಗೌಡ ಅವರೇ, ನಾನು ಆರೋಗ್ಯವಾಣಿ ಕ್ಲಿನಿಕ್‌ನಿಂದ ಕರೆ ಮಾಡುತ್ತಿದ್ದೇನೆ.  
> ಡಾ. ಸುರೇಶ್ ಶರ್ಮಾ ಅವರು ಸೂಚಿಸಿದ **ಗುಲಾಬಿ ಬಣ್ಣದ (PINK CIRCLE)** ಮಾತ್ರೆ ಮೆಟ್‌ಫಾರ್ಮಿನ್ ಅನ್ನು ಊಟದ ನಂತರ ತೆಗೆದುಕೊಳ್ಳಿ.  
> ಹಾಗೂ ಅವರು ನಿಮಗೆ **HbA1c ರಕ್ತ ಪರೀಕ್ಷೆ** ಮತ್ತು **ಎದೆಯ ಎಕ್ಸ್-ರೇ** ಮಾಡಿಸಿಕೊಳ್ಳಲು ಸೂಚಿಸಿದ್ದಾರೆ. ದಯವಿಟ್ಟು ನಾಳೆ ಬೆಳಿಗ್ಗೆ ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ ಪರೀಕ್ಷಾ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ.  
> ಮಾತ್ರೆ ತೆಗೆದುಕೊಂಡಿದ್ದರೆ **1** ಒತ್ತಿ. ಸಹಾಯ ಬೇಕಿದ್ದರೆ **2** ಒತ್ತಿ."*

#### Full Hindi Voice Script (Immediate Call):
> *"नमस्ते रमेश गौड़ा जी, मैं आरोग्यवाणी क्लिनिक से बोल रहा हूँ।  
> डॉ. सुरेश शर्मा द्वारा बताई गई **गुलाबी (PINK) स्टिकर** वाली दवाई खाना खाने के बाद लें।  
> और उन्होंने आपके लिए **HbA1c ब्लड टेस्ट** और **चेस्ट एक्स-रे** जांच लिखी है। कृपया खाली पेट जांच केंद्र जाएं।  
> दवाई ले ली है तो **1** दबाएं। मदद चाहिए तो **2** दबाएं।"*

#### English Voice Script (Immediate Call):
> *"Hello Ramesh Gowda, this is Arogyavani Clinic.  
> Dr. Suresh Sharma has prescribed your medication (Packet with PINK Circle sticker) to be taken after food.  
> The doctor has also ordered diagnostic investigations: HbA1c blood test and Chest X-Ray. Please complete these tests before your next review.  
> Press 1 to confirm dosage. Press 2 if you need clinic assistance."*

---

### B. Pre-Appointment Follow-up Reminder Dialogue (Trigger 2)

#### Kannada Script (Pre-Visit Reminder):
> *"ನಮಸ್ಕಾರ ರಮೇಶ್ ಗೌಡ ಅವರೇ, ಡಾ. ಸುರೇಶ್ ಶರ್ಮಾ ಅವರೊಂದಿಗೆ ನಿಮ್ಮ ಮುಂದಿನ ಭೇಟಿ ನವೆಂಬರ್ 12 ರಂದು ನಿಗದಿಯಾಗಿದೆ.  
> **ಮುಖ್ಯ ನೆನಪೋಲೆ:** ಆಸ್ಪತ್ರೆಗೆ ಬರುವಾಗ ನಿಮ್ಮ **HbA1c ಮತ್ತು ಎಕ್ಸ್-ರೇ ವರದಿಗಳನ್ನು (Reports)** ತಪ್ಪದೇ ತೆಗೆದುಕೊಂಡು ಬನ್ನಿ.  
> ಭೇಟಿಯನ್ನು ಖಚಿತಪಡಿಸಲು **1** ಒತ್ತಿ."*

#### Hindi Script (Pre-Visit Reminder):
> *"नमस्ते रमेश गौड़ा जी, डॉ. सुरेश शर्मा से आपकी अगली मुलाकात 12 नवंबर को है।  
> **महत्वपूर्ण सूचना:** डॉक्टर से मिलने आते समय अपनी **HbA1c और एक्स-रे रिपोर्ट** अवश्य साथ लाएं।  
> पुष्टि के लिए **1** दबाएं।"*

#### English Script (Pre-Visit Reminder):
> *"Hello Ramesh Gowda, reminder that your follow-up with Dr. Suresh Sharma is scheduled for 12 November.  
> **IMPORTANT:** Please remember to carry your **HbA1c and Chest X-Ray reports** with you to the clinic.  
> Press 1 to confirm your attendance."*

---

## 5. Keypad DTMF & Speech Webhook Callback

When the patient presses a key on their phone keypad, your telephony server (Twilio / Exotel / Plivo / Asterisk) **must send an HTTP POST request** to the Arogyavani backend:

```http
POST /api/v1/telephony/adherence-gather
Content-Type: application/json

{
  "patient_id": "pt-ramesh-001",
  "digits": "1",
  "provider_outcome": "ANSWERED",
  "call_duration_seconds": 42
}
```

### DTMF Response Matrix:

| Keypad Input | Meaning | Backend Action |
|:---|:---|:---|
| **DTMF 1** | Dose taken / Test appointment acknowledged | Records `TAKEN_REPORTED`. Resets missed calls counter to `0`. |
| **DTMF 2** | Patient unwell / Confusion / Needs help | Records `HELP_REQUESTED`. Speech transcript automatically creates a candidate task on the **Doctor's AI Call Triage Desk**. |
| **DTMF 3** | Snooze / Remind later | Records `SNOOZED`. Queues an automated retry call in **15 minutes**. |
| **No Answer / Busy** | Unanswered call | Records `NO_ANSWER`. Increments `consecutive_missed_calls`. |
| **Network Drop** | Carrier network error | Records `PROVIDER_FAILED`. Does **not** penalize the patient's adherence score. |

---

## 6. Safety Escalation & Bounded Retry State Machine

To protect rural patients from harassment while guaranteeing clinical safety:

```
[Trigger Due] ──► Call Attempt 1
                     ├── Answered (DTMF 1) ──► Done (Adherence Logged)
                     ├── Answered (DTMF 2) ──► Create AI Triage Task for Doctor
                     └── No Answer / Busy
                           ├── Wait 15 Minutes
                           └── Call Attempt 2
                                 ├── Answered ──► Process DTMF
                                 └── No Answer / Busy
                                       ├── Contact Guardian Phone (if consent granted)
                                       └── Call Attempt 3
                                             └── No Answer ──► THRESHOLD BREACHED (3 Missed)
                                                                 │
                                                                 ▼
                                                  DISPATCH DUAL ESCALATION ALERT:
                                                  Simultaneous Red Flashing Alert to:
                                                  1. Treating Doctor Command Center
                                                  2. Hospital Care Coordinator Desk
```

### Strict Quiet-Hours Constraint:
- **No automated voice calls between 9:00 PM and 7:00 AM.**
- If a scheduled dose falls in quiet hours, queue the reminder call for **7:05 AM**.

---

## 7. Developer Implementation Checklist for Your Friend

- [ ] Connect worker to `GET /api/v1/telephony/pending-triggers` (or Supabase CDC webhook).
- [ ] Parse `trigger_type`:
  - `SCAN_TEST_ORDERED` / `COMPREHENSIVE_ORDER` $\rightarrow$ Run Trigger 1 (Immediate Medication & Scan Prep Call).
  - `FOLLOWUP_REMINDER_WITH_REPORTS` $\rightarrow$ Run Trigger 2 (24h Pre-Appointment Call with Report Checklist).
- [ ] For `ILLITERATE` patients: Synthesize voice referencing **Color Stickers & Shapes** in their `preferred_language`.
- [ ] For Scans & Lab tests: State specific instructions (e.g., *"Fasting 8-10 hours required"*).
- [ ] For Follow-ups: Include the **mandatory report-carrying warning**.
- [ ] Post keypad DTMF responses back to `POST /api/v1/telephony/adherence-gather`.
- [ ] Dispatch companion SMS in the same language.
- [ ] Enforce the 3-attempt retry limit and quiet-hours policy.
