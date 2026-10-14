# CURALINK — Doctor Clinical Coordination Portal
**Integrated Healthcare Coordination & Color-Voice Adherence Platform**

> Designed for HackSprint 2026 • Clean (Hexagonal) Architecture • PostgreSQL & SQLite Immutability Triggers

---

## 🌟 Executive Overview & Clinical Mandates

The **Doctor Portal** serves as the clinical authority in the Arogyavani ecosystem. It directly implements the clinical requirements specified in the official Hackathon Project Report:

1. **Left Sidebar Navigation**: Seamless, responsive left-hand navigation bar providing instant access to the Command Center, Enrolled Patients Directory (8 rich demo profiles), New Patient Registration, AI Call Triage, and Pharmacy Substitutions.
2. **Command Center Focused on Pending Consultations**: The Command Center displays high-level clinic metrics at the top and focuses strictly on **Today's Pending Appointments Queue** with token numbers, appointment slots, patient literacy indicators, and clinical reasons for visit.
3. **3-Tab Clinical Encounter Workspace**:
   - **Tab 1: New Prescription & Medication Regimen ("Medical Thing")**:
     - Attending doctor attribution (`Dr. Suresh Sharma, MD`).
     - Diagnosis & Patient Symptoms notes with **strict word-limit enforcement** (max 300 words).
     - **Pre-fed Medication Regimen Table** with autocomplete for 40+ common Indian medicines, No. of Days, How Many Times (frequency), Meal Relation (Before/After Food), and assigned physical Color Sticker code (Morning: Red, Afternoon: Green, Night: Blue).
     - **AI Voice Reminder & SMS Trigger Toggle** (Supabase Realtime / Webhook activator).
     - Atomic submission: symptoms, notes, medicines, and doctor name are sealed together into the database.
   - **Tab 2: Prescription History (Read-Only)**:
     - Legal audit trail showing all past prescriptions with Doctor Name, Date/Time, Diagnosis, Symptoms, and Revision numbers.
   - **Tab 3: Medication History (Read-Only)**:
     - Chronological historical log of all individual medications prescribed across visits with Days, Frequency, Meal Relation, Color Sticker, Prescribing Doctor, and Date.
