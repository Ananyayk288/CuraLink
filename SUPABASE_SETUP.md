# 🚀 CuraLink: Complete Supabase Setup Guide

Follow these exact steps to set up Supabase and connect the entire **Care Team**, **Doctor**, and **Pharmacy** ecosystem.

---

## 📌 Step 1: Create a Free Project on Supabase

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New Project** and select your organization.
3. Fill in:
   - **Name**: `CuraLink` (or any name you prefer)
   - **Database Password**: Set a strong password (save it safely)
   - **Region**: Choose the region closest to you (e.g., `South Asia (Mumbai)` / `ap-south-1`)
4. Click **Create new project** and wait ~1-2 minutes for the database to provision.

---

## 📌 Step 2: Run the Master PostgreSQL Schema

1. In your Supabase project dashboard, click on the **SQL Editor** icon in the left navigation sidebar (or press `g` then `s`).
2. Click **+ New query**.
3. Open the file [`supabase_master_schema.sql`](file:///home/anijois/Documents/SEM%203/HACKATHONS/mockmerge2/supabase_master_schema.sql) in this repository.
4. Copy the entire contents of `supabase_master_schema.sql` and paste it into the Supabase SQL Editor.
5. Click **RUN** (or press `Ctrl + Enter` / `Cmd + Enter`).
6. You will see: `Success. No rows returned`.

> [!NOTE]
> This single master schema automatically creates:
> - All 15 core tables (`doctors`, `care_team_users`, `users`, `patients`, `guardians`, `appointments`, `prescriptions`, `prescription_medicines`, `prescription_diagnostics`, `telephony_triggers`, `escalations`, `inventory_items`, `inventory_batches`, `inventory_movements`, `sticker_confirmations`, `dispense_events`, `audit_logs`).
> - The `pharmacy_active_prescriptions` view that links Doctor prescriptions directly to the Pharmacist desk.
> - PostgreSQL triggers that calculate sticker slots (`Morning`, `Afternoon`, `Night`, `Before Food`) and enforce legal prescription immutability.
> - Pre-seeded demo doctors, fieldworkers, patients (`PAT10001`), pending appointments, and pharmacy inventory batches!

---

## 📌 Step 3: Enable Realtime Broadcasts (Verify)

The SQL script already runs `ALTER PUBLICATION supabase_realtime ADD TABLE ...`, but you can verify it in the dashboard:

1. Click on **Database** in the left sidebar, then click **Replication**.
2. Under **supabase_realtime**, make sure the following tables have Realtime enabled (toggle switch is ON):
   - `patients`
   - `appointments`
   - `prescriptions`
   - `escalations`
   - `dispense_events`

---

## 📌 Step 4: Copy API Credentials

1. In the Supabase sidebar, click on **Project Settings** (the gear icon at the bottom left).
2. Click on **API** (under Configuration).
3. Under **Project API keys**, you will see:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **Project API keys -> `anon` / `public`** (starts with `eyJh...`)
4. Keep these two values ready.

---

## 📌 Step 5: Configure `.env.local` for All Portals

Create or update `.env.local` in each of the three portal folders:

### 1. Doctor Portal (`doctor/.env.local`)
Create file `/doctor/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3000
```

### 1. Unified Gateway Portal (`portal/.env.local`)
Create file `/portal/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3000
```

### 2. Doctor Portal (`doctor/.env.local`)
Create file `/doctor/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3001
```

### 3. Care Team Portal (`careteam/.env.local`)
Create file `/careteam/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3002
```

### 4. Pharmacy Portal (`pharmacy/.env.local`)
Create file `/pharmacy/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATA_PROVIDER=supabase
PORT=3003
```

---

## 📌 Step 6: Start All Next.js Portals

From the repository root:

```bash
# Terminal 1: Unified Gateway (Port 3000) — Login / Register for all roles!
npm run dev
# Or: npm run dev:portal -> http://localhost:3000

# Terminal 2: Doctor Portal (Port 3001)
npm run dev:doctor -> http://localhost:3001

# Terminal 3: Care Team Portal (Port 3002)
npm run dev:careteam -> http://localhost:3002

# Terminal 4: Pharmacy Portal (Port 3003)
npm run dev:pharmacy -> http://localhost:3003
```

---

## 🧪 Testing the Complete Flow Live

| Step | Action | Portal / URL | Credentials / Inputs |
|---|---|---|---|
| **0. Unified Gateway** | Unified Sign In & Role Routing | `http://localhost:3000` | Select role or use **1-Click Demo Login** for Doctor, Care Team, or Pharmacy $\rightarrow$ auto-routes to that portal! |
| **1. Care Team** | Sign in as fieldworker | `http://localhost:3002` | Use `CRT10001` / PIN `123456` (or register new worker). |
| | Register a new patient | "Register Patient" tab | Enter Name: `Sunil Rao`, Age: `55`, Literacy: `No` (Illiterate), Phone: `9845111222`, PIN: `123456`. Verify with OTP: `123456`. |
| | **Patient ID Generated** | Modal appears | An ID like `PAT54321` is generated. The system automatically queues a **Pending Appointment** in Supabase! |
| **2. Doctor Desk** | Sign in as doctor | `http://localhost:3001` | ID `DOC84920` / PIN `123456`. |
| | Check Pending Appointments | "Appointments" Queue | You will immediately see `Sunil Rao` (`PAT54321`) with Token Number! |
| | Prescribe Medication | Click "Prescribe" | Select medicines (e.g. `Metformin 500mg`, frequency `1-0-1`, meal `After Food`). |
| | Sign & Submit Prescription | Click "Sign & Submit" | Prescription commits to Supabase. Appointment automatically marks `COMPLETED`. |
| **3. Pharmacy** | Sign in as pharmacist | `http://localhost:3003` | `rajiv.pharmacy@curalink.health` / `pharmacy123` (or click Quick Login). |
| | Patient Lookup | Search Bar / Scanner | Enter patient UHID: `PAT54321` (or scan barcode). |
| | Visual Sticker Guide | Active Prescription Screen | Illiterate patient warning triggers: **"Requires Visual Sticker Guidance"**. Morning (Yellow) and Night (Blue) sticker tags are displayed! |
| | Confirm Stickers & Dispense | Dispensing Desk | Click "Confirm Sticker" on each medicine line, check batch stock, and click **"Dispense All Medicines"**. |
| | Dispense Receipt & Labels | Confirmation Screen | Receipt `RCP-YYYYMMDD-XXXX` is generated, inventory decremented, and sticker labels ready for printing! |
| | Visual Sticker Guide | Active Prescription Screen | Illiterate patient warning triggers: **"Requires Visual Sticker Guidance"**. Morning (Yellow) and Night (Blue) sticker tags are displayed! |
| | Confirm Stickers & Dispense | Dispensing Desk | Click "Confirm Sticker" on each medicine line, check batch stock, and click **"Dispense All Medicines"**. |
| | Dispense Receipt & Labels | Confirmation Screen | Receipt `RCP-YYYYMMDD-XXXX` is generated, inventory decremented, and sticker labels ready for printing! |
