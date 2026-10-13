/**
 * CURALINK — Doctor Clinical Coordination Portal Client App
 * Left sidebar navigation, Command Center pending appointments queue,
 * 3-Tab Clinical Encounter (New Prescription with Pre-fed Regimen, History Tabs),
 * Word limit tracker, Supabase AI Calling Trigger, and Telephony Simulator.
 */

// Global State
let currentPatients = [];
let pendingAppointments = [];
let currentEncounter = null;
let activeEncounterPatientId = null;
let activeEncounterAppointmentId = null;
let regimenRowCount = 0;

// Pre-Fed Indian Pharmacopoeia & Chronic Care Medicines Formulary
const PREFED_MEDICINES = [
  { name: "Metformin Hydrochloride", dosage: "500mg", defaultFreq: "1-0-1 (Twice Daily)", defaultMeal: "After Food" },
  { name: "Metformin Hydrochloride", dosage: "1000mg", defaultFreq: "1-0-1 (Twice Daily)", defaultMeal: "After Food" },
  { name: "Amlodipine Besylate", dosage: "5mg", defaultFreq: "1-0-0 (Morning Only)", defaultMeal: "After Food" },
  { name: "Amlodipine Besylate", dosage: "10mg", defaultFreq: "1-0-0 (Morning Only)", defaultMeal: "After Food" },
  { name: "Telmisartan", dosage: "40mg", defaultFreq: "1-0-0 (Morning Only)", defaultMeal: "After Food" },
  { name: "Telmisartan", dosage: "80mg", defaultFreq: "1-0-0 (Morning Only)", defaultMeal: "After Food" },
  { name: "Atorvastatin", dosage: "10mg", defaultFreq: "0-0-1 (Night Only)", defaultMeal: "After Food" },
  { name: "Atorvastatin", dosage: "20mg", defaultFreq: "0-0-1 (Night Only)", defaultMeal: "After Food" },
  { name: "Glimepiride", dosage: "1mg", defaultFreq: "1-0-0 (Morning Only)", defaultMeal: "Before Food" },
  { name: "Glimepiride", dosage: "2mg", defaultFreq: "1-0-0 (Morning Only)", defaultMeal: "Before Food" },
  { name: "Pantoprazole Gastro-Resistant", dosage: "40mg", defaultFreq: "1-0-0 (Morning Only)", defaultMeal: "Empty Stomach" },
  { name: "Rabeprazole Sodium", dosage: "20mg", defaultFreq: "1-0-0 (Morning Only)", defaultMeal: "Empty Stomach" },
  { name: "Losartan Potassium", dosage: "50mg", defaultFreq: "1-0-0 (Morning Only)", defaultMeal: "After Food" },
  { name: "Paracetamol", dosage: "650mg", defaultFreq: "SOS (As Needed)", defaultMeal: "After Food" },
  { name: "Diclofenac Sodium", dosage: "50mg", defaultFreq: "1-0-1 (Twice Daily)", defaultMeal: "After Food" },
  { name: "Aspirin (Enteric Coated)", dosage: "75mg", defaultFreq: "0-0-1 (Night Only)", defaultMeal: "After Food" },
  { name: "Clopidogrel", dosage: "75mg", defaultFreq: "1-0-0 (Morning Only)", defaultMeal: "After Food" },
  { name: "Voglibose", dosage: "0.2mg", defaultFreq: "1-0-1 (Twice Daily)", defaultMeal: "Before Food" },
  { name: "Teneligliptin", dosage: "20mg", defaultFreq: "1-0-0 (Morning Only)", defaultMeal: "After Food" },
  { name: "Insulin Glargine (Basal)", dosage: "10 Units", defaultFreq: "0-0-1 (Night Only)", defaultMeal: "Before Bed" },
  { name: "Montelukast Sodium", dosage: "10mg", defaultFreq: "0-0-1 (Night Only)", defaultMeal: "After Food" },
  { name: "Levocetirizine Dihydrochloride", dosage: "5mg", defaultFreq: "0-0-1 (Night Only)", defaultMeal: "After Food" },
  { name: "Azithromycin", dosage: "500mg", defaultFreq: "1-0-0 (Morning Only)", defaultMeal: "After Food" },
  { name: "Amoxicillin and Potassium Clavulanate", dosage: "625mg", defaultFreq: "1-0-1 (Twice Daily)", defaultMeal: "After Food" },
  { name: "Rosuvastatin", dosage: "10mg", defaultFreq: "0-0-1 (Night Only)", defaultMeal: "After Food" },
  { name: "Enalapril Maleate", dosage: "5mg", defaultFreq: "1-0-0 (Morning Only)", defaultMeal: "After Food" },
  { name: "Hydrochlorothiazide", dosage: "12.5mg", defaultFreq: "1-0-0 (Morning Only)", defaultMeal: "After Food" },
  { name: "Thyroxine Sodium", dosage: "50mcg", defaultFreq: "1-0-0 (Morning Only)", defaultMeal: "Empty Stomach" },
  { name: "Thyroxine Sodium", dosage: "100mcg", defaultFreq: "1-0-0 (Morning Only)", defaultMeal: "Empty Stomach" }
];

