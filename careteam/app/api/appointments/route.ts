import { NextResponse } from 'next/server';
import {
  saveAppointmentToSupabase,
  getSupabaseAppointments,
} from '@/lib/supabase';
import { careTeamStore } from '@/lib/store';
import { AppointmentData } from '@/lib/types';

// GET /api/appointments — Retrieve all appointments from Supabase / Store
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    let appointments = await getSupabaseAppointments();
    if (!appointments || appointments.length === 0) {
      appointments = careTeamStore.getAppointments();
    }

    if (statusFilter) {
      appointments = appointments.filter(
        (a) => a.status?.toUpperCase() === statusFilter.toUpperCase()
      );
    }

    return NextResponse.json({
      success: true,
      appointments,
      count: appointments.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error retrieving appointments' },
      { status: 500 }
    );
  }
}

// POST /api/appointments — Book a new appointment from Care Team
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      patientId,
      patientName,
      patientPhone,
      uhid,
      doctorId,
      doctorName,
      reasonForVisit,
      appointmentTime,
      bookingChannel,
      priority,
      vitalsNotes,
      bookedBy,
    } = body;

    if (!patientId || !patientName || !reasonForVisit || !appointmentTime) {
      return NextResponse.json(
        { success: false, message: 'Missing required appointment parameters (patient, reason, or time).' },
        { status: 400 }
      );
    }

    const currentAppointments = careTeamStore.getAppointments();
    const tokenSuffix = String(currentAppointments.length + 1).padStart(2, '0');
    const tokenNumber = body.tokenNumber || `TOKEN-${tokenSuffix}`;
    const aptId = `apt-${Date.now()}`;

    const appointmentData: AppointmentData = {
      id: aptId,
      patientId,
      patientName,
      patientPhone: patientPhone || '',
      uhid: uhid || '',
      doctorId: doctorId || 'DOC84920',
      doctorName: doctorName || 'Dr. Suresh Sharma, MD',
      tokenNumber,
      reasonForVisit,
      appointmentTime,
      bookingChannel: bookingChannel || 'CARE_TEAM_FIELD',
      status: 'PENDING',
      priority: priority || 'ROUTINE',
      vitalsNotes: vitalsNotes || '',
      bookedBy: bookedBy || 'Care Team Fieldworker',
      createdAt: new Date().toISOString(),
    };

    const result = await careTeamStore.bookAppointment(appointmentData);

    return NextResponse.json({
      success: true,
      appointment: result.appointment,
      supabaseSynced: result.supabaseSynced,
      supabaseError: result.error,
      message: result.supabaseSynced
        ? `Appointment successfully booked with Token ${tokenNumber} and synchronized to Doctor Desk!`
        : `Appointment booked in portal with Token ${tokenNumber} (Supabase sync pending).`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error booking appointment' },
      { status: 500 }
    );
  }
}
