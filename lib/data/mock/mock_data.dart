import '../../models/patient.dart';
import '../../models/medication.dart';
import '../../models/diagnostic_test.dart';
import '../../models/appointment.dart';
import '../../models/prescription.dart';

class MockData {
  // -------------------------------------------------------------
  // Fictional Demo Patients
  // -------------------------------------------------------------
  static final List<Patient> patients = [
    const Patient(
      id: 'p-001',
      uniquePatientId: 'PNT10492',
      fullName: 'Lakshmi Devi',
      age: 62,
      gender: 'Female',
      phoneNumber: '+91 98765 43210',
      emergencyContact: '+91 98765 43299 (Suresh - Son)',
      preferredLanguage: 'Kannada / English',
      bloodGroup: 'O+',
      allergies: ['Sulfa Antibiotics', 'Mild Penicillin Sensitivity'],
      primaryDiagnosis: 'Essential Hypertension & Preventative Cardiac Care',
      abhaNumber: '14-8821-4902-1104',
    ),
    const Patient(
      id: 'p-002',
      uniquePatientId: 'PNT20841',
      fullName: 'Rajesh Sharma',
      age: 45,
      gender: 'Male',
      phoneNumber: '+91 98123 45678',
      emergencyContact: '+91 98123 45600 (Anita - Spouse)',
      preferredLanguage: 'Hindi / English',
      bloodGroup: 'B+',
      allergies: ['No Known Drug Allergies (NKDA)'],
      primaryDiagnosis: 'Type 2 Diabetes Mellitus & Lumbar Spine Care',
      abhaNumber: '22-4910-8201-9932',
    ),
  ];

  // -------------------------------------------------------------
  // Patient 1: Lakshmi Devi Data (Cardiology Focus)
  // -------------------------------------------------------------
  static final List<Medication> _p1Rx1Meds = [
    Medication(
      id: 'med-001',
      prescriptionId: 'rx-001',
      name: 'Amlodipine Besylate',
      strength: '5 mg',
      dosage: '1 Tablet',
      frequency: 'Once Daily (OD)',
      timing: 'Morning 08:00 AM',
      mealInstruction: MealInstruction.afterFood,
      duration: '90 Days',
      prescribingDoctor: 'Dr. Arvind Kumar, MD DM',
      prescribedDate: DateTime(2026, 10, 4),
      isActive: true,
      stickerColor: 'Blue',
      clinicalNotes:
          'Maintain regular morning schedule. Monitor resting BP weekly. Do not skip doses.',
    ),
    Medication(
      id: 'med-002',
      prescriptionId: 'rx-001',
      name: 'Atorvastatin Calcium',
      strength: '10 mg',
      dosage: '1 Tablet',
      frequency: 'Once Daily (OD)',
      timing: 'Night 09:00 PM',
      mealInstruction: MealInstruction.afterFood,
      duration: '90 Days',
      prescribingDoctor: 'Dr. Arvind Kumar, MD DM',
      prescribedDate: DateTime(2026, 10, 4),
      isActive: true,
      stickerColor: 'Red',
      clinicalNotes:
          'Take at bedtime. For preventative atherosclerotic cardiovascular risk reduction.',
    ),
    Medication(
      id: 'med-003',
      prescriptionId: 'rx-001',
      name: 'Metformin Hydrochloride',
      strength: '500 mg',
      dosage: '1 Tablet',
      frequency: 'Twice Daily (BD)',
      timing: 'Morning 08:30 AM & Night 08:30 PM',
      mealInstruction: MealInstruction.withFood,
      duration: '90 Days',
      prescribingDoctor: 'Dr. Arvind Kumar, MD DM',
      prescribedDate: DateTime(2026, 10, 4),
      isActive: true,
      stickerColor: 'Amber',
      clinicalNotes:
          'Take with meals to prevent gastrointestinal discomfort. Stable blood sugar control.',
    ),
  ];

