// CURALINK — Core Clinical Data Store & In-Memory Database
// Provides fast access to 8 demo patients, pending appointments, past prescriptions,
// medication histories, and care tasks with instant synchronization to Supabase.

export interface Patient {
  id: string;
  uhid: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  language: string;
  deviceType: string;
  chronicConditions: string[];
  guardianName?: string;
  guardianPhone?: string;
  guardianConsent?: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  tokenNumber: string;
  reasonForVisit: string;
  appointmentTime: string;
  bookingChannel: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
}

export interface PrescriptionMedicine {
  id: string;
  prescriptionId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  noOfDays: number;
  mealRelation: string;
  instructions: string;
  dispenseStatus: string;
}

export interface PrescriptionDiagnostic {
  id: string;
  prescriptionId: string;
  testType: "SCAN" | "LAB_TEST";
  testName: string;
  instructions: string;
  urgency: "ROUTINE" | "URGENT" | "STAT";
  status: "PENDING" | "COMPLETED";
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  status: string;
  prescriptionType: "NORMAL" | "SCAN_TEST";
  symptomsNotes: string;
  followUpDate?: string;
  followUpNotes?: string;
  telephonyTriggerEnabled: boolean;
  telephonyTriggeredAt?: string;
  createdAt: string;
  medicines: PrescriptionMedicine[];
  diagnostics: PrescriptionDiagnostic[];
}

export interface CareTask {
  id: string;
  patientId: string;
  patientName: string;
  sourceType: string;
  title: string;
  rawTranscript: string;
  aiExtractedSummary: string;
  priority: "ROUTINE" | "HIGH" | "CRITICAL";
  status: "PROPOSED" | "RESOLVED";
  createdAt: string;
}

