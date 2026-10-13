# CURALINK — Care Team Portal (Field & Triage Workstation)

Role-specific healthcare portal built for frontline healthcare workers (ASHA workers, care coordinators, field triage officers).

---

## 🌟 Authentication & Two-Tab Interface

### Care Team Auth & Onboarding:
- **Registration**: Full Name, Age, Phone Number, Email ID, 6-digit PIN, Confirm PIN.
- **Verification**: Hardcoded verification (simulated code `123456` with 1-click test fill).
- **ID Generation**: Unique identifier format: **`CRT` followed by 5 digits** (e.g., `CRT10243`).
- **Registration Success Screen**: Displays generated CRT ID in **BIG** text, demographic details small, and excludes the PIN field.
- **Login**: Instant login using CRT ID / Phone / Email + 6-digit PIN, with 1-click demo login option.

### Tab 1: Register Patient
- **Patient Personal Details**:
  - Full Name, Age, Phone number, Address, 6-digit access PIN (with confirm PIN).
  - **Literacy Status** (Boolean toggle): Distinguishes literate patients (SMS instructions) from illiterate patients (flagged for automated vernacular Voice IVR).
  - Gender & Preferred Language (English, Kannada).
- **Guardian / Primary Caregiver Section**:
  - Optional toggle to attach a guardian (same fields: Name, Age, Phone, Literacy, Address, Relationship).
  - One-click **"Copy Address from Patient"** utility.
- **OTP Verification Flow**:
  - On submission, an interactive OTP modal opens.
  - Simulates dispatch to Patient (+91 XXXXX) and Guardian (+91 YYYYY).
  - **Hardcoded Demo OTP**: `123456`.
  - 1-Click **"Auto-Fill Mock OTP"** button for fast hackathon demonstrations.
  - Once verified, commits record to Supabase and generates a unique UHID (format: `PAT` followed by 5 digits, e.g. `PAT10243`).
  - Displays generated Patient ID with close button.

### Tab 2: Escalate Issue
- **Patient Selector**: Searchable combobox linking all registered patients (including new enrollments from Tab 1).
- **Triage Urgency / Severity**:
  - 🔵 **ROUTINE** (Follow-up within 48h)
  - 🟡 **URGENT** (Action required within 12h)
  - 🔴 **CRITICAL / EMERGENCY** (Immediate intervention / doctor alert)
- **Incident Category**: Severe Symptoms, Missed Critical Medication, Abnormal Vitals (BP spike / Glucose), Suspected Drug Adverse Reaction, Urgent Home Visit Needed.
- **Escalation Targets**: On-Duty PHC Physician, Specialist Tele-Consult, Taluk Emergency EMS, Pharmacy Officer.
- **Live Escalation Queue**: Incident feed tracking status (`PENDING`, `ACKNOWLEDGED`, `RESOLVED`).

---

## 🚀 Quick Start

From the `careteam/` directory:
```bash
npm install
npm run dev
```

Or from the root directory:
```bash
npm run dev:careteam
```

The portal runs on **[http://localhost:3001](http://localhost:3001)** (leaving port 3000 free for the Doctor Portal).

---

## 🗄️ Supabase PostgreSQL Setup

1. Copy the script in [`supabase_schema.sql`](./supabase_schema.sql).
2. Open your [Supabase Dashboard](https://supabase.com/dashboard) -> **SQL Editor** -> Paste & **Run**.
3. Add your keys to `.env.local` or directly click the **"Supabase (Setup)"** button in the portal header:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsIn...
   ```
4. *Zero Blockers*: The portal includes a resilient in-memory and local storage fallback, so all features (registration, OTP verification, and issue escalation) work immediately even before Supabase credentials are provided!
