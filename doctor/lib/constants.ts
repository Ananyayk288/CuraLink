// CURALINK Doctor Clinical Portal — Core Constants & Data Dictionaries

export interface PrefedMedicine {
  name: string;
  dosage: string;
  defaultFreq: string;
  defaultMeal: string;
  category?: string;
}

export const PREFED_MEDICINES: PrefedMedicine[] = [
  { name: "Metformin Hydrochloride", dosage: "500mg", defaultFreq: "1-0-1", defaultMeal: "After Food" },
  { name: "Metformin Hydrochloride", dosage: "1000mg", defaultFreq: "1-0-1", defaultMeal: "After Food" },
  { name: "Amlodipine Besylate", dosage: "5mg", defaultFreq: "1-0-0", defaultMeal: "After Food" },
  { name: "Amlodipine Besylate", dosage: "10mg", defaultFreq: "1-0-0", defaultMeal: "After Food" },
  { name: "Telmisartan", dosage: "40mg", defaultFreq: "1-0-0", defaultMeal: "After Food" },
  { name: "Telmisartan", dosage: "80mg", defaultFreq: "1-0-0", defaultMeal: "After Food" },
  { name: "Atorvastatin", dosage: "10mg", defaultFreq: "0-0-1", defaultMeal: "After Food" },
  { name: "Atorvastatin", dosage: "20mg", defaultFreq: "0-0-1", defaultMeal: "After Food" },
  { name: "Glimepiride", dosage: "1mg", defaultFreq: "1-0-0", defaultMeal: "Before Food" },
  { name: "Glimepiride", dosage: "2mg", defaultFreq: "1-0-0", defaultMeal: "Before Food" },
  { name: "Pantoprazole Gastro-Resistant", dosage: "40mg", defaultFreq: "1-0-0", defaultMeal: "Empty Stomach" },
  { name: "Rabeprazole Sodium", dosage: "20mg", defaultFreq: "1-0-0", defaultMeal: "Empty Stomach" },
  { name: "Losartan Potassium", dosage: "50mg", defaultFreq: "1-0-0", defaultMeal: "After Food" },
  { name: "Paracetamol", dosage: "650mg", defaultFreq: "SOS", defaultMeal: "After Food" },
  { name: "Diclofenac Sodium", dosage: "50mg", defaultFreq: "1-0-1", defaultMeal: "After Food" },
  { name: "Aspirin (Enteric Coated)", dosage: "75mg", defaultFreq: "0-0-1", defaultMeal: "After Food" },
  { name: "Clopidogrel", dosage: "75mg", defaultFreq: "1-0-0", defaultMeal: "After Food" },
  { name: "Voglibose", dosage: "0.2mg", defaultFreq: "1-0-1", defaultMeal: "Before Food" },
  { name: "Teneligliptin", dosage: "20mg", defaultFreq: "1-0-0", defaultMeal: "After Food" },
  { name: "Insulin Glargine (Basal)", dosage: "10 Units", defaultFreq: "0-0-1", defaultMeal: "Before Bed" },
  { name: "Montelukast Sodium", dosage: "10mg", defaultFreq: "0-0-1", defaultMeal: "After Food" },
  { name: "Levocetirizine Dihydrochloride", dosage: "5mg", defaultFreq: "0-0-1", defaultMeal: "After Food" },
  { name: "Azithromycin", dosage: "500mg", defaultFreq: "1-0-0", defaultMeal: "After Food" },
  { name: "Amoxicillin and Potassium Clavulanate", dosage: "625mg", defaultFreq: "1-0-1", defaultMeal: "After Food" },
  { name: "Rosuvastatin", dosage: "10mg", defaultFreq: "0-0-1", defaultMeal: "After Food" },
  { name: "Enalapril Maleate", dosage: "5mg", defaultFreq: "1-0-0", defaultMeal: "After Food" },
  { name: "Hydrochlorothiazide", dosage: "12.5mg", defaultFreq: "1-0-0", defaultMeal: "After Food" },
  { name: "Thyroxine Sodium", dosage: "50mcg", defaultFreq: "1-0-0", defaultMeal: "Empty Stomach" },
  { name: "Thyroxine Sodium", dosage: "100mcg", defaultFreq: "1-0-0", defaultMeal: "Empty Stomach" },
];

export interface PrefedDiagnostic {
  name: string;
  type: "SCAN" | "LAB_TEST";
  category: string;
  instructions: string;
}

