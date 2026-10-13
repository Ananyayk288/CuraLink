# CuraLink — Care Team Portal
**Field Triage & Frontline Healthcare Coordination Platform**

This branch contains the **Care Team Portal** module (`careteam/`) for the CuraLink healthcare ecosystem.

## 📁 Branch Structure
- **`careteam/`**: Next.js workstation for ASHA workers, care coordinators, and field triage officers
  - Care team registration & authentication with CRT IDs (e.g., `CRT10243`)
  - Patient registration with literacy indicators (SMS vs automated voice reminders)
  - Primary caregiver / guardian linking with address cloning
  - Simulated interactive OTP verification flow
  - Supabase PostgreSQL integration
  - Full mobile viewport responsive design

## 🚀 Quick Start

To run the Care Team Portal:

```bash
cd careteam
npm install
npm run dev
```

The portal runs locally at [http://localhost:3001](http://localhost:3001).

