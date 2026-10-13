# CuraLink — Pharmacy Portal

> **A coordination aid — not an autonomous medical decision-maker.**  
> Built strictly for the CuraLink Care Coordination Platform.  
> **Updated with Search-Only Privacy Architecture, Time-of-Day Sticker System, & Mobile-First PWA Implementation.**

---

## 1. Overview & Core Philosophy

The **CuraLink Pharmacy Portal** is the physical-to-digital bridge for chronic illness medication adherence. It enables licensed pharmacists to:
- Look up active committed prescriptions by **exact Patient ID search only** (`AV-XXXXXX`). Patient lists and browsing are completely eliminated to enforce strict zero-browsing privacy.
- Access only the **latest COMMITTED prescription revision** under **strict least-privilege scoping** (clinical indications, diagnoses, psychiatric evaluations, and consultation notes are strictly stripped).
- Display the regulatory notice if a revision replaced one partly dispensed:  
  > *"This prescription was revised. Dispense only what is shown here."*
- Bind the **Time-of-Day Physical Sticker System**:
  - 🔴 **Red** = Day (Morning dose)
  - 🟡 **Yellow** = Afternoon dose
  - 🔵 **Blue** = Night dose
  - ⚠️ **Mini** = Take BEFORE food
  - Multiple medicines can share Red; no duplicate slots per medicine.
  - Frequency parser suggests slots (e.g. `1-0-1`, `twice daily`) without auto-saving.
  - "Stickers to attach" checklist provides consolidated drawer-pull counts per color.
- Record safe dispensing with strict guards: batch tracking, expiry date verification (minimum 30-day shelf-life), physical stock verification, and idempotency protection against duplicate decrements.
- Maintain **inventory freshness** badges (Fresh, Aging, Stale with estimate indicators).
- Inspect a **live voice-prompt preview** reproducing the automated telephony speech:
  > *"Namaste Suresh. This is your health reminder. For the packet with the Red sticker, take it this morning before food. For the packet with the Blue sticker, take it at night before food. Press 1 or say 'I took it' to report that you have taken it. Press 2 if you need help, or press 3 to be reminded later."*

---

## 2. Architecture & Design Principles

The application is structured using **Clean (Hexagonal) Architecture**:

```
src/
  core/                     # Shared kernel across future portals
    domain/                 # Entities (User, AuditLog), Enums (Role, AuditAction), Domain Errors
    ports/                  # Ports (AuthProvider, AuditLogRepository, EventPublisher, Clock)
  modules/pharmacy/
    domain/                 # Aggregates & Rules (Sticker Slots, Dispense Guards, Freshness, Suggester)
    application/            # Isolated Use Cases (LookupPatientActivePrescription, DispenseMedicine, etc.)
    interface/              # DTOs, Zod Validation Schemas
    ports/                  # Repository Interfaces (PrescriptionRead, Dispensing, Inventory, Sticker)
  infrastructure/
    mock/                   # In-memory adapters with synthetic patients & doctor notes (ACTIVE NOW)
    supabase/               # Live PostgreSQL / Supabase adapters (COMPILED & READY)
    container.ts            # Dependency Injection picking adapter by DATA_PROVIDER env variable
  app/
    (pharmacy)/pharmacy/... # Mobile-first Next.js App Router screens
    api/v1/...              # Route Handlers with strict Cache-Control: no-store
public/
  manifest.webmanifest     # PWA manifest (standalone, theme-color)
  sw.js                     # Static-only service worker (zero patient data caching)
  icon.svg                  # Vector medical cross PWA app icon
tests/                      # Vitest test suites (12 test suites)
```

### Key Privacy & Operational Protections
1. **Zero-Browsing Privacy Policy:**  
   The pharmacy home screen consists of a single search box (`AV-XXXXXX`) and barcode/QR scanner. There is no patient list or browsing capability anywhere in the system.
2. **Unified Generic 404 Response:**  
   Missing patients, draft-only prescriptions, or invalid input formats all return the exact same generic error:  
   `"No active prescription found for this ID"`. The system never reveals whether a patient exists.
