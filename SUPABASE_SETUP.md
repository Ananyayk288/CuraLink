# 🚀 CuraLink: Complete Supabase Setup Guide & Predefined Test Data

Follow these exact steps to set up Supabase and immediately run the entire **Care Team**, **Doctor**, and **Pharmacy** ecosystem with pre-loaded demo records.

---

## 📌 What You Have To Do in Supabase (3 Simple Steps)

### Step 1: Open Your Supabase Project
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your existing project (or click **New Project** and name it `CuraLink`).

### Step 2: Run the Master PostgreSQL Script
1. In the left-hand navigation sidebar, click on **SQL Editor** (icon `>_` or press `g` then `s`).
2. Click **+ New query**.
3. Open [`supabase_master_schema.sql`](file:///home/anijois/Documents/SEM%203/HACKATHONS/mockmerge2/supabase_master_schema.sql) in this repository.
4. Copy the entire contents of [`supabase_master_schema.sql`](file:///home/anijois/Documents/SEM%203/HACKATHONS/mockmerge2/supabase_master_schema.sql) and paste it into the Supabase SQL Editor.
5. Click **RUN** (green button at bottom-right or press `Ctrl + Enter` / `Cmd + Enter`).
6. You will see: **`Success. No rows returned`**.

> [!TIP]
> That's it! Running this single script automatically:
> - Creates all 15 relational tables with primary keys, foreign keys, and indexes.
> - Configures Row-Level Security (RLS) permissive demo policies.
> - Enables live Realtime WebSocket synchronization on tables (`patients`, `appointments`, `escalations`, `prescriptions`, `dispense_events`).
> - Installs automated triggers for sticker dose slot calculation (`Morning`, `Afternoon`, `Night`) and prescription immutability.
> - **Pre-populates rich predefined test data** for doctors, care team workers, patients, queue tokens, prescriptions, diagnostics, AI voice triggers, escalations, and pharmacy inventory!

### Step 3: Verify Your Project URL & Key in `.env.local`
Your project `.env.local` files in each portal folder already point to the live database (`https://dynlezhahqxpcmavvqqe.supabase.co`).
If you are using a new personal Supabase project:
1. Go to **Project Settings** (gear icon at the bottom left) $\rightarrow$ **API**.
2. Copy your **Project URL** (`https://xyzcompany.supabase.co`) and **`anon` / `public` API key**.
3. Paste them into `.env.local` in `portal/`, `doctor/`, `careteam/`, and `pharmacy/`.

---

## 🧪 Predefined Test Data in Your Database

The script pre-populates all essential entities so you can immediately demo every portal without entering manual records from scratch:

### 1. Doctors & Clinical Staff (`doctors` table)
| Doctor ID | Full Name | Department | License | Login PIN |
|---|---|---|---|---|
| **`DOC84920`** | Dr. Suresh Sharma, MD | Internal Medicine & Chronic Care | KMC-84920/MD | **`123456`** |
| **`DOC74921`** | Dr. K. R. Nambiar, MS | Orthopedics & Joint Care | KMC-74921/MS | **`123456`** |
| **`DOC61034`** | Dr. Anita Sen, MD | Nephrology & Renal Medicine | KMC-61034/MD | **`123456`** |

---

### 2. Care Team Fieldworkers (`care_team_users` table)
| CRT ID | Full Name | Role | Phone | Login PIN |
|---|---|---|---|---|
| **`CRT10001`** | Meenakshi Gowda | Lead ASHA Field Coordinator | `+91 98451 00001` | **`123456`** |
| **`CRT10002`** | Rajesh Patil | Care Team Fieldworker | `+91 98451 00002` | **`123456`** |

---

### 3. Pharmacy Counter Staff (`users` table)
| User ID | Full Name | Role | Email | Facility ID |
|---|---|---|---|---|
| `c0a80101-0000-0000-0000-000000000001` | Pharmacist Rajiv | `PHARMACY` | `rajiv.pharmacy@curalink.health` | `fac-city-general` |

---

### 4. Registered Patients & Relational Guardians (`patients` & `guardians` tables)
| UHID / ID | Patient Name | Age/Gender | Language / Device | Conditions | Literacy / Sticker Rule | Guardian Contact |
|---|---|---|---|---|---|---|
| **`PAT10001`** (`pt-ramesh-001`) | **Ramesh Gowda** | 58 / M | Kannada / Feature Phone | Type 2 Diabetes, Diabetic Neuropathy | **Illiterate** (Requires Visual Stickers) | Suresh Gowda (Son) `+91 98801 54321` |
| **`PAT10002`** (`pt-savitha-002`) | **Savitha Devi** | 62 / F | Kannada / Feature Phone | Essential Hypertension Stage II | **Illiterate** (Requires Visual Stickers) | Anitha Devi (Daughter) `+91 94481 99887` |
| **`PAT10003`** (`pt-anand-003`) | **Anand Kumar** | 45 / M | English / Smartphone | Pre-Diabetes, Dyslipidemia | **Literate** (Standard instructions) | Self |
| **`PAT10004`** (`pt-laxmi-004`) | **Laxmamma Bai** | 70 / F | Kannada / Feature Phone | Osteoarthritis, Chronic Joint Pain | **Illiterate** (Requires Visual Stickers) | Manjunath (Son) `+91 98455 33221` |

---

### 5. Appointments & Doctor Queue Tokens (`appointments` table)
| Token | Appointment ID | Patient | Doctor Assigned | Scheduled Time Slot | Reason for Visit | Status |
|---|---|---|---|---|---|---|
| **`TOKEN-01`** | `apt-001` | Ramesh Gowda | Dr. Suresh Sharma | Today • 09:30 AM | Diabetes Follow-up & High Fasting Blood Sugar (192 mg/dL) | `PENDING` |
| **`TOKEN-02`** | `apt-002` | Savitha Devi | Dr. Suresh Sharma | Today • 10:00 AM | BP Spike (164/98 mmHg) & Morning Dizziness | `PENDING` |
| **`TOKEN-03`** | `apt-003` | Anand Kumar | Dr. Suresh Sharma | Today • 11:30 AM | Lipid Profile & Metformin Dose Review | `PENDING` |
| **`TOKEN-04`** | `apt-004` | Laxmamma Bai | Dr. K. R. Nambiar | Today • 02:30 PM | Bilateral Knee Stiffness & Mobility Evaluation | `PENDING` |

---

### 6. Active Prescriptions & Color-Coded Medicines (`prescriptions` & `prescription_medicines` tables)
| Rx ID | Patient | Doctor | Medicines Prescribed | Timing Slots | Color Tag Rule | Meal Relation |
|---|---|---|---|---|---|---|
| **`rx-ramesh-v1`** | Ramesh Gowda | Dr. Suresh Sharma | **Metformin 500mg** | `1-0-1` (Morning & Night) | **Red** (Morning), **Blue** (Night) | After Food |
| | | | **Glimepiride 1mg** | `1-0-0` (Morning) | **Red** (Morning Before Food) | Before Food (15m prior) |
| **`rx-savitha-v1`** | Savitha Devi | Dr. Suresh Sharma | **Amlodipine 10mg** | `1-0-0` (Morning) | **Red** (Morning) | After Food |
| | | | **Atorvastatin 10mg** | `0-0-1` (Night) | **Blue** (Night) | After Food |
| **`rx-anand-v1`** | Anand Kumar | Dr. Suresh Sharma | **Metformin 500mg** | `1-0-0` (Morning) | **Red** (Morning) | After Food |
| | | | **Atorvastatin 20mg** | `0-0-1` (Night) | **Blue** (Night) | After Food |

---

### 7. Diagnostics & Lab Tests (`prescription_diagnostics` table)
| Test ID | Rx ID | Test Name | Urgency | Clinical Instructions | Status |
|---|---|---|---|---|---|
| `diag-001` | `rx-ramesh-v1` | Fasting Blood Sugar & HbA1c | `ROUTINE` | 10-hour overnight fasting required before sample collection | `PENDING` |
| `diag-002` | `rx-savitha-v1` | Lipid Profile & Serum Creatinine | `ROUTINE` | Early morning sample preferred | `PENDING` |
| `diag-003` | `rx-ramesh-v1` | Diabetic Foot Sensory Nerve Exam | `URGENT` | Screen for peripheral neuropathy progression | `PENDING` |

---

### 8. AI Voice Adherence Call Triggers (`telephony_triggers` table)
| Trigger ID | Patient | Phone Number | Language | Trigger Event | Call Status | SMS Status |
|---|---|---|---|---|---|---|
| `tel-ramesh-001` | Ramesh Gowda | `+91 98801 12345` | Kannada | Daily Medication Adherence | `QUEUED` | `QUEUED` |
| `tel-savitha-001` | Savitha Devi | `+91 94481 67890` | Kannada | Daily Medication Adherence | `QUEUED` | `QUEUED` |

---

### 9. Emergency Triage Escalations (`escalations` table)
| Escalation ID | Patient | Priority | Category | Escalated To | Clinical Note | Status |
|---|---|---|---|---|---|---|
| `PAT10001` | Ramesh Gowda | **`CRITICAL`** | `ABNORMAL_VITALS` | Dr. Suresh Sharma, MD | Severe systolic spike (185/110 mmHg) recorded during field visit. Blurred vision reported. | `PENDING` |
| `PAT10002` | Savitha Devi | **`URGENT`** | `MEDICATION_STOCK_OUT` | Dr. Suresh Sharma, MD | Missed BP medication for 2 days due to village supply disruption. | `PENDING` |
| `PAT10004` | Laxmamma Bai | **`URGENT`** | `SEVERE_SYMPTOMS` | Dr. K. R. Nambiar, MS | Acute knee joint swelling and severe pain preventing ambulation. | `PENDING` |

---

### 10. Pharmacy Inventory & Batches (`inventory_items` & `inventory_batches` tables)
| Medicine Name | Generic / Brand | Batch Number | Expiry Date | Stock | Low Stock Alert |
|---|---|---|---|---|---|
| **Metformin 500mg** | Glyciphage | `BTH-MET-2026-01` | +365 days | 120 tabs | $\le$ 30 tabs |
| **Glimepiride 1mg** | Amaryl | `BTH-GLI-2026-01` | +240 days | 60 tabs | $\le$ 20 tabs |
| **Atorvastatin 10mg** | Atorva | `BTH-ATO-2026-01` | +180 days | 45 tabs | $\le$ 15 tabs |
| **Atorvastatin 20mg** | Atorva 20 | `BTH-ATO-2026-02` | +210 days | 40 tabs | $\le$ 15 tabs |
| **Amoxicillin 500mg** | Mox 500 | `BTH-AMX-2026-01` | +300 days | 80 tabs | $\le$ 25 tabs |
| **Amlodipine 10mg** | Norvasc | `BTH-AML-2026-01` | +320 days | 50 tabs | $\le$ 15 tabs |
| **Paracetamol 650mg** | Dolo 650 | `BTH-PCM-2026-01` | +400 days | 150 tabs | $\le$ 40 tabs |
| **Torsemide 10mg** | Dytor 10 | `BTH-TOR-2026-01` | +280 days | 40 tabs | $\le$ 15 tabs |

---

## 🏃 Running All Ecosystem Portals

```bash
# Starts all 4 portals concurrently in a single terminal
npm run dev
```

- **Unified Gateway Portal**: [http://localhost:3000](http://localhost:3000)
- **Doctor Consultation Desk**: [http://localhost:3001](http://localhost:3001)
- **Care Team Field Portal**: [http://localhost:3002](http://localhost:3002)
- **Pharmacy Dispensing & Sticker Desk**: [http://localhost:3003](http://localhost:3003)