export const PREFED_DIAGNOSTICS: PrefedDiagnostic[] = [
  // Diagnostic Imaging & Scans
  { name: "Chest X-Ray (PA View)", type: "SCAN", category: "Radiology", instructions: "Remove metallic items from chest. Standard PA projection." },
  { name: "Ultrasound Whole Abdomen & Pelvis (USG)", type: "SCAN", category: "Ultrasound", instructions: "Full bladder required. Drink 1L water 1 hour prior to scan." },
  { name: "2D Echocardiography (ECHO)", type: "SCAN", category: "Cardiology", instructions: "Cardiac chamber assessment & Left Ventricular Ejection Fraction (LVEF)." },
  { name: "12-Lead Electrocardiogram (ECG)", type: "SCAN", category: "Cardiology", instructions: "Resting 12-lead ECG in supine position." },
  { name: "CT Scan Brain (Plain)", type: "SCAN", category: "Radiology", instructions: "Non-contrast scan. Remove hairpins and metal jewelry." },
  { name: "CT Scan Abdomen & Pelvis (Contrast)", type: "SCAN", category: "Radiology", instructions: "Check Serum Creatinine first. Fasting 4-6 hours required." },
  { name: "MRI Lumbar Spine", type: "SCAN", category: "Radiology", instructions: "Verify no pacemaker or metal implants. Non-contrast spine evaluation." },
  { name: "MRI Knee Joint (Bilateral)", type: "SCAN", category: "Radiology", instructions: "Evaluation of meniscus, cartilage, and cruciate ligament tears." },
  { name: "Doppler Ultrasound - Lower Limbs", type: "SCAN", category: "Vascular", instructions: "Vascular flow evaluation for DVT or peripheral arterial insufficiency." },
  { name: "Mammography (Bilateral)", type: "SCAN", category: "Radiology", instructions: "Breast cancer screening. Do not apply talcum powder or deodorant." },
  { name: "X-Ray Both Knees (AP & Lateral Weight-bearing)", type: "SCAN", category: "Radiology", instructions: "Standing weight-bearing views for osteoarthritis grading." },
  { name: "Ultrasound Neck (Thyroid & Soft Tissues)", type: "SCAN", category: "Endocrinology", instructions: "Evaluation of thyroid nodules, diffuse goiter, and cervical nodes." },

  // Clinical Lab Tests / Pathology
  { name: "HbA1c (Glycated Hemoglobin)", type: "LAB_TEST", category: "Diabetology", instructions: "3-month glycemic control. Fasting or non-fasting EDTA whole blood." },
  { name: "Fasting Blood Sugar (FBS)", type: "LAB_TEST", category: "Diabetology", instructions: "Strict 8-10 hours overnight fasting. Water permitted." },
  { name: "Postprandial Blood Sugar (PPBS)", type: "LAB_TEST", category: "Diabetology", instructions: "Blood sample collected exactly 2 hours after standard breakfast." },
  { name: "Complete Blood Count (CBC) with ESR", type: "LAB_TEST", category: "Hematology", instructions: "Venous EDTA sample. Tests Hb, Total WBC, Differential, Platelets." },
  { name: "Lipid Profile (Full Panel)", type: "LAB_TEST", category: "Cardiology", instructions: "Strict 10-12 hours fasting. Total Cholesterol, HDL, LDL, Triglycerides." },
  { name: "Kidney Function Test (KFT / Creatinine, BUN)", type: "LAB_TEST", category: "Nephrology", instructions: "Serum sample. Hydrate normally before blood draw." },
  { name: "Liver Function Test (LFT / Bilirubin, SGOT, SGPT)", type: "LAB_TEST", category: "Gastroenterology", instructions: "Serum sample. Avoid alcohol for 48 hours prior." },
  { name: "Thyroid Profile (Total T3, T4 & TSH)", type: "LAB_TEST", category: "Endocrinology", instructions: "Morning blood sample before taking morning thyroid medication." },
  { name: "Serum Creatinine & eGFR", type: "LAB_TEST", category: "Nephrology", instructions: "Assessment of baseline renal clearance." },
  { name: "Serum Electrolytes (Sodium, Potassium, Chloride)", type: "LAB_TEST", category: "Pathology", instructions: "Serum sample for electrolyte balance." },
  { name: "Serum Uric Acid", type: "LAB_TEST", category: "Rheumatology", instructions: "Fasting preferred. Evaluates hyperuricemia and gouty arthritis." },
  { name: "Urine Routine & Microscopic Examination", type: "LAB_TEST", category: "Pathology", instructions: "First morning clean-catch midstream urine sample." },
  { name: "Urine Albumin to Creatinine Ratio (UACR)", type: "LAB_TEST", category: "Nephrology", instructions: "Early diabetic nephropathy microalbuminuria screening." },
  { name: "Vitamin D (25-Hydroxy Vitamin D)", type: "LAB_TEST", category: "Pathology", instructions: "Serum testing for bone metabolism and deficiency." },
  { name: "Vitamin B12 Level", type: "LAB_TEST", category: "Hematology", instructions: "Fasting morning sample for peripheral neuropathy screening." },
  { name: "Serum Ferritin & Iron Studies", type: "LAB_TEST", category: "Hematology", instructions: "Iron deficiency anemia evaluation." },
  { name: "Troponin-I (High Sensitivity hs-cTnI)", type: "LAB_TEST", category: "Cardiology", instructions: "Emergency cardiac biomarker." },
  { name: "C-Reactive Protein (Quantitative hs-CRP)", type: "LAB_TEST", category: "Pathology", instructions: "Systemic inflammation and cardiovascular risk marker." },
];

