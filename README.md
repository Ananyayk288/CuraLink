# CuraLink — Doctor Portal
**Integrated Clinical Coordination & Prescription Management Platform**

This branch contains the **Doctor Portal** module (`doctor/`) for the CuraLink healthcare ecosystem.

## 📁 Branch Structure
- **`doctor/`**: Next.js clinical workstation for doctors
  - Attending doctor registration & login with DOC IDs
  - Clinical encounter workspace: diagnosis, symptoms with strict word limits
  - Pre-fed Indian medication regimen with physical color-sticker codes and timing
  - Medical history import for doctor-specific prior prescriptions
  - Diagnostic scan and laboratory test ordering
  - Real-time Supabase PostgreSQL cloud sync & immutability triggers
  - Full mobile viewport responsive design

## 🚀 Quick Start

To run the Doctor Portal:

```bash
cd doctor
npm install
npm run dev
```

The portal runs locally at [http://localhost:3000](http://localhost:3000).