  static final List<DiagnosticTest> _p1Rx1Tests = [
    DiagnosticTest(
      id: 'test-001',
      prescriptionId: 'rx-001',
      testName: '12-Lead Electrocardiogram (ECG)',
      category: TestCategory.cardiac,
      orderedDate: DateTime(2026, 10, 4),
      completedDate: DateTime(2026, 10, 4),
      orderingDoctor: 'Dr. Arvind Kumar, MD DM',
      diagnosticCenter: 'St. John’s Non-Invasive Cardiac Lab',
      status: TestStatus.completed,
      hasReport: true,
      reportSummary:
          'Normal sinus rhythm at 72 bpm. PR interval 158 ms. QRS duration 86 ms. No significant ST-T wave abnormalities or acute ischemic changes detected. Compared with previous trace: Unchanged.',
      reportFileName: 'ECG_Report_LakshmiDevi_Oct2026.pdf',
      keyFindings: {
        'Heart Rate': '72 bpm (Normal Sinus)',
        'Rhythm': 'Regular',
        'PR Interval': '158 ms (Normal)',
        'QRS Axis': '+45° (Normal Axis)',
        'Conclusion': 'Within normal limits for age. No ischemic findings.',
      },
    ),
    DiagnosticTest(
      id: 'test-002',
      prescriptionId: 'rx-001',
      testName: 'Comprehensive Lipid Profile Panel',
      category: TestCategory.labTest,
      orderedDate: DateTime(2026, 10, 4),
      completedDate: DateTime(2026, 10, 5),
      orderingDoctor: 'Dr. Arvind Kumar, MD DM',
      diagnosticCenter: 'Apollo Central Pathology Services',
      status: TestStatus.completed,
      hasReport: true,
      reportSummary:
          'Total Cholesterol: 182 mg/dL (Desirable < 200). HDL Cholesterol: 48 mg/dL. LDL Cholesterol: 106 mg/dL (Optimal on Statin). Triglycerides: 140 mg/dL (Normal < 150). Lipid targets well controlled on current therapy.',
      reportFileName: 'LipidProfile_LakshmiDevi_Oct2026.pdf',
      keyFindings: {
        'Total Cholesterol': '182 mg/dL (Desirable: <200)',
        'HDL (Good Cholesterol)': '48 mg/dL (Normal: >45)',
        'LDL (Bad Cholesterol)': '106 mg/dL (Target: <100)',
        'Triglycerides': '140 mg/dL (Normal: <150)',
        'Risk Ratio': '3.79 (Low-Intermediate Risk)',
      },
    ),
    DiagnosticTest(
      id: 'test-003',
      prescriptionId: 'rx-001',
      testName: '2D Echocardiogram with Color Doppler',
      category: TestCategory.diagnosticScan,
      orderedDate: DateTime(2026, 10, 4),
      scheduledDate: DateTime(2026, 10, 28, 11, 0),
      orderingDoctor: 'Dr. Arvind Kumar, MD DM',
      diagnosticCenter: 'St. John’s Cardiac Imaging Suite 2',
      status: TestStatus.scheduled,
      hasReport: false,
      reportSummary: null,
      reportFileName: null,
    ),
  ];

  static final Appointment _p1ConfirmedAppt = Appointment(
    id: 'appt-001',
    patientId: 'p-001',
    doctorName: 'Dr. Arvind Kumar',
    doctorSpecialty: 'Senior Interventional Cardiologist, MD DM',
    department: 'Department of Cardiology & Vascular Medicine',
    dateTime: DateTime(2026, 10, 28, 10, 30),
    location: 'St. John’s Heart Centre, OPD Block 3, Room 304',
    status: AppointmentStatus.confirmed,
    clinicalReason:
        'Post-Echocardiogram Review & Antihypertensive Dose Optimization',
    isFollowUp: true,
  );