export interface TimingSlot {
  key: string;
  label: string;
  short: string;
  colorName: string;
  badgeClass: string;
  dotClass: string;
  dotHex: string;
  pillEmoji: string;
}

// Tablet timing color codes: Morning: Red, Afternoon: Green, Evening: Blue (RGB)
export const TIMING_COLORS: Record<string, TimingSlot> = {
  MORNING: {
    key: "morning",
    label: "Morning (Red)",
    short: "Morn",
    colorName: "Red",
    badgeClass: "bg-red-100 text-red-700 border-red-300 ring-red-200",
    dotClass: "bg-red-500",
    dotHex: "#ef4444",
    pillEmoji: "🔴",
  },
  AFTERNOON: {
    key: "afternoon",
    label: "Afternoon (Green)",
    short: "Aft",
    colorName: "Green",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-300 ring-emerald-200",
    dotClass: "bg-emerald-500",
    dotHex: "#10b981",
    pillEmoji: "🟢",
  },
  NIGHT: {
    key: "night",
    label: "Evening (Blue)",
    short: "Eve",
    colorName: "Blue",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-300 ring-blue-200",
    dotClass: "bg-blue-500",
    dotHex: "#3b82f6",
    pillEmoji: "🔵",
  },
  EVENING: {
    key: "evening",
    label: "Evening (Blue)",
    short: "Eve",
    colorName: "Blue",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-300 ring-blue-200",
    dotClass: "bg-blue-500",
    dotHex: "#3b82f6",
    pillEmoji: "🔵",
  },
};

export function getTimingSlots(frequency: string): TimingSlot[] {
  const freq = (frequency || "").toLowerCase().trim();
  const slots: TimingSlot[] = [];

  if (freq.includes("1-0-1")) {
    slots.push(TIMING_COLORS.MORNING, TIMING_COLORS.NIGHT);
  } else if (freq.includes("1-0-0")) {
    slots.push(TIMING_COLORS.MORNING);
  } else if (freq.includes("0-1-0")) {
    slots.push(TIMING_COLORS.AFTERNOON);
  } else if (freq.includes("0-0-1")) {
    slots.push(TIMING_COLORS.NIGHT);
  } else if (freq.includes("1-1-1")) {
    slots.push(TIMING_COLORS.MORNING, TIMING_COLORS.AFTERNOON, TIMING_COLORS.NIGHT);
  } else if (freq.includes("1-1-0")) {
    slots.push(TIMING_COLORS.MORNING, TIMING_COLORS.AFTERNOON);
  } else if (freq.includes("0-1-1")) {
    slots.push(TIMING_COLORS.AFTERNOON, TIMING_COLORS.NIGHT);
  } else {
    if (freq.includes("morn")) slots.push(TIMING_COLORS.MORNING);
    if (freq.includes("afternoon") || freq.includes("noon") || freq.includes("lunch")) slots.push(TIMING_COLORS.AFTERNOON);
    if (freq.includes("night") || freq.includes("evening") || freq.includes("bed")) slots.push(TIMING_COLORS.NIGHT);
    if (slots.length === 0 && !freq.includes("sos") && freq.length > 0) {
      slots.push(TIMING_COLORS.MORNING);
    }
  }

  return slots;
}

export const DOCTOR_PROFILE = {
  id: "doc-1",
  name: "Dr. Suresh Sharma, MD",
  license: "KMC-84920/MD",
  department: "Internal Medicine & Chronic Care",
  phone: "+91 98450 11223",
};