// Pre-Fed Indian Clinical Diagnostic Investigations (Scans & Lab Tests)
const PREFED_DIAGNOSTICS = [
  // Diagnostic Scans / Imaging
  { name: "Chest X-Ray (PA View)", type: "SCAN", category: "Radiology", instructions: "Remove metallic items from chest area. Standard PA projection." },
  { name: "Ultrasound Whole Abdomen & Pelvis (USG)", type: "SCAN", category: "Ultrasound", instructions: "Full bladder required. Drink 1 liter water 1 hour prior to scan." },
  { name: "2D Echocardiography (ECHO)", type: "SCAN", category: "Cardiology", instructions: "Cardiac chamber, valve motility & Left Ventricular Ejection Fraction (LVEF)." },
  { name: "12-Lead Electrocardiogram (ECG)", type: "SCAN", category: "Cardiology", instructions: "Resting 12-lead ECG in quiet supine position." },
  { name: "CT Scan Brain (Plain)", type: "SCAN", category: "Radiology", instructions: "Non-contrast scan. Remove hairpins, hearing aids, and metal jewelry." },
  { name: "CT Scan Abdomen & Pelvis (Contrast)", type: "SCAN", category: "Radiology", instructions: "Check Serum Creatinine first. Strict fasting 4-6 hours required." },
  { name: "MRI Lumbar Spine", type: "SCAN", category: "Radiology", instructions: "Verify no pacemaker or metal implants. Non-contrast spine evaluation." },
  { name: "MRI Knee Joint (Bilateral)", type: "SCAN", category: "Radiology", instructions: "Evaluation of meniscus, cartilage, and cruciate ligament tears." },
  { name: "Doppler Ultrasound - Lower Limbs (Venous/Arterial)", type: "SCAN", category: "Vascular", instructions: "Vascular flow evaluation for DVT or peripheral arterial insufficiency." },
  { name: "Mammography (Bilateral)", type: "SCAN", category: "Radiology", instructions: "Breast cancer screening. Do not apply talcum powder or deodorant." },
  { name: "X-Ray Both Knees (AP & Lateral Weight-bearing)", type: "SCAN", category: "Radiology", instructions: "Standing weight-bearing views for osteoarthritis grading." },
  { name: "Ultrasound Neck (Thyroid & Soft Tissues)", type: "SCAN", category: "Endocrinology", instructions: "Evaluation of thyroid nodules, diffuse goiter, and cervical nodes." },

  // Lab Investigations / Pathology
  { name: "HbA1c (Glycated Hemoglobin)", type: "LAB_TEST", category: "Diabetology", instructions: "3-month glycemic control. Non-fasting or fasting EDTA whole blood sample." },
  { name: "Fasting Blood Sugar (FBS)", type: "LAB_TEST", category: "Diabetology", instructions: "Strict 8-10 hours overnight fasting. Water permitted." },
  { name: "Postprandial Blood Sugar (PPBS)", type: "LAB_TEST", category: "Diabetology", instructions: "Blood sample collected exactly 2 hours after standard breakfast." },
  { name: "Complete Blood Count (CBC) with ESR", type: "LAB_TEST", category: "Hematology", instructions: "Routine venous EDTA sample. Tests Hb, Total WBC count, Differential, Platelets." },
  { name: "Lipid Profile (Full Panel)", type: "LAB_TEST", category: "Cardiology", instructions: "Strict 10-12 hours overnight fasting. Total Cholesterol, HDL, LDL, VLDL, Triglycerides." },
  { name: "Kidney Function Test (KFT / Creatinine, BUN, Uric Acid)", type: "LAB_TEST", category: "Nephrology", instructions: "Serum sample. Hydrate normally before sampling." },
  { name: "Liver Function Test (LFT / Bilirubin, SGOT, SGPT, ALP)", type: "LAB_TEST", category: "Gastroenterology", instructions: "Serum sample. Avoid alcohol for 48 hours prior." },
  { name: "Thyroid Profile (Total T3, T4 & Ultra-sensitive TSH)", type: "LAB_TEST", category: "Endocrinology", instructions: "Morning blood sample before taking morning thyroid medication." },
  { name: "Serum Creatinine & eGFR", type: "LAB_TEST", category: "Nephrology", instructions: "Assessment of baseline renal clearance." },
  { name: "Serum Electrolytes (Sodium, Potassium, Chloride)", type: "LAB_TEST", category: "Pathology", instructions: "Serum sample for electrolyte balance and renal monitoring." },
  { name: "Serum Uric Acid", type: "LAB_TEST", category: "Rheumatology", instructions: "Fasting preferred. Evaluates hyperuricemia and gouty arthritis." },
  { name: "Urine Routine & Microscopic Examination (Urine R/M)", type: "LAB_TEST", category: "Pathology", instructions: "First morning clean-catch midstream urine sample." },
  { name: "Urine Albumin to Creatinine Ratio (UACR)", type: "LAB_TEST", category: "Nephrology", instructions: "Early diabetic nephropathy microalbuminuria screening." },
  { name: "Vitamin D (25-Hydroxy Vitamin D)", type: "LAB_TEST", category: "Pathology", instructions: "Serum testing for bone metabolism and deficiency." },
  { name: "Vitamin B12 Level", type: "LAB_TEST", category: "Hematology", instructions: "Fasting morning sample for peripheral neuropathy screening." },
  { name: "Serum Ferritin & Iron Studies", type: "LAB_TEST", category: "Hematology", instructions: "Iron deficiency anemia evaluation." },
  { name: "Troponin-I (High Sensitivity hs-cTnI)", type: "LAB_TEST", category: "Cardiology", instructions: "Emergency cardiac biomarker." },
  { name: "C-Reactive Protein (Quantitative hs-CRP)", type: "LAB_TEST", category: "Pathology", instructions: "Systemic inflammation and cardiovascular risk marker." }
];

let currentRxMode = "NORMAL";
let orderedDiagnostics = [];

// Timing Color Codes for Tablets: Morning: Red, Afternoon: Green, Night: Blue
const TIMING_COLORS = {
  MORNING: {
    label: "Morning (Red)",
    short: "Morn",
    color: "Red",
    badge: "bg-red-100 text-red-700 border-red-300",
    dot: "bg-red-500",
    pill: "🔴"
  },
  AFTERNOON: {
    label: "Afternoon (Green)",
    short: "Aft",
    color: "Green",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-300",
    dot: "bg-emerald-500",
    pill: "🟢"
  },
  NIGHT: {
    label: "Night (Blue)",
    short: "Night",
    color: "Blue",
    badge: "bg-blue-100 text-blue-700 border-blue-300",
    dot: "bg-blue-500",
    pill: "🔵"
  }
};

function getTimingSlots(frequency) {
  const freq = (frequency || "").toLowerCase();
  const slots = [];
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
  } else if (freq.includes("1-0-1-0")) {
    slots.push(TIMING_COLORS.MORNING, TIMING_COLORS.NIGHT);
  } else {
    if (freq.includes("morning") || freq.includes("morn")) slots.push(TIMING_COLORS.MORNING);
    if (freq.includes("afternoon") || freq.includes("noon") || freq.includes("lunch")) slots.push(TIMING_COLORS.AFTERNOON);
    if (freq.includes("night") || freq.includes("evening") || freq.includes("bed")) slots.push(TIMING_COLORS.NIGHT);
    if (slots.length === 0 && !freq.includes("sos") && freq.length > 0) {
      slots.push(TIMING_COLORS.MORNING);
    }
  }
  return slots;
}

function getTimingColorsHtml(frequency) {
  const slots = getTimingSlots(frequency);
  if (slots.length === 0) {
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">SOS (As Needed)</span>`;
  }
  return `<div class="inline-flex items-center gap-1.5 flex-wrap justify-center">` +
    slots.map(s => `
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${s.badge} border shadow-xs" title="${s.label}">
        <span class="w-1.5 h-1.5 rounded-full ${s.dot}"></span>
        <span>${s.short} (${s.color})</span>
      </span>
    `).join("") +
    `</div>`;
}

function getTimingCodeString(frequency) {
  const slots = getTimingSlots(frequency);
  if (slots.length === 0) return "SOS";
  return slots.map(s => s.color.toUpperCase()).join("_");
}

const SIMPLE_COLORS = [
  { name: "RED", symbol: "CIRCLE", bg: "bg-rose-100", text: "text-rose-800", dot: "bg-rose-500", border: "border-rose-300", label: "Red (Morning)" },
  { name: "GREEN", symbol: "SQUARE", bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500", border: "border-emerald-300", label: "Green (Afternoon)" },
  { name: "BLUE", symbol: "TRIANGLE", bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500", border: "border-blue-300", label: "Blue (Night)" }
];
const COLOR_PALETTE = SIMPLE_COLORS;

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();
  document.getElementById("rx-current-date").innerText = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });

  loadDashboardData();
  checkSupabaseStatus();

  // Telephony toggle listener
  const toggle = document.getElementById("rx-telephony-trigger-toggle");
  if (toggle) {
    toggle.addEventListener("change", (e) => {
      const label = document.getElementById("trigger-status-label");
      if (e.target.checked) {
        label.innerText = "Trigger Active";
        label.className = "text-xs font-extrabold text-emerald-800";
      } else {
        label.innerText = "Trigger Disabled";
        label.className = "text-xs font-extrabold text-slate-500";
      }
    });
  }

  // Periodic poll for background alerts
  setInterval(() => {
    loadDashboardStatsOnly();
  }, 5000);
});

// -------------------------------------------------------------
// Navigation Router
// -------------------------------------------------------------
function navigateView(viewName) {
  const views = ["dashboard", "encounter", "patients", "tasks", "substitutions"];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.add("hidden");
  });

  // Nav highlights
  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
  const navBtn = document.getElementById(`nav-${viewName}`);
  if (navBtn) navBtn.classList.add("active");

  const target = document.getElementById(`view-${viewName}`);
  if (target) target.classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: 'smooth' });
  lucide.createIcons();

  if (viewName === "dashboard") loadDashboardData();
  if (viewName === "patients") loadPatientsList();
  if (viewName === "tasks") loadAiTasks();
  if (viewName === "substitutions") loadSubstitutions();
}

// -------------------------------------------------------------
// Command Center (Dashboard & Pending Appointments)
// -------------------------------------------------------------
async function loadDashboardData() {
  await Promise.all([
    loadDashboardStatsOnly(),
    loadPendingAppointments()
  ]);
}