3. **Anti-Enumeration Rate Limiting:**  
   In-memory sliding-window rate limiting per authenticated pharmacist (maximum 20 lookups/min). Exceeding the threshold triggers HTTP `429 Too Many Requests`.
4. **Tamper-Evident Audit Logging:**  
   Every search attempt (successful or not) creates an immutable audit trail entry stamped in IST with actor ID, patient ID searched, and `{ found: boolean }`.
5. **Session Auto-Clearing (2-Minute Idle Timer):**  
   Patient dispensing workspaces automatically clear and return to the empty search box after 2 minutes of user inactivity.
6. **Zero Offline Patient Data:**  
   No patient or prescription records are ever written to `localStorage`, `sessionStorage`, or IndexedDB. All patient endpoints send `Cache-Control: no-store, no-cache, must-revalidate`. The service worker caches only static bundle assets.

---

## 3. Demo Seed Patient IDs

| Patient ID | Name | Scenario / Verified Clinical Rule |
| :--- | :--- | :--- |
| `AV-000001` | Suresh Patil | **Low-Literacy / Mandatory Time Stickers**: Feature phone patient requiring time-of-day stickers (Red/Yellow/Blue) and optional mini before-food sticker before dispensing. |
| `AV-000002` | Ananya Sharma | **Standard Packaging**: Literate patient with smartphone; standard labels without mandatory sticker block. |
| `AV-000003` | Vikram Rao | **Revised Prescription**: Doctor issued Revision 2 after Revision 1 was partly dispensed. Displays mandatory banner: *"This prescription was revised. Dispense only what is shown here."* Older content is completely hidden. |
| `AV-000005` | Rahul Verma | **Draft-Only Prescription**: Doctor created a draft that has not been committed. Search returns generic *"No active prescription found for this ID"*. |

---

## 4. How to Run Locally

### Prerequisites
- Node.js 18+ (tested on Node v26.3.0)
- npm 9+

### Setup & Launch
```bash
# 1. Install dependencies
npm install

# 2. Configure environment (Mock data is enabled by default)
cp .env.example .env.local

# 3. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) (redirects to `/pharmacy/dashboard`).

### Demo Login Accounts
- **Pharmacist:** `rajiv.pharmacy@curalink.health` / any password (or click "Instant Login" on `/pharmacy/login`)
- **Doctor (RBAC Test):** `dr.amit@curalink.health` (attempts to access pharmacy routes will receive HTTP 403 Forbidden)

---

## 5. How to Run Tests & Verification

The test suite includes automated tests passing cleanly with 100% compliance:

```bash
# Run Vitest test suites
npm test

# Run TypeScript strict type-check
npm run type-check

# Run ESLint
npm run lint