  static final List<Prescription> _p1Prescriptions = [
    Prescription(
      id: 'rx-001',
      referenceNumber: 'RX-2026-1049',
      patientId: 'p-001',
      date: DateTime(2026, 10, 4),
      doctorName: 'Dr. Arvind Kumar',
      doctorSpecialty: 'Senior Interventional Cardiologist, MD DM',
      hospitalOrClinic: 'St. John’s Heart Centre, Bangalore',
      diagnosis: 'Essential Hypertension & Preventative Cardiac Care',
      visitReason:
          'Quarterly Cardiovascular Follow-up & Blood Pressure Staging',
      doctorInstructions:
          'Patient blood pressure in clinic 128/82 mmHg. Continue low sodium diet (< 2g sodium/day). Moderate 30 min daily walking. Strictly take Amlodipine after morning meal. Do not stop without medical review.',
      medications: _p1Rx1Meds,
      associatedTests: _p1Rx1Tests,
      followUpRecommendationText:
          'Doctor Recommended Review: 24 Nov 2026 with repeat Serum Creatinine and weekly home BP logs.',
      recommendedFollowUpDate: DateTime(2026, 11, 24, 10, 0),
      confirmedAppointment: _p1ConfirmedAppt,
      status: PrescriptionStatus.active,
    ),
    Prescription(
      id: 'rx-002',
      referenceNumber: 'RX-2026-0612',
      patientId: 'p-001',
      date: DateTime(2026, 6, 14),
      doctorName: 'Dr. Arvind Kumar',
      doctorSpecialty: 'Senior Interventional Cardiologist, MD DM',
      hospitalOrClinic: 'St. John’s Heart Centre, Bangalore',
      diagnosis: 'Stage 1 Hypertension & Hyperlipidemia Initiation',
      visitReason: 'Initial Cardiac Risk Evaluation and Medication Titration',
      doctorInstructions:
          'Initial blood pressure was 142/90 mmHg. Discontinued Telmisartan due to mild dry cough complaints; switched to Amlodipine monotherapy.',
      medications: [
        Medication(
          id: 'med-004',
          prescriptionId: 'rx-002',
          name: 'Telmisartan',
          strength: '40 mg',
          dosage: '1 Tablet',
          frequency: 'Once Daily',
          timing: 'Morning 08:00 AM',
          mealInstruction: MealInstruction.afterFood,
          duration: '30 Days (Discontinued)',
          prescribingDoctor: 'Dr. Arvind Kumar, MD DM',
          prescribedDate: DateTime(2026, 6, 14),
          isActive: false, // Explicitly historical
          clinicalNotes:
              'Discontinued after 4 weeks due to dry throat. Replaced with Amlodipine.',
        ),
        Medication(
          id: 'med-005',
          prescriptionId: 'rx-002',
          name: 'Amlodipine Besylate (Initial Titration)',
          strength: '2.5 mg',
          dosage: '1 Tablet',
          frequency: 'Once Daily',
          timing: 'Morning 08:00 AM',
          mealInstruction: MealInstruction.afterFood,
          duration: '90 Days',
          prescribingDoctor: 'Dr. Arvind Kumar, MD DM',
          prescribedDate: DateTime(2026, 6, 14),
          isActive: false, // Explicitly historical (superseded by 5mg)
          clinicalNotes: 'Step-up titration to 5mg completed on Oct 2026.',
        ),
      ],
      associatedTests: [
        DiagnosticTest(
          id: 'test-004',
          prescriptionId: 'rx-002',
          testName: 'Serum Creatinine & Electrolytes Panel',
          category: TestCategory.labTest,
          orderedDate: DateTime(2026, 6, 14),
          completedDate: DateTime(2026, 6, 15),
          orderingDoctor: 'Dr. Arvind Kumar, MD DM',
          diagnosticCenter: 'Apollo Central Pathology Services',
          status: TestStatus.completed,
          hasReport: true,
          reportSummary:
              'Serum Creatinine 0.88 mg/dL (Normal). eGFR > 85 mL/min/1.73m². Sodium 141 mEq/L, Potassium 4.2 mEq/L. Renal function completely preserved.',
          reportFileName: 'Creatinine_LakshmiDevi_Jun2026.pdf',
          keyFindings: {
            'Serum Creatinine': '0.88 mg/dL (Normal: 0.6 - 1.1)',
            'eGFR': '> 85 mL/min (Normal)',
            'Serum Potassium': '4.2 mEq/L (Normal: 3.5 - 5.0)',
            'Serum Sodium': '141 mEq/L (Normal: 135 - 145)',
          },
        ),
      ],
      followUpRecommendationText: 'Review in 3 months with repeat BP staging.',
      recommendedFollowUpDate: DateTime(2026, 9, 15),
      confirmedAppointment: null,
      status: PrescriptionStatus.completed,
    ),
  ];