async function loadDashboardStatsOnly() {
  try {
    const res = await fetch("/api/v1/doctor/stats?doctor_id=doc-1");
    const json = await res.json();
    if (json.success) {
      const stats = json.data;
      const kpiPending = document.getElementById("kpi-pending-appointments");
      const kpiPatients = document.getElementById("kpi-total-patients");
      const kpiTasks = document.getElementById("kpi-pending-tasks");
      if (kpiPending) kpiPending.innerText = stats.pending_appointments || 0;
      if (kpiPatients) kpiPatients.innerText = stats.total_patients || 0;
      if (kpiTasks) kpiTasks.innerText = stats.pending_ai_tasks || 0;

      // Update badges
      const bApp = document.getElementById("badge-nav-appointments");
      const bPat = document.getElementById("badge-nav-patients");
      const bTsk = document.getElementById("badge-nav-tasks");
      const bSub = document.getElementById("badge-nav-subs");
      if (bApp) bApp.innerText = `${stats.pending_appointments || 0} Pending`;
      if (bPat) bPat.innerText = stats.total_patients || 0;
      if (bTsk) bTsk.innerText = stats.pending_ai_tasks || 0;
      if (bSub) bSub.innerText = stats.pending_substitutions || 0;
    }
  } catch (err) {
    console.error("Error loading stats:", err);
  }
}

async function loadPendingAppointments() {
  try {
    const res = await fetch("/api/v1/doctor/appointments/pending?doctor_id=doc-1");
    const json = await res.json();
    if (json.success) {
      pendingAppointments = json.data;
      renderPendingAppointments(pendingAppointments);
      const countBadge = document.getElementById("appointments-count-badge");
      if (countBadge) countBadge.innerText = `${pendingAppointments.length} Waiting`;
    }
  } catch (err) {
    console.error("Error loading appointments:", err);
  }
}