4. **Database-Enforced Prescription Immutability**: Committed clinical prescriptions cannot be updated or deleted. Database triggers actively reject `UPDATE` and `DELETE` at the SQL engine level. Corrections spawn append-only revisions (`v1 -> v2`).
5. **AI Calling Agent Integration Specification**: Documented architecture in [`AI_CALLING_AGENT_ARCHITECTURE.md`](file:///home/anijois/Documents/SEM%203/HACKATHONS/hacksprint/AI_CALLING_AGENT_ARCHITECTURE.md) detailing how the outbound voice calling engine and companion SMS gateway ingest triggers from the doctor's medication regimen.

---

## 🚀 Quick Start (Next.js Architecture)

Runs on Next.js 14 App Router with full-stack TypeScript API routes, Tailwind CSS, and Supabase integration:

```bash
# 1. Install dependencies
npm install

# 2. Run the Next.js Doctor Portal Server in development mode
npm run dev

# Or build and run production server
npm run build
npm start

# 3. Open in your browser:
http://localhost:3001
```

---

## 🏗️ Clean Architecture Structure

```
hacksprint/
├── src/
│   ├── domain/               # Core Domain Layer
│   │   └── models.py         # Entities, Enums, Value Objects & Invariants
│   ├── db/                   # Database & Persistence Layer
│   │   ├── database.py       # SQLite connection & Immutability Triggers
│   │   ├── schema_postgres.sql # Production PostgreSQL / Supabase migration
│   │   └── seed.py           # Demo dataset: 8 diverse patients & 5 pending appointments
│   ├── usecases/             # Application Use Cases
│   │   └── doctor_usecases.py# Registration, 3-tab encounter, Regimen atomic submission, triggers
│   ├── api/                  # Interface Adapters
│   │   └── router.py         # Appendix A REST API Router + Telephony trigger feeds
│   └── server.py             # HTTP Server entrypoint
├── public/                   # Doctor Portal Web Frontend (Tailwind + Lucide)
│   ├── index.html            # Left Sidebar layout, Command Center, 3-Tab Encounter Workspace
│   ├── app.js                # Autocomplete formulary, word count, reactive state, calling simulator
│   └── style.css             # High-contrast color-sticker styles & sidebar navigation
├── tests/
│   └── test_doctor_portal.py # Automated test suite (13 tests verifying all clinical rules)
├── AI_CALLING_AGENT_ARCHITECTURE.md # Architecture specification for the calling agent developer
└── main.py                   # One-click startup script
```

---

## 🎯 7-Step Hackathon Judge Demo Script

1. **Pending Appointments Queue in Command Center**:
   - Show the left sidebar navigation and the pending appointment cards (Tokens #01 through #05) for today.
   - Point out Ramesh Gowda (TOKEN-01, Low Literacy, Kannada) and Savitha Devi (TOKEN-02, Dual Escalation alert).
2. **Open the 3-Tab Clinical Encounter**:
   - Click **`[Open Encounter]`** on Ramesh Gowda.
   - Show the 3 distinct tabs:
     - **Tab 1: New Prescription & Medication Regimen**
     - **Tab 2: Prescription History (Read-Only)**
     - **Tab 3: Medication History (Read-Only)**
3. **Inspect Read-Only History Tabs (Tabs 2 & 3)**:
   - Click **`Tab 2: Prescription History`**: Show past Revision v1 with Doctor Name (`Dr. Suresh Sharma, MD`), date, symptoms, and diagnosis.
   - Click **`Tab 3: Medication History`**: Show the chronological log of Metformin 500mg, 30 days, Red Sticker, prescribed by Dr. Suresh Sharma.
4. **Build New Prescription with Pre-fed Medication Regimen Table (Tab 1)**:
   - Switch back to **Tab 1**.
   - Type in the Symptoms box and show the live word counter enforcing the **300-word limit**.
   - In the **Medication Regimen Table**, start typing `"Telmi"` or `"Panto"` in the medicine box and show the instant pre-fed autocomplete suggestions popping up!
   - Select No. of Days (e.g. 30), Frequency (`1-0-1 Twice Daily`), Meal Relation (`After Food`), and assigned Color Sticker.
5. **Activate the AI Calling Agent & SMS Trigger**:
   - Highlight the dedicated toggle button: `[⚡ AI Voice Reminder & SMS Trigger: ACTIVE]`.
   - Click **`[Submit Prescription & Medication Regimen]`**.
   - Show how symptoms, medicines, and doctor name are atomically committed to the database.
6. **Show Calling Agent Architecture for Developer Handoff**:
   - Click **`[Calling Agent Architecture]`** in the left sidebar or open [`AI_CALLING_AGENT_ARCHITECTURE.md`](file:///home/anijois/Documents/SEM%203/HACKATHONS/hacksprint/AI_CALLING_AGENT_ARCHITECTURE.md).
   - Explain how the AI calling agent takes the exact medication regimen, speaks the physical color sticker in Kannada for illiterate patients, and sends an SMS.
7. **Live Telephony & Dual Escalation Reaction**:
   - Open the **AI Calling Simulator** drawer, select Savitha Devi, and simulate missed calls.
   - Watch the **Red Dual-Escalation Banner** flash across the screen!

---

## 📡 Implemented REST APIs

| Endpoint | Method | Scope | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/doctor/stats` | `GET` | Doctor | Dashboard KPIs & pending appointments counter |
| `/api/v1/doctor/appointments/pending` | `GET` | Doctor | Returns today's queue of pending appointments |
| `/api/v1/doctor/patient-encounter/{id}` | `GET` | Doctor | Returns patient data, read-only prescription history, & medication history |
| `/api/v1/doctor/prescriptions/submit-complete` | `POST` | Doctor | Atomically commits symptoms, doctor name, medication regimen, and triggers |
| `/api/v1/telephony/pending-triggers` | `GET` | AI Calling Agent | Feeder endpoint returning patient literacy, phone, and medication regimen |
| `/api/v1/doctor/patients` | `GET` | Doctor | 8 demo patients directory with literacy & adherence filters |
| `/api/v1/patients/register` | `POST` | Doctor | Onboards patient with literacy and device profile |
| `/api/v1/prescriptions/{id}` | `DELETE` | All | **Blocked (HTTP 405)**: Committed prescriptions cannot be deleted |
| `/api/v1/prescriptions/{id}/test-immutability` | `POST` | Doctor | Proves database trigger active protection |
| `/api/v1/doctor/tasks/pending` | `GET` | Doctor | Retrieves AI-extracted voice call tasks |
| `/api/v1/tasks/{id}/approve` | `POST` | Doctor | Human-in-the-loop validation of candidate tasks |
| `/api/v1/doctor/substitutions/pending` | `GET` | Doctor | Pharmacy out-of-stock substitution queue |
| `/api/v1/doctor/substitutions/{id}/review` | `POST` | Doctor | Approves generic and auto-spawns revision |
| `/api/v1/telephony/simulate-call` | `POST` | Internal | Interactive telephony and DTMF simulator |
| `/api/v1/escalations/{id}/resolve` | `POST` | Doctor | Resolves dual escalation incident with clinical notes |
