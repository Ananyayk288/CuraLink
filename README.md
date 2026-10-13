# CuraLink — Connected Healthcare Ecosystem (Wholly Next.js)

CuraLink connects **Care Team Fieldworkers**, **Doctors**, and **Pharmacists** into an interconnected clinical workflow backed by **Supabase PostgreSQL**.

---

## 🏗️ Architecture & Portals

All three portals are 100% **Next.js** applications designed to run simultaneously on dedicated local ports:

| Portal | Role | Directory | Port | Primary Features |
|---|---|---|---|---|
| **Care Team Portal** | ASHA Fieldworkers | [`careteam/`](file:///home/anijois/Documents/SEM%203/HACKATHONS/mockmerge2/careteam) | `http://localhost:3001` | Patient registration, literacy & caregiver capture, UHID generation, automatic consultation queueing |
| **Doctor Portal** | Clinical Specialists | [`doctor/`](file:///home/anijois/Documents/SEM%203/HACKATHONS/mockmerge2/doctor) | `http://localhost:3000` | Real-time pending appointments queue, clinical consultation desk, medication regimens, sticker slot planning, diagnostics orders |
| **Pharmacy Portal** | Pharmacists | [`pharmacy/`](file:///home/anijois/Documents/SEM%203/HACKATHONS/mockmerge2/pharmacy) *(symlink `pharmcy`)* | `http://localhost:3002` | Patient UHID lookup, visual sticker verification (Morning/Afternoon/Night/Before Food), inventory batch deduction, atomic dispensing & receipt |

---

## 🔄 End-to-End Clinical Flow

```mermaid
sequenceDiagram
    autonumber
    actor C as Care Team Fieldworker (Port 3001)
    actor D as Doctor (Port 3000)
    actor P as Pharmacist (Port 3002)
    participant S as Supabase PostgreSQL

    Note over C: 1. Patient Registration
    C->>S: Registers patient (Name, Age, Literacy, Phone, Language, PIN, Guardian)
    S-->>C: Assigns UHID (e.g. PAT10001)
    C->>S: Auto-queues pending appointment in `appointments` table

    Note over D: 2. Clinical Consultation
    D->>S: Fetches pending appointments queue
    S-->>D: Returns queued patient with Token Number & Intake Reason
    D->>S: Signs & commits prescription (`status = 'COMMITTED'`, dosage, frequencies `1-0-1`)
    S->>S: Trigger computes sticker dose slots (Morning/Night) & before-food flag
    D->>S: Updates appointment status to `COMPLETED`

    Note over P: 3. Sticker Verification & Dispensing
    P->>S: Enters or scans Patient UHID (`PAT10001`)
    S-->>P: Returns active prescription via `pharmacy_active_prescriptions`
    alt Patient is Illiterate
        P->>P: System alerts: "Requires Visual Sticker Guidance"
    end
    P->>P: Confirms physical sticker application for each medicine
    P->>S: Clicks "Dispense All Medicines" (Atomic RPC transaction)
    S->>S: Decrements batch stock, logs audit ledger & dispense event
    S-->>P: Generates Receipt (RCP-YYYYMMDD-XXXX) & Prints dosing slips
```

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
# Install all 3 portals in one command
npm run install:all
```

### 2. Configure Supabase (.env.local)
In each portal directory (`careteam/`, `doctor/`, `pharmacy/`), copy `.env.example` to `.env.local` and configure your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run the Portals
Open three terminal tabs (or run from root):
```bash
# Terminal 1: Doctor Portal (Port 3000)
npm run dev:doctor

# Terminal 2: Care Team Portal (Port 3001)
npm run dev:careteam

# Terminal 3: Pharmacy Portal (Port 3002)
npm run dev:pharmacy
```

---

## 🗄️ Supabase Setup Instructions

See [`SUPABASE_SETUP.md`](file:///home/anijois/Documents/SEM%203/HACKATHONS/mockmerge2/SUPABASE_SETUP.md) for full step-by-step instructions and the master schema [`supabase_master_schema.sql`](file:///home/anijois/Documents/SEM%203/HACKATHONS/mockmerge2/supabase_master_schema.sql).