function renderPendingAppointments(appointments) {
  const container = document.getElementById("pending-appointments-container");
  container.innerHTML = "";

  if (appointments.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center text-slate-400">
        <i data-lucide="check-circle-2" class="w-12 h-12 text-emerald-500 mx-auto mb-2"></i>
        <p class="font-extrabold text-sm text-slate-800">All Appointments Completed for Today</p>
        <p class="text-xs text-slate-400 mt-0.5">No pending consultations in the queue.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  appointments.forEach(a => {
    const card = document.createElement("div");
    card.className = "p-5 hover:bg-slate-50/75 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer";
    card.onclick = () => openEncounter(a.patient_id, a.id);

    card.innerHTML = `
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-xl bg-slate-900 text-white font-mono font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
          ${a.token_number || 'TKN'}
        </div>
        <div>
          <div class="flex items-center gap-2.5 flex-wrap">
            <h3 class="font-extrabold text-sm text-slate-900 hover:text-emerald-700">${a.full_name}</h3>
            <span class="font-mono text-xs font-bold text-slate-500">${a.patient_uhid}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">${a.age ? a.age + 'y ' : ''}${a.gender || ''}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">${a.preferred_language}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">${a.device_type === 'FEATURE_PHONE' ? 'Feature Phone' : 'Smartphone'}</span>
          </div>
          <p class="text-xs text-slate-700 mt-1">
            <strong>Reason for Visit:</strong> ${a.reason_for_visit || 'General Health Consultation'}
          </p>
          <p class="text-[11px] text-slate-400 mt-0.5">
            ${a.age} Years • ${a.gender} • Phone: ${a.phone_number} • Channel: ${a.booking_channel}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-4 self-end md:self-auto shrink-0">
        <div class="text-right">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Appointment Slot</span>
          <p class="text-xs font-extrabold text-slate-800">${a.appointment_time}</p>
        </div>
        <button class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition-all">
          <i data-lucide="file-plus-2" class="w-4 h-4"></i> Prescribe
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  lucide.createIcons();
}

// -------------------------------------------------------------
// 3-Tab Encounter Workspace
// -------------------------------------------------------------
async function openEncounter(patientId, appointmentId = null) {
  activeEncounterPatientId = patientId;
  activeEncounterAppointmentId = appointmentId;

  try {
    const res = await fetch(`/api/v1/doctor/patient-encounter/${patientId}`);
    const json = await res.json();
    if (json.success) {
      currentEncounter = json.data;
      renderEncounterHeader(currentEncounter.patient);
      renderPrescriptionHistoryTab(currentEncounter.prescription_history);
      renderMedicationHistoryTab(currentEncounter.medication_history);

      // Pre-fill / Reset New Prescription form (Tab 1)
      setupNewPrescriptionForm(currentEncounter.patient, appointmentId);

      // Default to Tab 1 (New Prescription)
      switchEncounterTab('new-rx');
      navigateView('encounter');
    }
  } catch (err) {
    console.error("Error loading encounter:", err);
  }
}

function openEncounterForPatient(patientId) {
  openEncounter(patientId, null);
}

function renderEncounterHeader(p) {
  document.getElementById("enc-patient-name").innerText = p.full_name;
  document.getElementById("enc-patient-uhid").innerText = p.patient_uhid;
  document.getElementById("enc-avatar-initials").innerText = p.full_name.split(" ").map(w => w[0]).join("").slice(0, 2);

  document.getElementById("enc-language-badge").innerText = p.preferred_language;

  // Appointment details if from queue
  const apt = pendingAppointments.find(a => a.patient_id === p.id);
  if (apt) {
    document.getElementById("enc-token-badge").innerText = apt.token_number || "TOKEN-01";
    document.getElementById("enc-appointment-time").innerText = apt.appointment_time || "Today • Scheduled";
    document.getElementById("enc-demographics-line").innerText = `${p.age} Years • ${p.gender} • Phone: ${p.phone_number} • Reason: ${apt.reason_for_visit}`;
  } else {
    document.getElementById("enc-token-badge").innerText = "DIRECT-RX";
    document.getElementById("enc-appointment-time").innerText = "Walk-In / Revisit";
    document.getElementById("enc-demographics-line").innerText = `${p.age} Years • ${p.gender} • Phone: ${p.phone_number} • Guardian: ${p.guardian_name || 'None'}`;
  }
}

function switchEncounterTab(tabKey) {
  // Hide all 3 tabs
  ["new-rx", "rx-history", "med-history"].forEach(key => {
    document.getElementById(`enc-tab-${key}`).classList.add("hidden");
    const btn = document.getElementById(`enc-tab-btn-${key}`);
    btn.classList.remove("active", "border-emerald-600", "text-emerald-700");
    btn.classList.add("border-transparent", "text-slate-500");
  });

  // Activate selected tab
  document.getElementById(`enc-tab-${tabKey}`).classList.remove("hidden");
  const activeBtn = document.getElementById(`enc-tab-btn-${tabKey}`);
  activeBtn.classList.add("active", "border-emerald-600", "text-emerald-700");
  activeBtn.classList.remove("border-transparent", "text-slate-500");

  lucide.createIcons();
}

// -------------------------------------------------------------
// TAB 1: New Prescription & Orders Builder (Normal vs Scan/Test)
// -------------------------------------------------------------
function setupNewPrescriptionForm(patient, appointmentId) {
  document.getElementById("rx-patient-id").value = patient.id;
  document.getElementById("rx-appointment-id").value = appointmentId || "";
  const symptomsNotes = document.getElementById("rx-symptoms-notes");
  if (symptomsNotes) symptomsNotes.value = "";
  const clinicalInstructions = document.getElementById("rx-clinical-instructions");
  if (clinicalInstructions) clinicalInstructions.value = "";

  // Reset Mode to Normal Prescription
  currentRxMode = "NORMAL";
  const normalRadio = document.querySelector("input[name='rx_mode'][value='NORMAL']");
  if (normalRadio) normalRadio.checked = true;
  switchRxMode("NORMAL");

  // Reset Diagnostics list
  orderedDiagnostics = [];
  renderDiagnosticOrdersTable();

  // Reset Follow-up
  clearFollowUp();
  // Default follow-up to 30 days
  setFollowUpDuration(30);

  updateWordCount("");

  // Clear Regimen table and add initial starter rows
  document.getElementById("medication-regimen-tbody").innerHTML = "";
  regimenRowCount = 0;
  addMedicationRegimenRow("Metformin Hydrochloride", "500mg", 30, "1-0-1 (Morning & Night)", "After Food");
  addMedicationRegimenRow("", "5mg", 30, "1-0-0 (Morning Only)", "After Food");
}

function switchRxMode(mode) {
  currentRxMode = mode;
  const medSection = document.getElementById("section-medication-regimen");
  const diagSection = document.getElementById("section-diagnostic-orders");
  const symptomsContainer = document.getElementById("field-symptoms-container");
  const symptomsInput = document.getElementById("rx-symptoms-notes");

  if (mode === "NORMAL") {
    if (medSection) medSection.classList.remove("hidden");
    if (diagSection) diagSection.classList.add("hidden");
    if (symptomsContainer) symptomsContainer.classList.remove("hidden");
    if (symptomsInput) symptomsInput.required = true;
  } else if (mode === "SCAN_TEST") {
    if (medSection) medSection.classList.add("hidden");
    if (diagSection) diagSection.classList.remove("hidden");
    if (symptomsContainer) symptomsContainer.classList.add("hidden");
    if (symptomsInput) symptomsInput.required = false;
  }
  lucide.createIcons();
}

// -------------------------------------------------------------
// Diagnostics Autocomplete & Table Management
// -------------------------------------------------------------
function handleDiagnosticSearchInput(query) {
  const dropdown = document.getElementById("diag-autocomplete-list");
  const q = (query || "").toLowerCase().trim();

  const matches = q.length === 0
    ? PREFED_DIAGNOSTICS.slice(0, 10)
    : PREFED_DIAGNOSTICS.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q)
      );

  dropdown.innerHTML = "";

  if (matches.length === 0) {
    dropdown.innerHTML = `<div class="p-3 text-slate-400 italic">No matching test in catalog. Click "+ Add Investigation" to add custom.</div>`;
    dropdown.classList.remove("hidden");
    return;
  }

  matches.forEach(d => {
    const item = document.createElement("div");
    item.className = "p-2.5 hover:bg-amber-50 cursor-pointer flex items-center justify-between text-xs";
    const typeBadge = d.type === 'SCAN'
      ? `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-800">SCAN / IMAGING</span>`
      : `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">LAB TEST</span>`;

    item.innerHTML = `
      <div>
        <p class="font-bold text-slate-900">${d.name}</p>
        <p class="text-[10px] text-slate-500">${d.category} • ${d.instructions}</p>
      </div>
      <div>${typeBadge}</div>
    `;

    item.onclick = () => {
      addDiagnosticToOrders(d.name, d.type, d.instructions);
      document.getElementById("diag-search-input").value = "";
      dropdown.classList.add("hidden");
    };

    dropdown.appendChild(item);
  });

  dropdown.classList.remove("hidden");
}

function quickAddDiagnostic(testName) {
  const found = PREFED_DIAGNOSTICS.find(d => d.name === testName);
  if (found) {
    addDiagnosticToOrders(found.name, found.type, found.instructions);
  } else {
    addDiagnosticToOrders(testName, "LAB_TEST", "Standard patient preparation");
  }
}

function addSelectedDiagnosticManual() {
  const input = document.getElementById("diag-search-input");
  const name = input.value.trim();
  if (!name) {
    alert("Please type a scan or lab test name to add.");
    return;
  }
  const found = PREFED_DIAGNOSTICS.find(d => d.name.toLowerCase() === name.toLowerCase());
  if (found) {
    addDiagnosticToOrders(found.name, found.type, found.instructions);
  } else {
    const isScan = name.toLowerCase().includes("scan") || name.toLowerCase().includes("x-ray") || name.toLowerCase().includes("echo") || name.toLowerCase().includes("usg");
    addDiagnosticToOrders(name, isScan ? "SCAN" : "LAB_TEST", "Standard patient preparation");
  }
  input.value = "";
  document.getElementById("diag-autocomplete-list").classList.add("hidden");
}

function addDiagnosticToOrders(testName, testType, instructions) {
  if (orderedDiagnostics.some(d => d.test_name.toLowerCase() === testName.toLowerCase())) {
    alert(`"${testName}" is already added to diagnostic orders.`);
    return;
  }
  orderedDiagnostics.push({
    test_name: testName,
    test_type: testType,
    instructions: instructions || "Standard patient preparation"
  });
  renderDiagnosticOrdersTable();
}

function removeDiagnostic(index) {
  orderedDiagnostics.splice(index, 1);
  renderDiagnosticOrdersTable();
}

function updateDiagnosticInstructions(index, value) {
  if (orderedDiagnostics[index]) {
    orderedDiagnostics[index].instructions = value.trim();
  }
}

function renderDiagnosticOrdersTable() {
  const tbody = document.getElementById("diagnostic-orders-tbody");
  tbody.innerHTML = "";

  if (orderedDiagnostics.length === 0) {
    tbody.innerHTML = `
      <tr id="empty-diagnostics-row">
        <td colspan="4" class="py-4 text-center text-slate-400 text-xs italic">
          No diagnostic scans or tests added yet. Use the search box above to add tests.
        </td>
      </tr>
    `;
    return;
  }

  orderedDiagnostics.forEach((d, idx) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-amber-50/40 transition-colors";
    const typeBadge = d.test_type === 'SCAN'
      ? `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">SCAN / IMAGING</span>`
      : `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">LAB TEST</span>`;

    tr.innerHTML = `
      <td class="py-2.5 px-3">
        <span class="font-extrabold text-slate-900">${d.test_name}</span>
      </td>
      <td class="py-2.5 px-3">
        ${typeBadge}
      </td>
      <td class="py-2.5 px-3">
        <input type="text" value="${d.instructions}" onchange="updateDiagnosticInstructions(${idx}, this.value)"
               placeholder="Instructions (e.g. Fasting 8-10h)..."
               class="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white">
      </td>
      <td class="py-2.5 px-2 text-center">
        <button type="button" onclick="removeDiagnostic(${idx})" class="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" title="Remove Test">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  lucide.createIcons();
}

// -------------------------------------------------------------
// Doctor Follow-Up Scheduling Helpers
// -------------------------------------------------------------
function setFollowUpDuration(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const dateStr = d.toISOString().split("T")[0];
  document.getElementById("rx-follow-up-date").value = dateStr;
  onFollowUpDateChanged(dateStr);
}

function clearFollowUp() {
  document.getElementById("rx-follow-up-date").value = "";
  document.getElementById("rx-follow-up-notes").value = "";
  const badge = document.getElementById("followup-display-badge");
  if (badge) {
    badge.innerText = "No Follow-up Scheduled";
    badge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600";
  }
}

function onFollowUpDateChanged(dateStr) {
  const badge = document.getElementById("followup-display-badge");
  if (!badge) return;
  if (!dateStr) {
    badge.innerText = "No Follow-up Scheduled";
    badge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600";
  } else {
    const formatted = new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
    badge.innerText = `Scheduled: ${formatted}`;
    badge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200";
  }
}

// Close autocomplete dropdown on click outside
document.addEventListener("click", (e) => {
  if (!e.target.closest("#diag-search-input")) {
    const diagDrop = document.getElementById("diag-autocomplete-list");
    if (diagDrop) diagDrop.classList.add("hidden");
  }
});

function updateWordCount(text) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const counterEl = document.getElementById("symptoms-word-counter");
  const warningEl = document.getElementById("symptoms-word-warning");
  const submitBtn = document.getElementById("btn-submit-prescription");

  counterEl.innerText = `${words} / 300 words`;

  if (words > 300) {
    counterEl.classList.remove("text-slate-500");
    counterEl.classList.add("text-rose-600");
    warningEl.classList.remove("hidden");
    submitBtn.disabled = true;
    submitBtn.classList.add("opacity-50", "cursor-not-allowed");
  } else {
    counterEl.classList.add("text-slate-500");
    counterEl.classList.remove("text-rose-600");
    warningEl.classList.add("hidden");
    submitBtn.disabled = false;
    submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
  }
}

function addMedicationRegimenRow(defaultName = "", defaultDose = "", defaultDays = 30, defaultFreq = "1-0-1 (Morning & Night)", defaultMeal = "After Food") {
  regimenRowCount++;
  const tbody = document.getElementById("medication-regimen-tbody");

  const tr = document.createElement("tr");
  tr.id = `regimen-row-${regimenRowCount}`;
  tr.className = "hover:bg-slate-50/70 transition-colors";

  tr.innerHTML = `
    <!-- Col 1: Medicine with Autocomplete -->
    <td class="py-2.5 px-3 relative">
      <input type="text" name="reg_medicine_name[]" value="${defaultName}"
             placeholder="Type medicine name (e.g. Metformin)..."
             oninput="showMedicineSuggestions(this, ${regimenRowCount})"
             onfocus="showMedicineSuggestions(this, ${regimenRowCount})"
             autocomplete="off"
             class="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-bold text-slate-800 bg-white">
      <input type="hidden" name="reg_dosage[]" id="reg-dosage-${regimenRowCount}" value="${defaultDose}">
      <div id="suggestions-${regimenRowCount}" class="hidden absolute left-3 right-3 top-11 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
        <!-- Autocomplete Suggestions -->
      </div>
    </td>

    <!-- Col 2: No. of Days -->
    <td class="py-2.5 px-3">
      <input type="number" name="reg_no_of_days[]" value="${defaultDays}" min="1" max="180"
             class="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 font-semibold text-slate-800 bg-white text-center">
    </td>

    <!-- Col 3: How Many Times (Frequency) -->
    <td class="py-2.5 px-3">
      <select name="reg_frequency[]" onchange="updateRowTimingColors(${regimenRowCount})" class="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white font-medium">
        <option value="1-0-1 (Morning & Night)" ${defaultFreq.includes('1-0-1') ? 'selected' : ''}>1-0-1 (Morning & Night)</option>
        <option value="1-0-0 (Morning Only)" ${defaultFreq.includes('1-0-0') ? 'selected' : ''}>1-0-0 (Morning Only)</option>
        <option value="0-1-0 (Afternoon Only)" ${defaultFreq.includes('0-1-0') ? 'selected' : ''}>0-1-0 (Afternoon Only)</option>
        <option value="0-0-1 (Night Only)" ${defaultFreq.includes('0-0-1') ? 'selected' : ''}>0-0-1 (Night Only)</option>
        <option value="1-1-1 (Morning, Afternoon & Night)" ${defaultFreq.includes('1-1-1') ? 'selected' : ''}>1-1-1 (Morning, Aft & Night)</option>
        <option value="1-1-0 (Morning & Afternoon)" ${defaultFreq.includes('1-1-0') ? 'selected' : ''}>1-1-0 (Morn & Aft)</option>
        <option value="0-1-1 (Afternoon & Night)" ${defaultFreq.includes('0-1-1') ? 'selected' : ''}>0-1-1 (Aft & Night)</option>
        <option value="SOS (As Needed)" ${defaultFreq.includes('SOS') ? 'selected' : ''}>SOS (As Needed)</option>
      </select>
    </td>

    <!-- Col 4: Meal Relation -->
    <td class="py-2.5 px-3">
      <select name="reg_meal_relation[]" class="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white font-medium">
        <option value="After Food" ${defaultMeal === 'After Food' ? 'selected' : ''}>After Food</option>
        <option value="Before Food" ${defaultMeal === 'Before Food' ? 'selected' : ''}>Before Food</option>
        <option value="Empty Stomach" ${defaultMeal === 'Empty Stomach' ? 'selected' : ''}>Empty Stomach</option>
        <option value="With Food" ${defaultMeal === 'With Food' ? 'selected' : ''}>With Food</option>
      </select>
    </td>

    <!-- Col 5: Tablet Timing Color Code Badge (Morning: Red, Afternoon: Green, Night: Blue) -->
    <td id="reg-color-cell-${regimenRowCount}" class="py-2.5 px-3 text-center">
      ${getTimingColorsHtml(defaultFreq)}
      <input type="hidden" name="reg_color_sticker[]" id="reg-color-input-${regimenRowCount}" value="${getTimingCodeString(defaultFreq)}">
      <input type="hidden" name="reg_symbol[]" value="TABLET">
    </td>

    <!-- Action -->
    <td class="py-2.5 px-2 text-center">
      <button type="button" onclick="removeMedicationRegimenRow(${regimenRowCount})" class="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" title="Remove medicine">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
    </td>
  `;

  tbody.appendChild(tr);
  lucide.createIcons();
}

function updateRowTimingColors(rowId) {
  const row = document.getElementById(`regimen-row-${rowId}`);
  if (!row) return;
  const freqSelect = row.querySelector("select[name='reg_frequency[]']");
  const cell = document.getElementById(`reg-color-cell-${rowId}`);
  if (freqSelect && cell) {
    cell.innerHTML = `
      ${getTimingColorsHtml(freqSelect.value)}
      <input type="hidden" name="reg_color_sticker[]" id="reg-color-input-${rowId}" value="${getTimingCodeString(freqSelect.value)}">
      <input type="hidden" name="reg_symbol[]" value="TABLET">
    `;
  }
}

function removeMedicationRegimenRow(rowId) {
  const row = document.getElementById(`regimen-row-${rowId}`);
  if (row) {
    const totalRows = document.querySelectorAll("#medication-regimen-tbody tr").length;
    if (totalRows <= 1 && currentRxMode !== "SCAN_TEST") {
      alert("A medication regimen must have at least one medicine row.");
      return;
    }
    row.remove();
  }
}

// Medicine Autocomplete Handler
function showMedicineSuggestions(inputEl, rowId) {
  const query = inputEl.value.toLowerCase().trim();
  const dropdown = document.getElementById(`suggestions-${rowId}`);

  const matches = query.length === 0
    ? PREFED_MEDICINES.slice(0, 10)
    : PREFED_MEDICINES.filter(m => m.name.toLowerCase().includes(query) || m.dosage.toLowerCase().includes(query));

  dropdown.innerHTML = "";

  if (matches.length === 0) {
    dropdown.innerHTML = `<div class="p-2.5 text-slate-400 italic">Custom medicine: press enter to keep</div>`;
    dropdown.classList.remove("hidden");
    return;
  }

  matches.forEach(m => {
    const item = document.createElement("div");
    item.className = "p-2.5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between text-xs";
    item.innerHTML = `
      <div>
        <span class="font-bold text-slate-900">${m.name}</span>
        <span class="ml-1 px-1.5 py-0.2 bg-slate-100 rounded text-[10px] font-mono font-bold text-slate-700">${m.dosage}</span>
      </div>
      <span class="text-[10px] text-slate-400">${m.defaultMeal}</span>
    `;
    item.onclick = () => {
      inputEl.value = `${m.name} ${m.dosage}`;
      document.getElementById(`reg-dosage-${rowId}`).value = m.dosage;

      const row = document.getElementById(`regimen-row-${rowId}`);
      const freqSelect = row.querySelector("select[name='reg_frequency[]']");
      const mealSelect = row.querySelector("select[name='reg_meal_relation[]']");
      if (freqSelect) freqSelect.value = m.defaultFreq;
      if (mealSelect) mealSelect.value = m.defaultMeal;
      updateRowTimingColors(rowId);

      dropdown.classList.add("hidden");
    };
    dropdown.appendChild(item);
  });

  dropdown.classList.remove("hidden");
}

// Close autocomplete dropdown on click outside
document.addEventListener("click", (e) => {
  if (!e.target.closest("input[name='reg_medicine_name[]']")) {
    document.querySelectorAll("[id^='suggestions-']").forEach(d => d.classList.add("hidden"));
  }
});

// Complete Prescription & Orders Submission
async function handleNewPrescriptionSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const patientId = document.getElementById("rx-patient-id").value;
  const appointmentId = document.getElementById("rx-appointment-id").value;
  const diagnosis = currentRxMode === "NORMAL" ? "Clinical Prescription Notes" : "Diagnostic Investigation Order";
  const symptomsInput = document.getElementById("rx-symptoms-notes");
  const symptoms = (symptomsInput && currentRxMode === "NORMAL") ? (symptomsInput.value.trim() || "Observed clinical symptoms") : "Diagnostic Scan / Lab Investigation Consultation";
  const followUpDate = document.getElementById("rx-follow-up-date").value;
  const followUpNotes = document.getElementById("rx-follow-up-notes").value;
  const instructions = document.getElementById("rx-clinical-instructions").value;
  const triggerEnabled = document.getElementById("rx-telephony-trigger-toggle").checked;

  // Collect Medication Regimen Rows
  const medNames = Array.from(form.querySelectorAll("input[name='reg_medicine_name[]']")).map(i => i.value.trim());
  const dosages = Array.from(form.querySelectorAll("input[name='reg_dosage[]']")).map(i => i.value.trim());
  const daysList = Array.from(form.querySelectorAll("input[name='reg_no_of_days[]']")).map(i => parseInt(i.value) || 30);
  const frequencies = Array.from(form.querySelectorAll("select[name='reg_frequency[]']")).map(s => s.value);
  const mealRelations = Array.from(form.querySelectorAll("select[name='reg_meal_relation[]']")).map(s => s.value);
  const colorStickers = Array.from(form.querySelectorAll("[name='reg_color_sticker[]']")).map(s => s.value);
  const symbols = Array.from(form.querySelectorAll("[name='reg_symbol[]']")).map(s => s.value);

  const medicines = medNames.map((name, idx) => {
    const sticker = colorStickers[idx] || "RED_BLUE";
    const symbol = symbols[idx] || "TABLET";
    return {
      medicine_name: name,
      dosage: dosages[idx] || "Standard Dose",
      duration_days: daysList[idx],
      no_of_days: daysList[idx],
      frequency: frequencies[idx],
      meal_relation: mealRelations[idx],
      color_sticker: sticker,
      symbol: symbol
    };
  }).filter(m => m.medicine_name.length > 0);

  // Mode validation
  if (currentRxMode === "NORMAL" && medicines.length === 0) {
    alert("Normal Prescription requires at least one medicine in the Medication Regimen.");
    return;
  }
  if (currentRxMode === "SCAN_TEST" && orderedDiagnostics.length === 0) {
    alert("Scan/Lab Test mode requires at least one diagnostic scan or lab test ordered.");
    return;
  }
  }

  const payload = {
    doctor_id: "doc-1",
    doctor_name: "Dr. Suresh Sharma, MD",
    patient_id: patientId,
    appointment_id: appointmentId || null,
    prescription_type: currentRxMode,
    diagnosis_notes: diagnosis,
    symptoms_notes: symptoms,
    clinical_instructions: instructions,
    follow_up_date: followUpDate || null,
    follow_up_notes: followUpNotes || null,
    telephony_trigger_enabled: triggerEnabled,
    medicines: medicines,
    diagnostics: orderedDiagnostics
  };

  try {
    const res = await fetch("/api/v1/doctor/prescriptions/submit-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      alert(`✅ Prescription v${json.data.revision_number} (${json.data.prescription_type}) Submitted!\n` +
            `Attending Doctor: ${json.data.doctor_name}\n` +
            `Medicines Prescribed: ${json.data.medicines_count}\n` +
            `Diagnostics Ordered: ${json.data.diagnostics_count}\n` +
            `Follow-Up Date: ${json.data.follow_up_date || 'None'}\n` +
            `AI Calling Agent Dual Trigger: ${json.data.telephony_trigger_enabled ? 'QUEUED & ACTIVE' : 'OFF'}`);

      // Refresh encounter data
      await openEncounter(patientId, null);
      // Switch to Prescription History tab
      switchEncounterTab('rx-history');
      loadDashboardData();
    } else {
      alert(`Submission Error: ${json.error}`);
    }
  } catch (err) {
    console.error("Submission failed:", err);
    alert("Failed to submit prescription.");
  }
}

// -------------------------------------------------------------
// TAB 2: Prescription History (Read-Only)
// -------------------------------------------------------------
function renderPrescriptionHistoryTab(history) {
  const container = document.getElementById("encounter-rx-history-container");
  container.innerHTML = "";

  if (!history || history.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
        <i data-lucide="file-text" class="w-10 h-10 mx-auto mb-2 text-slate-300"></i>
        <p class="font-bold text-sm text-slate-700">No Past Prescriptions on Record</p>
        <p class="text-xs text-slate-400 mt-0.5">Use Tab 1 to draft the patient's initial prescription (Revision v1).</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  history.forEach(rx => {
    const isCommitted = rx.status === "COMMITTED";
    const statusChip = isCommitted
      ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">SEALED & COMMITTED (IMMUTABLE)</span>`
      : `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">DRAFT</span>`;

    const rxType = rx.prescription_type || "COMPREHENSIVE";
    const typeChip = rxType === "NORMAL"
      ? `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">MEDICATION RX</span>`
      : rxType === "SCAN_TEST"
      ? `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">DIAGNOSTICS ONLY</span>`
      : `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">COMPREHENSIVE (MEDS + TESTS)</span>`;

    // Medicines list HTML
    let medsListHtml = "";
    if (rx.medicines && rx.medicines.length > 0) {
      rx.medicines.forEach(m => {
        medsListHtml += `
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
            <div class="flex items-center gap-3">
              <div class="shrink-0">
                ${getTimingColorsHtml(m.frequency)}
              </div>
              <div>
                <p class="font-extrabold text-slate-900">${m.medicine_name} ${m.dosage}</p>
                <p class="text-[11px] text-slate-500">${m.duration_days} Days • ${m.frequency} • ${m.meal_relation || 'After Food'}</p>
              </div>
            </div>
            <span class="text-[11px] font-mono text-slate-400">${m.dispense_status}</span>
          </div>
        `;
      });
    } else {
      medsListHtml = `<p class="text-xs text-slate-400 italic">No medication items ordered in this prescription.</p>`;
    }

    // Diagnostics list HTML
    let diagsListHtml = "";
    if (rx.diagnostics && rx.diagnostics.length > 0) {
      rx.diagnostics.forEach(d => {
        const typeBadge = d.test_type === 'SCAN'
          ? `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-800">SCAN</span>`
          : `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">LAB TEST</span>`;
        diagsListHtml += `
          <div class="p-2.5 bg-amber-50/50 rounded-xl border border-amber-100 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2.5">
              ${typeBadge}
              <div>
                <p class="font-extrabold text-slate-900">${d.test_name}</p>
                <p class="text-[11px] text-slate-500">${d.instructions || 'Standard preparation'}</p>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800">${d.status}</span>
          </div>
        `;
      });
    }

    const card = document.createElement("div");
    card.className = "bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm";
    card.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div class="flex items-center gap-2.5 flex-wrap">
          <span class="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-900 text-white font-mono">Revision v${rx.revision_number}</span>
          ${statusChip}
          ${typeChip}
          <span class="text-xs font-extrabold text-slate-800">Prescribed by: ${rx.doctor_name}</span>
        </div>
        <div class="text-xs text-slate-400 font-mono">
          ${new Date(rx.created_at).toLocaleString()}
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p class="font-bold text-slate-900">Diagnosis:</p>
          <p class="text-slate-700 mt-0.5">${rx.diagnosis_notes}</p>
        </div>
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div class="flex items-center justify-between">
            <p class="font-bold text-slate-900">Symptoms & Clinical Notes:</p>
            <span class="text-[10px] font-mono text-slate-400">${rx.word_count || 0} words</span>
          </div>
          <p class="text-slate-700 mt-0.5 italic">"${rx.symptoms_notes || 'No symptoms notes recorded.'}"</p>
        </div>
      </div>

      ${rx.medicines && rx.medicines.length > 0 ? `
      <div class="space-y-2">
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prescribed Medication Regimen</p>
        <div class="space-y-1.5">${medsListHtml}</div>
      </div>` : ''}

      ${rx.diagnostics && rx.diagnostics.length > 0 ? `
      <div class="space-y-2">
        <p class="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
          <i data-lucide="microscope" class="w-3.5 h-3.5"></i> Diagnostic Orders (Scans & Lab Investigations)
        </p>
        <div class="space-y-1.5">${diagsListHtml}</div>
      </div>` : ''}

      <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div>
          <span class="text-slate-500">Scheduled Follow-Up: </span>
          <strong class="text-slate-900">${rx.follow_up_date || 'None'}</strong>
          ${rx.follow_up_notes ? `<span class="text-indigo-700 font-semibold ml-2">(${rx.follow_up_notes})</span>` : ''}
        </div>
        <div class="flex items-center gap-2">
          ${rx.diagnostics && rx.diagnostics.length > 0 && rx.follow_up_date ? `
            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800">
              📋 Pre-Appointment Report Reminder Active
            </span>` : ''}
          <span class="text-[11px] font-mono text-slate-500">AI Calling Trigger: <strong>${rx.telephony_trigger_enabled ? 'ENABLED' : 'DISABLED'}</strong></span>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  lucide.createIcons();
}

// -------------------------------------------------------------
// TAB 3: Medication History (Read-Only)
// -------------------------------------------------------------
function renderMedicationHistoryTab(history) {
  const tbody = document.getElementById("encounter-med-history-tbody");
  tbody.innerHTML = "";

  if (!history || history.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400 italic">No medication history recorded for this patient.</td></tr>`;
    return;
  }

  history.forEach(m => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50/70 transition-colors";
    tr.innerHTML = `
      <td class="py-3 px-4">
        <div class="font-extrabold text-slate-900">${m.medicine_name}</div>
        <div class="text-[10px] font-mono text-slate-400">${m.dosage} • Revision v${m.revision_number}</div>
      </td>
      <td class="py-3 px-4 font-bold text-slate-700">${m.no_of_days} Days</td>
      <td class="py-3 px-4 font-medium text-slate-700">${m.frequency}</td>
      <td class="py-3 px-4">
        <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">${m.meal_relation}</span>
      </td>
      <td class="py-3 px-4 text-center">
        ${getTimingColorsHtml(m.frequency)}
      </td>
      <td class="py-3 px-4 font-mono text-xs text-slate-500">
        ${new Date(m.prescribed_date).toLocaleDateString()}
      </td>
      <td class="py-3 px-4 font-bold text-slate-800">
        ${m.prescribed_by}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// -------------------------------------------------------------
// Patients Directory (8 Demo Patients)
// -------------------------------------------------------------
async function loadPatientsList() {
  try {
    const res = await fetch("/api/v1/doctor/patients");
    const json = await res.json();
    if (json.success) {
      currentPatients = json.data;
      renderPatientsDirectoryTable(currentPatients);
    }
  } catch (err) {
    console.error("Error loading patients:", err);
  }
}

function renderPatientsDirectoryTable(patients) {
  const tbody = document.getElementById("patients-table-body");
  tbody.innerHTML = "";

  patients.forEach(p => {
    const rx = p.latest_prescription;
    const rxChip = rx
      ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold ${rx.status === 'COMMITTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">v${rx.revision_number} (${rx.status})</span>`
      : `<span class="text-slate-400 italic">No Rx</span>`;

    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50 transition-colors";
    tr.innerHTML = `
      <td class="py-3 px-4">
        <div class="font-extrabold text-slate-900">${p.full_name}</div>
        <div class="font-mono text-[10px] text-slate-500">${p.patient_uhid}</div>
      </td>
      <td class="py-3 px-4">
        <div class="font-bold text-slate-800">${p.age}y • ${p.gender}</div>
        <div class="font-mono text-[10px] text-slate-500">${p.phone_number}</div>
      </td>
      <td class="py-3 px-4">
        <div class="font-bold text-indigo-700">${p.preferred_language}</div>
        <div class="text-[10px] text-slate-400">${p.device_type === 'FEATURE_PHONE' ? 'Feature Phone' : 'Smartphone'}</div>
      </td>
      <td class="py-3 px-4">${rxChip}</td>
      <td class="py-3 px-4 font-bold text-emerald-700">${p.adherence_rate}%</td>
      <td class="py-3 px-4 text-right">
        <button onclick="openEncounter('${p.id}')" class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm">
          Prescribe
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  lucide.createIcons();
}

function filterPatients(query) {
  const q = query.toLowerCase().trim();
  const filtered = currentPatients.filter(p =>
    p.full_name.toLowerCase().includes(q) ||
    p.patient_uhid.toLowerCase().includes(q) ||
    p.phone_number.includes(q)
  );
  renderPatientsDirectoryTable(filtered);
}

function filterLanguage(lang) {
  if (lang === "ALL") {
    renderPatientsDirectoryTable(currentPatients);
  } else {
    renderPatientsDirectoryTable(currentPatients.filter(p => p.preferred_language === lang));
  }
}


// -------------------------------------------------------------
// AI Call Triage Desk
// -------------------------------------------------------------
async function loadAiTasks() {
  try {
    const res = await fetch("/api/v1/doctor/tasks/pending");
    const json = await res.json();
    if (json.success) {
      const container = document.getElementById("pending-tasks-list");
      container.innerHTML = "";

      if (json.data.length === 0) {
        container.innerHTML = `
          <div class="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
            <i data-lucide="check-circle" class="w-10 h-10 text-emerald-500 mx-auto mb-2"></i>
            <p class="font-bold text-sm text-slate-800">All Patient Phone Calls Triaged</p>
            <p class="text-xs text-slate-400 mt-1">No pending voice symptom reports awaiting clinical oversight.</p>
          </div>
        `;
        lucide.createIcons();
        return;
      }

      json.data.forEach(t => {
        const card = document.createElement("div");
        card.className = "bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm";
        card.innerHTML = `
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800">PRIORITY: ${t.priority}</span>
              <span class="font-extrabold text-sm text-slate-900">${t.patient_name} (${t.patient_uhid})</span>
            </div>
            <span class="text-xs text-slate-400">${new Date(t.created_at).toLocaleTimeString()}</span>
          </div>

          <div class="bg-amber-50/70 border border-amber-100 p-3.5 rounded-xl space-y-1">
            <p class="text-[10px] font-bold uppercase tracking-wider text-amber-900">Vernacular Audio Transcript (${t.preferred_language}):</p>
            <p class="text-xs font-semibold text-amber-950 italic">"${t.raw_transcript}"</p>
          </div>

          <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Candidate Action Extracted (Human Approval Required):</p>
            <p class="text-xs text-slate-800 font-medium">${t.ai_extracted_summary}</p>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button onclick="reviewTask('${t.id}', 'REJECT')" class="px-3.5 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all">
              Dismiss
            </button>
            <button onclick="reviewTask('${t.id}', 'APPROVE')" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all">
              Approve as Clinical Task
            </button>
          </div>
        `;
        container.appendChild(card);
      });
      lucide.createIcons();
    }
  } catch (err) {
    console.error(err);
  }
}

async function reviewTask(taskId, decision) {
  try {
    const res = await fetch(`/api/v1/tasks/${taskId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctor_id: "doc-1", decision })
    });
    const json = await res.json();
    if (json.success) {
      loadAiTasks();
      loadDashboardStatsOnly();
    }
  } catch (err) {
    console.error(err);
  }
}