  // -------------------------------------------------------------
  // Patient 2: Rajesh Sharma Data (Endocrinology & Spine Focus)
  // -------------------------------------------------------------
  static final List<Medication> _p2Rx1Meds = [
    Medication(
      id: 'med-101',
      prescriptionId: 'rx-101',
      name: 'Glimepiride',
      strength: '2 mg',
      dosage: '1 Tablet',
      frequency: 'Once Daily (OD)',
      timing: 'Morning 07:45 AM (15 min Before Breakfast)',
      mealInstruction: MealInstruction.beforeFood,
      duration: '60 Days',
      prescribingDoctor: 'Dr. Meenakshi Sundaram, MD',
      prescribedDate: DateTime(2026, 10, 10),
      isActive: true,
      stickerColor: 'Blue',
      clinicalNotes:
          'Strictly take 15 minutes prior to first meal. Carry glucose biscuits for hypoglycemia safety.',
    ),
    Medication(
      id: 'med-102',
      prescriptionId: 'rx-101',
      name: 'Metformin Hydrochloride (Extended Release)',
      strength: '1000 mg',
      dosage: '1 Tablet',
      frequency: 'Once Daily (OD)',
      timing: 'Night 08:30 PM (Dinner)',
      mealInstruction: MealInstruction.withFood,
      duration: '60 Days',
      prescribingDoctor: 'Dr. Meenakshi Sundaram, MD',
      prescribedDate: DateTime(2026, 10, 10),
      isActive: true,
      stickerColor: 'Red',
      clinicalNotes:
          'Swallow whole with water at dinner. Do not crush or chew tablet.',
    ),
    Medication(
      id: 'med-103',
      prescriptionId: 'rx-101',
      name: 'Methylcobalamin + Alpha Lipoic Acid',
      strength: '1500 mcg / 100 mg',
      dosage: '1 Capsule',
      frequency: 'Once Daily (OD)',
      timing: 'Morning 09:00 AM',
      mealInstruction: MealInstruction.afterFood,
      duration: '30 Days',
      prescribingDoctor: 'Dr. Meenakshi Sundaram, MD',
      prescribedDate: DateTime(2026, 10, 10),
      isActive: true,
      stickerColor: 'Green',
      clinicalNotes:
          'Neuro-supportive antioxidant formulation for diabetic peripheral neuropathy symptoms.',
    ),
  ];

  static final List<DiagnosticTest> _p2Rx1Tests = [
    DiagnosticTest(
      id: 'test-101',
      prescriptionId: 'rx-101',
      testName: 'Glycated Hemoglobin (HbA1c) & Fasting Plasma Glucose',
      category: TestCategory.labTest,
      orderedDate: DateTime(2026, 10, 10),
      completedDate: DateTime(2026, 10, 10),
      orderingDoctor: 'Dr. Meenakshi Sundaram, MD',
      diagnosticCenter: 'Manipal Reference Laboratory',
      status: TestStatus.completed,
      hasReport: true,
      reportSummary:
          'HbA1c: 6.8% (Good Glycemic Control, Target < 7.0%). Estimated Average Glucose (eAG): 148 mg/dL. Fasting Plasma Glucose: 118 mg/dL. Stable improvement from 7.4% recorded in April 2026.',
      reportFileName: 'HbA1c_RajeshSharma_Oct2026.pdf',
      keyFindings: {
        'HbA1c Level': '6.8% (Target for Patient: <7.0%)',
        'eAG (Avg Glucose)': '148 mg/dL',
        'Fasting Blood Sugar': '118 mg/dL (Target: 80 - 130)',
        'Interpretation': 'Satisfactory glycemic stability on current regimen.',
      },
    ),
    DiagnosticTest(
      id: 'test-102',
      prescriptionId: 'rx-101',
      testName: 'Spot Urine Albumin-to-Creatinine Ratio (uACR)',
      category: TestCategory.labTest,
      orderedDate: DateTime(2026, 10, 10),
      orderingDoctor: 'Dr. Meenakshi Sundaram, MD',
      diagnosticCenter: 'Manipal Reference Laboratory',
      status: TestStatus.sampleCollected,
      hasReport: false,
      reportSummary: null,
      reportFileName: null,
    ),
    DiagnosticTest(
      id: 'test-103',
      prescriptionId: 'rx-101',
      testName: 'Magnetic Resonance Imaging (MRI) - Lumbo-Sacral Spine',
      category: TestCategory.diagnosticScan,
      orderedDate: DateTime(2026, 10, 10),
      scheduledDate: DateTime(2026, 10, 22, 14, 30),
      orderingDoctor: 'Dr. Ramesh Joshi, MS Ortho',
      diagnosticCenter: 'Advanced Multi-Slice MRI Centre, Indiranagar',
      status: TestStatus.scheduled,
      hasReport: false,
      reportSummary: null,
      reportFileName: null,
    ),
  ];