# Run Next.js production build verification
npm run build
```

### Verified Test Suites
1. **Patient Lookup (`tests/integration/patient-lookup.test.ts`):** Proves only latest committed revisions are returned, superseded/draft records are rejected with generic 404, rate limiter enforces 20 req/min, and every search is audit-logged.
2. **Privacy Least Privilege (`tests/integration/privacy-least-privilege.test.ts`):** Proves doctor-side diagnoses and consultation notes exist in backend storage but are strictly stripped from pharmacy DTOs.
3. **Role-Based Access Control (`tests/integration/rbac-guard.test.ts`):** Verifies non-pharmacy roles (e.g., patient, doctor) receive HTTP 403 Forbidden on pharmacy use cases.
4. **Dispense Idempotency (`tests/integration/dispense-idempotency.test.ts`):** Proves repeated calls with the same `Idempotency-Key` do not duplicate inventory decrements.
5. **Zero Cleanup Sweep (`tests/integration/zero-substitution-sweep.test.ts`):** Greps `src/`, `supabase/`, and `tests/` verifying zero dead traces exist.
6. **Immutability Guard (`tests/integration/immutability-guard.test.ts`):** Proves HTTP `DELETE` and `PUT` return `405 Method Not Allowed`.
7. **Sticker Uniqueness & Sharing (`tests/unit/sticker-uniqueness.test.ts`):** Verifies multiple medicines can share Red, rejects duplicate slots per medicine, and enforces non-empty slot selection.
8. **Sticker Slot Configuration (`tests/unit/sticker-slot-config.test.ts`):** Verifies single config file mappings for Red/Yellow/Blue and Before-Food mini badge.
9. **Frequency Slot Suggester (`tests/unit/frequency-slot-suggester.test.ts`):** Verifies frequency parsing for `1-0-1`, `twice daily`, `TDS`, `before breakfast`, etc.
10. **Dispense Guards (`tests/unit/dispense-guards.test.ts`):** Validates stock verification, minimum 30-day shelf life, expired batches, and time-of-day sticker guards.
11. **Voice Prompt Generator (`tests/unit/voice-prompt-generator.test.ts`):** Verifies time-of-day and color synthesis with before-food phrasing.
12. **Freshness Calculator (`tests/unit/freshness-calculator.test.ts`):** Verifies audit age estimation threshold logic.
13. **Repository Contracts (`tests/contracts/repository-contracts.spec.ts`):** Validates mock and Supabase adapter behavioral parity and version incrementing on sticker reassignment.

---

## 6. Mobile-First & PWA Architecture

- **360x640 Base Viewport Compliance:** Zero horizontal overflow, fluid responsive layouts.
- **Touch Target Sizing:** All buttons, picker toggles, and tab items feature $\ge 48\times 48\text{ px}$ tap targets.
- **Mobile Bottom Navigation Tab Bar:** Fixed 3-item bottom bar for phones (`Search`, `Stock`, `Activity`) with safe-area insets.
- **Stacked Card Tables:** Inventory and audit tables transform into stacked key-value cards on viewports $< 768\text{ px}$.
- **iOS Safari Optimization:** All inputs configured with `font-size \ge 16px` to prevent automatic zoom on focus.
- **Progressive Web App (PWA):** Web manifest (`/manifest.webmanifest`) and service worker (`/sw.js`) supporting standalone home screen installation.

---

## 7. Switching to Supabase in 5 Steps

The codebase is engineered so that **switching to Supabase requires ZERO changes** outside `infrastructure/` and `.env`.

### Step 1: Create a Supabase Project
Create a new project at [supabase.com](https://supabase.com). Retrieve your Project URL, Anon Key, and Service Role Key from Project Settings -> API.

### Step 2: Run Ordered Migrations
Execute the migrations in the Supabase SQL Editor in exact sequence:
1. `supabase/migrations/0001_schema.sql` (Creates enums, tables, foreign keys, unique constraints, dose_slot enum, append-only versioned sticker_assignments)
2. `supabase/migrations/0002_immutability.sql` (PostgreSQL triggers blocking `UPDATE` and `DELETE` on committed records and sticker_assignments)
3. `supabase/migrations/0003_rls.sql` (Row-Level Security & privacy-scoped view `pharmacy_active_prescriptions`)
4. `supabase/migrations/0004_seed.sql` (Synthetic patients and inventory matching the demo scenarios)

### Step 3: Set Environment Variables
In `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 4: Flip the Data Provider Flag
Change `DATA_PROVIDER` in `.env.local`:
```bash
DATA_PROVIDER=supabase
```
`container.ts` automatically binds `SupabasePrescriptionRepository`, `SupabaseDispensingRepository`, `SupabaseStickerRepository`, `SupabaseInventoryRepository`, and `SupabaseAuditLogRepository`.

### Step 5: Run Tests
```bash
npm test
```
The contract test suite verifies that the Supabase adapters satisfy the exact same domain contracts as the in-memory mock adapters.

---

## 8. Responsible Healthcare Disclaimer

- **Honest Status Language:** Avoids false certainty. Keypad tones are recorded as "patient-reported confirmation", not proof of ingestion. Unanswered calls are logged as "no response received", not patient defiance.
- **Neutral Reminder Content:** Telephony reminders and printable receipts never disclose clinical diagnoses or sensitive conditions.
- **Coordination Aid Disclaimer:** CuraLink assists clinical coordination; it never alters dosages or prescribes autonomously.