// -------------------------------------------------------------
// Pharmacy Substitution Gate
// -------------------------------------------------------------
async function loadSubstitutions() {
  try {
    const res = await fetch("/api/v1/doctor/substitutions/pending");
    const json = await res.json();
    if (json.success) {
      const container = document.getElementById("pending-subs-list");
      container.innerHTML = "";

      if (json.data.length === 0) {
        container.innerHTML = `
          <div class="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
            <i data-lucide="check-circle" class="w-10 h-10 text-emerald-500 mx-auto mb-2"></i>
            <p class="font-bold text-sm text-slate-800">No Pending Pharmacy Substitutions</p>
            <p class="text-xs text-slate-400 mt-1">All dispensed medicines match prescribed formulas.</p>
          </div>
        `;
        lucide.createIcons();
        return;
      }

      json.data.forEach(s => {
        const card = document.createElement("div");
        card.className = "bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm";
        card.innerHTML = `
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800">PHARMACY OUT OF STOCK</span>
              <span class="font-extrabold text-sm text-slate-900">${s.patient_name} (${s.patient_uhid})</span>
            </div>
            <span class="text-xs text-slate-400">${new Date(s.created_at).toLocaleTimeString()}</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="p-3 bg-rose-50 rounded-xl border border-rose-100">
              <p class="text-[10px] font-bold uppercase tracking-wider text-rose-700">Prescribed Medicine</p>
              <p class="text-sm font-extrabold text-rose-950 mt-1">${s.original_medicine_name}</p>
            </div>
            <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <p class="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Proposed Bioequivalent Alternative</p>
              <p class="text-sm font-extrabold text-emerald-950 mt-1">${s.proposed_medicine_name}</p>
            </div>
          </div>

          <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pharmacist Notes</p>
            <p class="text-xs text-slate-700 mt-0.5">${s.reason_for_substitution}</p>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button onclick="reviewSubstitution('${s.id}', 'REJECT')" class="px-3.5 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all">
              Reject (Keep Original)
            </button>
            <button onclick="reviewSubstitution('${s.id}', 'APPROVE')" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all">
              Approve Alternative & Issue Revision
            </button>
          </div>
        `;
        container.appendChild(card);
      });
      lucide.createIcons();
    }
  } catch (err) {
    console.error(err);
  }
}