  static final Appointment _p2ConfirmedAppt = Appointment(
    id: 'appt-101',
    patientId: 'p-002',
    doctorName: 'Dr. Meenakshi Sundaram',
    doctorSpecialty: 'Senior Consultant Endocrinologist, MD FRCP',
    department: 'Department of Endocrinology & Diabetes Care',
    dateTime: DateTime(2026, 11, 2, 11, 15),
    location: 'Manipal Specialty Clinic, Block B, Suite 402',
    status: AppointmentStatus.confirmed,
    clinicalReason:
        'Evaluation of uACR report and 8-week Glycemic Trend Assessment',
    isFollowUp: true,
  );

  static final List<Prescription> _p2Prescriptions = [
    Prescription(
      id: 'rx-101',
      referenceNumber: 'RX-2026-1180',
      patientId: 'p-002',
      date: DateTime(2026, 10, 10),
      doctorName: 'Dr. Meenakshi Sundaram',
      doctorSpecialty: 'Senior Consultant Endocrinologist, MD FRCP',
      hospitalOrClinic: 'Manipal Specialty Clinic, Bangalore',
      diagnosis: 'Type 2 Diabetes Mellitus & Lumbar Radiculopathy Evaluation',
      visitReason:
          'Quarterly Diabetes Review & Intermittent Low Back Pain Follow-up',
      doctorInstructions:
          'Fasting blood glucose 118 mg/dL. Continue regular moderate walking. Avoid heavy forward bending until MRI spine is reviewed. Strict foot inspection daily.',
      medications: _p2Rx1Meds,
      associatedTests: _p2Rx1Tests,
      followUpRecommendationText:
          'Doctor Recommended Review: 15 Dec 2026 with self-monitored blood glucose (SMBG) chart.',
      recommendedFollowUpDate: DateTime(2026, 12, 15, 11, 0),
      confirmedAppointment: _p2ConfirmedAppt,
      status: PrescriptionStatus.active,
    ),
    Prescription(
      id: 'rx-102',
      referenceNumber: 'RX-2026-0420',
      patientId: 'p-002',
      date: DateTime(2026, 4, 20),
      doctorName: 'Dr. Ramesh Joshi',
      doctorSpecialty: 'Consultant Orthopedic & Spine Surgeon, MS Ortho',
      hospitalOrClinic: 'Metro Orthopedic Institute',
      diagnosis: 'Acute Lumbar Muscular Strain & Mild L4-L5 Radicular Pain',
      visitReason: 'Severe lower back stiffness following gym workout',
      doctorInstructions:
          'Advised 5 days rest from heavy weights. Core stabilizing physiotherapy exercises prescribed. Cryotherapy 15 min thrice daily.',
      medications: [
        Medication(
          id: 'med-104',
          prescriptionId: 'rx-102',
          name: 'Aceclofenac + Paracetamol',
          strength: '100 mg / 325 mg',
          dosage: '1 Tablet',
          frequency: 'Twice Daily (SOS)',
          timing: 'Morning & Night (As Needed)',
          mealInstruction: MealInstruction.afterFood,
          duration: '5 Days (SOS)',
          prescribingDoctor: 'Dr. Ramesh Joshi, MS Ortho',
          prescribedDate: DateTime(2026, 4, 20),
          isActive: false, // Explicitly historical
          clinicalNotes:
              'Short course anti-inflammatory. Completed course in April 2026.',
        ),
        Medication(
          id: 'med-105',
          prescriptionId: 'rx-102',
          name: 'Thiocolchicoside (Muscle Relaxant)',
          strength: '4 mg',
          dosage: '1 Capsule',
          frequency: 'Twice Daily',
          timing: 'Morning 09:00 AM & Night 09:00 PM',
          mealInstruction: MealInstruction.afterFood,
          duration: '5 Days',
          prescribingDoctor: 'Dr. Ramesh Joshi, MS Ortho',
          prescribedDate: DateTime(2026, 4, 20),
          isActive: false, // Explicitly historical
          clinicalNotes: 'Completed 5-day course for muscle spasm relief.',
        ),
      ],
      associatedTests: [
        DiagnosticTest(
          id: 'test-104',
          prescriptionId: 'rx-102',
          testName: 'Digital X-Ray Lumbo-Sacral Spine (AP & Lateral)',
          category: TestCategory.diagnosticScan,
          orderedDate: DateTime(2026, 4, 20),
          completedDate: DateTime(2026, 4, 20),
          orderingDoctor: 'Dr. Ramesh Joshi, MS Ortho',
          diagnosticCenter: 'Metro Radiology Diagnostic Services',
          status: TestStatus.completed,
          hasReport: true,
          reportSummary:
              'No acute bony fracture or dislocation. Normal vertebral alignment preserved. Mild disc space narrowing noted at L4-L5 disc level. Sacroiliac joints unremarkable.',
          reportFileName: 'XRay_LS_Spine_RajeshSharma_Apr2026.pdf',
          keyFindings: {
            'Bony Structure': 'Intact, no fracture seen',
            'Alignment': 'Normal lordosis maintained',
            'Disc Spaces': 'Mild reduction at L4-L5',
            'Impression':
                'Mild degenerative disc changes, no spondylolisthesis.',
          },
        ),
      ],
      followUpRecommendationText:
          'Review if radicular numbness worsens down right calf.',
      recommendedFollowUpDate: DateTime(2026, 5, 5),
      confirmedAppointment: null,
      status: PrescriptionStatus.completed,
    ),
  ];