export interface SubstitutionProposal {
  id: string;
  prescriptionId: string;
  medicineId: string;
  patientName: string;
  originalMedicineName: string;
  proposedMedicineName: string;
  reasonForSubstitution: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface DoctorUser {
  id: string; // e.g. "DOC84920"
  name: string;
  phone: string;
  email: string;
  age: number;
  pin: string; // 6-digit PIN
  isVerified: boolean;
  department?: string;
  license?: string;
  licenseNo?: string;
  role?: string;
  createdAt: string;
}

// In-Memory Database Store
class ClinicalDatabase {
  doctors: DoctorUser[] = [
    {
      id: "DOC84920",
      name: "Dr. Suresh Sharma, MD",
      phone: "+91 98450 11223",
      email: "dr.suresh@curalink.health",
      age: 48,
      pin: "123456",
      isVerified: true,
      department: "Internal Medicine & Chronic Care",
      license: "KMC-84920/MD",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "DOC10001",
      name: "Dr. Ananya K., MD",
      phone: "+91 98451 00001",
      email: "dr.ananya@curalink.health",
      age: 36,
      pin: "123456",
      isVerified: true,
      department: "Cardiology & Chronic Care",
      license: "KMC-10001/MD",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "DOC20002",
      name: "Dr. Rajesh Kumar, MD",
      phone: "+91 98452 00002",
      email: "dr.rajesh@curalink.health",
      age: 42,
      pin: "123456",
      isVerified: true,
      department: "Endocrinology & Diabetology",
      license: "KMC-20002/MD",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  findDoctor(idOrEmailOrPhone: string): DoctorUser | undefined {
    const term = (idOrEmailOrPhone || "").trim().toLowerCase();
    const cleanTerm = term.replace(/[^a-z0-9]/g, "");
    const numericTerm = term.replace(/\D/g, "");

    return this.doctors.find(d => {
      const dCleanId = d.id.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (d.id.toLowerCase() === term || dCleanId === cleanTerm) return true;
      if (term === "doc-1" && d.id === "DOC84920") return true;
      if (d.email.toLowerCase() === term) return true;
      if (numericTerm.length >= 6 && d.phone.replace(/\D/g, "").includes(numericTerm)) return true;
      // Name partial match
      const dNameClean = d.name.toLowerCase().replace(/dr\.?/g, "").trim();
      const termClean = term.replace(/dr\.?/g, "").trim();
      if (termClean.length >= 3 && dNameClean.includes(termClean)) return true;
      return false;
    });
  }

  createDoctor(doctor: Omit<DoctorUser, "id" | "createdAt"> & { id?: string }): DoctorUser {
    let newId = doctor.id;
    if (!newId) {
      do {
        const random5Digits = Math.floor(10000 + Math.random() * 90000);
        newId = `DOC${random5Digits}`;
      } while (this.doctors.some(d => d.id === newId));
    }

    const newDoctor: DoctorUser = {
      id: newId,
      name: doctor.name.startsWith("Dr.") ? doctor.name : `Dr. ${doctor.name}`,
      phone: doctor.phone,
      email: doctor.email,
      age: Number(doctor.age) || 35,
      pin: doctor.pin,
      isVerified: Boolean(doctor.isVerified),
      department: doctor.department || "General Medicine & Chronic Care",
      license: doctor.license || `KMC-${newId.replace("DOC", "")}/MD`,
      createdAt: new Date().toISOString(),
    };

    this.doctors.unshift(newDoctor);
    return newDoctor;
  }

  patients: Patient[] = [
    {
      id: "pt-ramesh-001",
      uhid: "ARV-2026-001",
      name: "Ramesh Gowda",
      age: 58,
      gender: "Male",
      phone: "+91 98801 12345",
      language: "KANNADA",
      deviceType: "FEATURE_PHONE",
      chronicConditions: ["Type 2 Diabetes Mellitus", "Diabetic Neuropathy"],
      guardianName: "Manjunath Gowda (Son)",
      guardianPhone: "+91 98801 54321",
      guardianConsent: true,
    },
    {
      id: "pt-savitha-002",
      uhid: "ARV-2026-002",
      name: "Savitha Devi",
      age: 62,
      gender: "Female",
      phone: "+91 94481 67890",
      language: "KANNADA",
      deviceType: "FEATURE_PHONE",
      chronicConditions: ["Essential Hypertension Stage II"],
      guardianName: "Kavitha (Daughter)",
      guardianPhone: "+91 94481 99887",
      guardianConsent: true,
    },
    {
      id: "pt-anand-003",
      uhid: "ARV-2026-003",
      name: "Anand Kumar",
      age: 45,
      gender: "Male",
      phone: "+91 99001 98765",
      language: "ENGLISH",
      deviceType: "SMARTPHONE",
      chronicConditions: ["Type 2 Diabetes Mellitus", "Dyslipidemia"],
    },
    {
      id: "pt-gangamma-004",
      uhid: "ARV-2026-004",
      name: "Gangamma Basappa",
      age: 67,
      gender: "Female",
      phone: "+91 97410 45678",
      language: "KANNADA",
      deviceType: "FEATURE_PHONE",
      chronicConditions: ["Bilateral Knee Osteoarthritis", "Gastric Hyperacidity"],
      guardianName: "Basavaraj (Husband)",
      guardianPhone: "+91 97410 87654",
      guardianConsent: true,
    },
    {
      id: "pt-rafiq-005",
      uhid: "ARV-2026-005",
      name: "Mohammad Rafiq",
      age: 52,
      gender: "Male",
      phone: "+91 98200 65432",
      language: "HINDI",
      deviceType: "FEATURE_PHONE",
      chronicConditions: ["Coronary Artery Disease (Post-Stent)", "Hypertension"],
      guardianName: "Zarina Begum (Wife)",
      guardianPhone: "+91 98200 98765",
      guardianConsent: true,
    },
    {
      id: "pt-lakshmi-006",
      uhid: "ARV-2026-006",
      name: "Lakshmi Venkatesh",
      age: 39,
      gender: "Female",
      phone: "+91 98490 23456",
      language: "TELUGU",
      deviceType: "SMARTPHONE",
      chronicConditions: ["Primary Hypothyroidism"],
      guardianName: "Venkatesh Rao (Spouse)",
      guardianPhone: "+91 98490 65432",
      guardianConsent: true,
    },
    {
      id: "pt-murugan-007",
      uhid: "ARV-2026-007",
      name: "Murugan Selvam",
      age: 61,
      gender: "Male",
      phone: "+91 94440 34567",
      language: "TAMIL",
      deviceType: "FEATURE_PHONE",
      chronicConditions: ["Chronic Bronchitis / COPD", "Hypertension"],
      guardianName: "Karthik (Son)",
      guardianPhone: "+91 94440 76543",
      guardianConsent: true,
    },
    {
      id: "pt-shanta-008",
      uhid: "ARV-2026-008",
      name: "Shanta Bai",
      age: 70,
      gender: "Female",
      phone: "+91 98220 45678",
      language: "MARATHI",
      deviceType: "FEATURE_PHONE",
      chronicConditions: ["Chronic Kidney Disease Stage 3", "Hypertension"],
      guardianName: "Ashok (Son)",
      guardianPhone: "+91 98220 87654",
      guardianConsent: true,
    },
  ];

  appointments: Appointment[] = [
    {
      id: "apt-001",
      patientId: "pt-ramesh-001",
      tokenNumber: "TOKEN-01",
      reasonForVisit: "Monthly Diabetes & Neuropathy Follow-up Checkup",
      appointmentTime: "Today • 09:30 AM",
      bookingChannel: "CLINIC_DESK",
      status: "PENDING",
    },
    {
      id: "apt-002",
      patientId: "pt-savitha-002",
      tokenNumber: "TOKEN-02",
      reasonForVisit: "Urgent Clinical Review after 3 Unanswered Calls Alert",
      appointmentTime: "Today • 10:00 AM",
      bookingChannel: "CLINIC_DESK",
      status: "PENDING",
    },
    {
      id: "apt-003",
      patientId: "pt-anand-003",
      tokenNumber: "TOKEN-03",
      reasonForVisit: "Pharmacy Generic Substitution Confirmation & Diet Plan",
      appointmentTime: "Today • 10:30 AM",
      bookingChannel: "ONLINE_SMARTPHONE",
      status: "PENDING",
    },
    {
      id: "apt-004",
      patientId: "pt-gangamma-004",
      tokenNumber: "TOKEN-04",
      reasonForVisit: "Bilateral Knee Osteoarthritis Pain & Gastric Acidity Evaluation",
      appointmentTime: "Today • 11:15 AM",
      bookingChannel: "INBOUND_IVR",
      status: "PENDING",
    },
    {
      id: "apt-005",
      patientId: "pt-rafiq-005",
      tokenNumber: "TOKEN-05",
      reasonForVisit: "Post-Stent Follow-up & Antiplatelet Therapy Refill",
      appointmentTime: "Today • 11:45 AM",
      bookingChannel: "CLINIC_DESK",
      status: "PENDING",
    },
  ];

  prescriptions: Prescription[] = [
    {
      id: "rx-ramesh-v1",
      patientId: "pt-ramesh-001",
      doctorId: "doc-1",
      doctorName: "Dr. Suresh Sharma, MD",
      status: "COMMITTED",
      prescriptionType: "NORMAL",
      symptomsNotes: "Patient reported excessive thirst (polydipsia), fatigue in the afternoons, and mild numbness in feet. Fasting blood sugar 192 mg/dL.",
      followUpDate: "2026-11-12",
      followUpNotes: "Review HbA1c and Serum Creatinine lab reports to titrate Metformin",
      telephonyTriggerEnabled: true,
      telephonyTriggeredAt: new Date(Date.now() - 2592000000).toISOString(),
      createdAt: new Date(Date.now() - 2592000000).toISOString(),
      medicines: [
        {
          id: "med-metformin-001",
          prescriptionId: "rx-ramesh-v1",
          medicineName: "Metformin Hydrochloride",
          dosage: "500mg",
          frequency: "1-0-1",
          noOfDays: 30,
          mealRelation: "After Food",
          instructions: "Take with warm water after breakfast and dinner",
          dispenseStatus: "DISPENSED",
        },
        {
          id: "med-glimepiride-001",
          prescriptionId: "rx-ramesh-v1",
          medicineName: "Glimepiride",
          dosage: "1mg",
          frequency: "1-0-0",
          noOfDays: 15,
          mealRelation: "Before Food",
          instructions: "Take 15 minutes before breakfast",
          dispenseStatus: "DISPENSED",
        },
      ],
      diagnostics: [
        {
          id: "diag-001",
          prescriptionId: "rx-ramesh-v1",
          testType: "LAB_TEST",
          testName: "HbA1c (Glycated Hemoglobin)",
          instructions: "Fasting 8-10 hours required. Morning sample.",
          urgency: "ROUTINE",
          status: "PENDING",
        },
        {
          id: "diag-002",
          prescriptionId: "rx-ramesh-v1",
          testType: "LAB_TEST",
          testName: "Kidney Function Test (KFT / Creatinine, BUN)",
          instructions: "Fasting blood & morning urine sample.",
          urgency: "ROUTINE",
          status: "PENDING",
        },
      ],
    },
    {
      id: "rx-ramesh-ortho",
      patientId: "pt-ramesh-001",
      doctorId: "doc-ortho-02",
      doctorName: "Dr. K. R. Nambiar, MS (Orthopedics)",
      status: "COMMITTED",
      prescriptionType: "NORMAL",
      symptomsNotes: "Patient evaluated for knee osteoarthritis joint stiffness.",
      telephonyTriggerEnabled: false,
      createdAt: new Date(Date.now() - 5184000000).toISOString(),
      medicines: [
        {
          id: "med-paracetamol-ortho",
          prescriptionId: "rx-ramesh-ortho",
          medicineName: "Paracetamol",
          dosage: "650mg",
          frequency: "SOS",
          noOfDays: 10,
          mealRelation: "After Food",
          instructions: "Take only in case of joint pain",
          dispenseStatus: "DISPENSED",
        },
      ],
      diagnostics: [],
    },
    {
      id: "rx-savitha-v1",
      patientId: "pt-savitha-002",
      doctorId: "doc-1",
      doctorName: "Dr. Suresh Sharma, MD",
      status: "COMMITTED",
      prescriptionType: "NORMAL",
      symptomsNotes: "Patient complained of morning occipital headaches and mild dizziness on standing up quickly. Resting BP 164/98 mmHg.",
      followUpDate: "2026-11-10",
      followUpNotes: "Review 12-Lead ECG and 2D ECHO scan reports",
      telephonyTriggerEnabled: true,
      telephonyTriggeredAt: new Date(Date.now() - 172800000).toISOString(),
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      medicines: [
        {
          id: "med-amlodipine-002",
          prescriptionId: "rx-savitha-v1",
          medicineName: "Amlodipine Besylate",
          dosage: "5mg",
          frequency: "1-0-0",
          noOfDays: 30,
          mealRelation: "After Food",
          instructions: "Take in the morning with water",
          dispenseStatus: "DISPENSED",
        },
      ],
      diagnostics: [
        {
          id: "diag-003",
          prescriptionId: "rx-savitha-v1",
          testType: "SCAN",
          testName: "12-Lead Electrocardiogram (ECG)",
          instructions: "Resting 12-lead ECG in supine position.",
          urgency: "URGENT",
          status: "PENDING",
        },
        {
          id: "diag-004",
          prescriptionId: "rx-savitha-v1",
          testType: "SCAN",
          testName: "2D Echocardiography (ECHO)",
          instructions: "Assess left ventricular hypertrophy and EF.",
          urgency: "ROUTINE",
          status: "PENDING",
        },
      ],
    },
    {
      id: "rx-savitha-nephro",
      patientId: "pt-savitha-002",
      doctorId: "doc-nephro-03",
      doctorName: "Dr. Anita Sen, MD (Nephrology)",
      status: "COMMITTED",
      prescriptionType: "NORMAL",
      symptomsNotes: "Pedal edema assessment. Serum creatinine normal.",
      telephonyTriggerEnabled: false,
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      medicines: [
        {
          id: "med-torsemide-nephro",
          prescriptionId: "rx-savitha-nephro",
          medicineName: "Torsemide",
          dosage: "10mg",
          frequency: "1-0-0",
          noOfDays: 15,
          mealRelation: "Before Food",
          instructions: "Take in morning before breakfast",
          dispenseStatus: "DISPENSED",
        },
      ],
      diagnostics: [],
    },
    {
      id: "rx-anand-v1",
      patientId: "pt-anand-003",
      doctorId: "doc-1",
      doctorName: "Dr. Suresh Sharma, MD",
      status: "COMMITTED",
      prescriptionType: "NORMAL",
      symptomsNotes: "Asymptomatic corporate executive. Routine checkup detected HbA1c 7.9% and elevated LDL (148 mg/dL). Denies chest pain or breathlessness.",
      followUpDate: "2026-11-15",
      followUpNotes: "Review Fasting Lipid Profile panel and dietary progress",
      telephonyTriggerEnabled: true,
      telephonyTriggeredAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      medicines: [
        {
          id: "med-glucophage-003",
          prescriptionId: "rx-anand-v1",
          medicineName: "Glucophage (Brand)",
          dosage: "500mg",
          frequency: "1-0-1",
          noOfDays: 30,
          mealRelation: "After Food",
          instructions: "Take with meals",
          dispenseStatus: "PENDING",
        },
        {
          id: "med-atorvastatin-003",
          prescriptionId: "rx-anand-v1",
          medicineName: "Atorvastatin",
          dosage: "20mg",
          frequency: "0-0-1",
          noOfDays: 30,
          mealRelation: "After Food",
          instructions: "Take at bedtime",
          dispenseStatus: "DISPENSED",
        },
      ],
      diagnostics: [
        {
          id: "diag-005",
          prescriptionId: "rx-anand-v1",
          testType: "LAB_TEST",
          testName: "Lipid Profile (Full Panel)",
          instructions: "12-hour strict overnight fasting.",
          urgency: "ROUTINE",
          status: "PENDING",
        },
      ],
    },
  ];

  careTasks: CareTask[] = [
    {
      id: "task-001",
      patientId: "pt-ramesh-001",
      patientName: "Ramesh Gowda",
      sourceType: "AI_CALL_EXTRACT",
      title: "Patient reported gastric discomfort after morning dose",
      rawTranscript: 'ಧ್ವನಿ ಕರೆ: "ಡಾಕ್ಟರ್ ಸಾಹೇಬ್ರೇ, ಕೆಂಪು ಬಣ್ಣದ ಮಾತ್ರೆ ತಗೊಂಡ್ಮೇಲೆ ಹೊಟ್ಟೆ ಉರೀತಿದೆ."',
      aiExtractedSummary: "Symptom: Gastric burning / acidity. Urgency: HIGH. Action: Add supportive antacid (Pantoprazole 40mg OD) or take with milk.",
      priority: "HIGH",
      status: "PROPOSED",
      createdAt: new Date().toISOString(),
    },
    {
      id: "task-002",
      patientId: "pt-savitha-002",
      patientName: "Savitha Devi",
      sourceType: "AI_CALL_EXTRACT",
      title: "Morning dizziness noted during adherence check",
      rawTranscript: 'ಧ್ವನಿ ಕರೆ: "ಬೆಳಗ್ಗೆ ಎದ್ದಾಗ ಸ್ವಲ್ಪ ತಲೆ ತಿರುಗುತ್ತೆ ಅಮ್ಮ."',
      aiExtractedSummary: "Orthostatic lightheadedness. Recommendation: Check seated vs standing BP. Advise slow transition when waking.",
      priority: "ROUTINE",
      status: "PROPOSED",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  substitutions: SubstitutionProposal[] = [
    {
      id: "sub-001",
      prescriptionId: "rx-anand-v1",
      medicineId: "med-glucophage-003",
      patientName: "Anand Kumar",
      originalMedicineName: "Glucophage 500mg (Brand)",
      proposedMedicineName: "Glycomet 500mg (Generic Metformin Hydrochloride)",
      reasonForSubstitution: "Glucophage brand out of stock across hospital central depot. Glycomet is bioequivalent CDSCO approved batch with identical pharmacokinetics.",
      status: "PENDING",
      createdAt: new Date().toISOString(),
    },
  ];

  telephonyTriggers: any[] = [];
}

// Global Singleton
const globalDbKey = Symbol.for("curalink.clinical_database");
const globalObj = globalThis as unknown as { [key: symbol]: ClinicalDatabase };

if (!globalObj[globalDbKey]) {
  globalObj[globalDbKey] = new ClinicalDatabase();
}

export const db = globalObj[globalDbKey];