async function reviewSubstitution(subId, decision) {
  try {
    const res = await fetch(`/api/v1/doctor/substitutions/${subId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctor_id: "doc-1", decision })
    });
    const json = await res.json();
    if (json.success) {
      alert(json.data.message);
      loadSubstitutions();
      loadDashboardStatsOnly();
    }
  } catch (err) {
    console.error(err);
  }
}

// -------------------------------------------------------------
// Interactive Navigation & Modals
// -------------------------------------------------------------
function scrollToPendingAppointments() {
  if (currentView !== 'dashboard') {
    navigateView('dashboard');
  }
  setTimeout(() => {
    const card = document.getElementById("appointments-queue-card");
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      card.classList.add("ring-4", "ring-emerald-400/50");
      setTimeout(() => {
        card.classList.remove("ring-4", "ring-emerald-400/50");
      }, 1500);
    }
  }, 100);
}

function openArchitectureModal() {
  document.getElementById("architecture-modal").classList.remove("hidden");
}

function closeArchitectureModal() {
  document.getElementById("architecture-modal").classList.add("hidden");
}

// Supabase Realtime Bridge Management
function openSupabaseModal() {
  document.getElementById("supabase-modal").classList.remove("hidden");
  checkSupabaseStatus();
}

function closeSupabaseModal() {
  document.getElementById("supabase-modal").classList.add("hidden");
}

async function checkSupabaseStatus() {
  try {
    const res = await fetch("/api/v1/doctor/supabase/status");
    const json = await res.json();
    const ind = document.getElementById("sidebar-supabase-indicator");
    const lbl = document.getElementById("sidebar-supabase-label");
    const modalTxt = document.getElementById("supabase-modal-status-text");
    const projInput = document.getElementById("supabase-project-id");

    if (json.configured) {
      if (ind) {
        ind.className = "w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse";
      }
      if (lbl) {
        lbl.innerText = `Supabase: Connected (${json.project_id || 'Active'})`;
      }
      if (modalTxt) {
        modalTxt.innerHTML = `<span class="text-emerald-700 font-bold">✅ Connected to Supabase (${json.project_id || 'Active'})</span>`;
      }
      if (projInput && !projInput.value) {
        projInput.value = json.project_id || "";
      }
    } else {
      if (ind) {
        ind.className = "w-2.5 h-2.5 rounded-full bg-amber-400";
      }
      if (lbl) {
        lbl.innerText = "Supabase: Standby";
      }
      if (modalTxt) {
        modalTxt.innerHTML = `<span class="text-amber-700 font-bold">⚡ Ready for credentials (Enter Project ID & Anon Key)</span>`;
      }
    }
  } catch (err) {
    console.warn("Supabase status check:", err);
  }
}

async function handleSupabaseConfigSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const projectId = form.project_id.value.trim();
  const anonKey = form.anon_key.value.trim();

  if (!projectId || !anonKey) {
    alert("Please enter both Supabase Project ID and Anon Key.");
    return;
  }

  const statusText = document.getElementById("supabase-modal-status-text");
  if (statusText) statusText.innerText = "Saving & testing connection...";

  try {
    const res = await fetch("/api/v1/doctor/supabase/configure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, anon_key: anonKey })
    });
    const json = await res.json();
    if (json.success) {
      alert("✅ Supabase configured and connected successfully! Live database sync is now ACTIVE.");
      closeSupabaseModal();
      checkSupabaseStatus();
    } else {
      alert(`⚠️ Connection check notice: ${json.error || 'Saved credentials. Test connection to verify.'}`);
      checkSupabaseStatus();
    }
  } catch (err) {
    alert(`Error updating Supabase settings: ${err.message}`);
  }
}

async function testSupabaseConnection() {
  const statusText = document.getElementById("supabase-modal-status-text");
  if (statusText) statusText.innerText = "Testing Supabase REST ping...";
  try {
    const res = await fetch("/api/v1/doctor/supabase/status?ping=true");
    const json = await res.json();
    if (json.ping_success) {
      if (statusText) statusText.innerHTML = `<span class="text-emerald-700 font-bold">✅ Ping OK (${json.ping_latency_ms || 12}ms) — Supabase REST Live</span>`;
    } else {
      if (statusText) statusText.innerHTML = `<span class="text-amber-700 font-bold">${json.ping_message || 'Supabase reachable, awaiting credentials'}</span>`;
    }
  } catch (err) {
    if (statusText) statusText.innerText = `Test error: ${err.message}`;
  }
}