  // -------------------------------------------------------------
  // Data Query Helpers
  // -------------------------------------------------------------
  static List<Prescription> getPrescriptionsForPatient(String patientId) {
    if (patientId == 'p-002') return List.unmodifiable(_p2Prescriptions);
    return List.unmodifiable(_p1Prescriptions);
  }

  static Prescription? getLatestPrescription(String patientId) {
    final list = getPrescriptionsForPatient(patientId);
    if (list.isEmpty) return null;
    return list.first; // Already sorted newest first
  }

  static List<Medication> getAllMedicationsForPatient(String patientId) {
    final prescriptions = getPrescriptionsForPatient(patientId);
    final List<Medication> all = [];
    for (final rx in prescriptions) {
      all.addAll(rx.medications);
    }
    return List.unmodifiable(all);
  }

  static List<Medication> getActiveMedicationsForPatient(String patientId) {
    return getAllMedicationsForPatient(
      patientId,
    ).where((m) => m.isActive).toList(growable: false);
  }

  static List<Medication> getHistoricalMedicationsForPatient(String patientId) {
    return getAllMedicationsForPatient(
      patientId,
    ).where((m) => !m.isActive).toList(growable: false);
  }

  static List<DiagnosticTest> getAllTestsForPatient(String patientId) {
    final prescriptions = getPrescriptionsForPatient(patientId);
    final List<DiagnosticTest> all = [];
    for (final rx in prescriptions) {
      all.addAll(rx.associatedTests);
    }
    return List.unmodifiable(all);
  }

  static List<DiagnosticTest> getUpcomingTestsForPatient(String patientId) {
    return getAllTestsForPatient(
      patientId,
    ).where((t) => !t.isCompleted).toList(growable: false);
  }

  static List<DiagnosticTest> getCompletedTestsForPatient(String patientId) {
    return getAllTestsForPatient(
      patientId,
    ).where((t) => t.isCompleted).toList(growable: false);
  }

  static List<Appointment> getAppointmentsForPatient(String patientId) {
    final prescriptions = getPrescriptionsForPatient(patientId);
    final List<Appointment> list = [];
    for (final rx in prescriptions) {
      if (rx.confirmedAppointment != null) {
        list.add(rx.confirmedAppointment!);
      }
    }
    return List.unmodifiable(list);
  }
}
