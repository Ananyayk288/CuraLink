import { NextResponse } from 'next/server';
import { db, Prescription, PrescriptionMedicine, PrescriptionDiagnostic } from '@/lib/db';
import { DOCTOR_PROFILE } from '@/lib/constants';
import {
  syncPrescriptionToSupabase,
  updateAppointmentStatusInSupabase,
  getPatientByIdFromSupabase,
} from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      patient_id,
      appointment_id,
      prescription_type = 'NORMAL',
      doctor_id,
      doctor_name,
      symptoms_notes = '',
      follow_up_date = '',
      follow_up_notes = '',
      telephony_trigger_enabled = true,
      medicines = [],
      diagnostics = [],
    } = body;

    if (!patient_id) {
      return NextResponse.json({ success: false, error: 'Patient ID is required' }, { status: 400 });
    }

    let patient: any = db.patients.find(p => p.id === patient_id || p.uhid === patient_id);
    if (!patient) {
      patient = await getPatientByIdFromSupabase(patient_id);
    }
    if (!patient) {
      patient = {
        id: patient_id,
        uhid: patient_id,
        name: body.patient_name || `Patient (${patient_id})`,
        phone: body.patient_phone || '',
        language: 'Kannada',
      };
    }

    const rxId = `rx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nowIso = new Date().toISOString();

    // Map medicines
    const newMedicines: PrescriptionMedicine[] = medicines.map((m: any, idx: number) => ({
      id: `med-${rxId}-${idx + 1}`,
      prescriptionId: rxId,
      medicineName: m.medicine_name || m.medicineName || 'Unnamed Medicine',
      dosage: m.dosage || '',
      frequency: m.frequency || '1-0-0',
      noOfDays: Number(m.no_of_days || m.noOfDays || 1),
      mealRelation: m.meal_relation || m.mealRelation || 'After Food',
      instructions: m.instructions || '',
      dispenseStatus: 'PRESCRIBED',
    }));

    // Map diagnostics
    const newDiagnostics: PrescriptionDiagnostic[] = diagnostics.map((d: any, idx: number) => ({
      id: `diag-${rxId}-${idx + 1}`,
      prescriptionId: rxId,
      testType: d.test_type || d.testType || 'LAB_TEST',
      testName: d.test_name || d.testName || 'Diagnostic Test',
      instructions: d.instructions || '',
      urgency: (d.urgency || 'ROUTINE').toUpperCase(),
      status: 'PENDING',
    }));

    const newPrescription: Prescription = {
      id: rxId,
      patientId: patient_id,
      doctorId: doctor_id || DOCTOR_PROFILE.id,
      doctorName: doctor_name || DOCTOR_PROFILE.name,
      status: 'COMMITTED',
      prescriptionType: prescription_type === 'SCAN_TEST' ? 'SCAN_TEST' : 'NORMAL',
      symptomsNotes: prescription_type === 'SCAN_TEST' ? '' : symptoms_notes.slice(0, 500),
      followUpDate: follow_up_date || undefined,
      followUpNotes: follow_up_notes || undefined,
      telephonyTriggerEnabled: Boolean(telephony_trigger_enabled),
      telephonyTriggeredAt: telephony_trigger_enabled ? nowIso : undefined,
      createdAt: nowIso,
      medicines: newMedicines,
      diagnostics: newDiagnostics,
    };

    // Save to local in-memory DB
    db.prescriptions.unshift(newPrescription);

    // If an appointment was linked, mark it completed
    if (appointment_id) {
      const apt = db.appointments.find(a => a.id === appointment_id);
      if (apt) apt.status = 'COMPLETED';
      updateAppointmentStatusInSupabase(appointment_id, 'COMPLETED').catch(console.error);
    } else {
      // Find any pending appointment for this patient and complete it
      const apt = db.appointments.find(a => a.patientId === patient_id && a.status === 'PENDING');
      if (apt) {
        apt.status = 'COMPLETED';
        updateAppointmentStatusInSupabase(apt.id, 'COMPLETED').catch(console.error);
      }
    }

    // Telephony trigger record
    let triggerRecord: any = null;
    if (telephony_trigger_enabled) {
      triggerRecord = {
        id: `trig-${rxId}`,
        prescription_id: rxId,
        patient_id: patient_id,
        patient_phone: patient.phone,
        preferred_language: patient.language,
        trigger_type: prescription_type === 'SCAN_TEST' ? 'DIAGNOSTIC_ALERT' : 'MEDICATION_ADHERENCE',
        voice_call_status: 'QUEUED',
        sms_status: 'QUEUED',
        payload: {
          doctor_name: newPrescription.doctorName,
          medicines: newMedicines.map(m => ({
            name: m.medicineName,
            dosage: m.dosage,
            days: m.noOfDays,
            frequency: m.frequency,
            meal: m.mealRelation,
          })),
          diagnostics: newDiagnostics.map(d => ({
            name: d.testName,
            type: d.testType,
            urgency: d.urgency,
          })),
          follow_up_date: follow_up_date,
        },
        created_at: nowIso,
      };
      db.telephonyTriggers.unshift(triggerRecord);
    }

    // Direct PostgreSQL sync with Supabase
    const supabasePayload = {
      prescription: {
        id: newPrescription.id,
        patient_id: newPrescription.patientId,
        doctor_id: newPrescription.doctorId,
        doctor_name: newPrescription.doctorName,
        hospital_id: 'HOSP-001',
        prescription_type: newPrescription.prescriptionType,
        symptoms_notes: newPrescription.symptomsNotes,
        follow_up_date: newPrescription.followUpDate || null,
        follow_up_notes: newPrescription.followUpNotes || null,
        telephony_trigger_enabled: newPrescription.telephonyTriggerEnabled,
        status: newPrescription.status,
        revision: 1,
        committed_at: newPrescription.createdAt,
        created_at: newPrescription.createdAt,
      },
      medicines: newMedicines.map(m => {
        const freq = (m.frequency || '').toUpperCase();
        const slots: string[] = [];
        if (freq === '1-0-1') slots.push('MORNING', 'NIGHT');
        else if (freq === '1-1-1') slots.push('MORNING', 'AFTERNOON', 'NIGHT');
        else if (freq === '1-0-0') slots.push('MORNING');
        else if (freq === '0-1-0') slots.push('AFTERNOON');
        else if (freq === '0-0-1') slots.push('NIGHT');
        else if (freq === '0-1-1') slots.push('AFTERNOON', 'NIGHT');
        else slots.push('MORNING');

        const isBeforeFood = (m.mealRelation || '').toLowerCase().includes('before');
        const days = Number(m.noOfDays) || 15;
        const qty = days * Math.max(1, slots.length);

        return {
          id: m.id,
          prescription_id: m.prescriptionId,
          medicine_name: m.medicineName,
          dosage: m.dosage || '',
          frequency: m.frequency,
          no_of_days: days,
          duration: `${days} days`,
          meal_relation: m.mealRelation,
          instructions: m.instructions,
          dispense_status: m.dispenseStatus,
          dose_slots: slots,
          before_food: isBeforeFood,
          quantity_prescribed: qty,
        };
      }),
      diagnostics: newDiagnostics.map(d => ({
        id: d.id,
        prescription_id: d.prescriptionId,
        test_type: d.testType,
        test_name: d.testName,
        instructions: d.instructions,
        urgency: d.urgency || 'ROUTINE',
        status: d.status,
      })),
      telephonyTrigger: triggerRecord,
    };

    const syncResult = await syncPrescriptionToSupabase(supabasePayload);

    return NextResponse.json({
      success: true,
      message: 'Prescription submitted successfully with doctor sign-off!',
      data: {
        prescription: newPrescription,
        telephony_trigger: triggerRecord,
        supabase_synced: syncResult.synced,
        supabase_sync_errors: syncResult.errors,
      },
    });
  } catch (err: any) {
    console.error('Error in prescriptions POST:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
