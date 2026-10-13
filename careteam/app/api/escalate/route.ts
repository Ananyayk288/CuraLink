import { NextResponse } from 'next/server';
import {
  saveEscalationToSupabase,
  getSupabaseEscalations,
  updateEscalationStatusInSupabase,
} from '@/lib/supabase';
import { EscalationData } from '@/lib/types';

// GET /api/escalate — Retrieve all escalations directly from Supabase
export async function GET() {
  try {
    const escalations = await getSupabaseEscalations();
    if (!escalations) {
      return NextResponse.json({
        success: false,
        message: 'Could not fetch escalations from Supabase (check credentials).',
        escalations: [],
      });
    }

    return NextResponse.json({
      success: true,
      escalations,
      count: escalations.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error retrieving escalations' },
      { status: 500 }
    );
  }
}

// POST /api/escalate — Insert a new escalation ticket into Supabase
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      patientId,
      patientName,
      patientPhone,
      category,
      priority,
      target,
      notes,
      escalatedBy,
    } = body;

    if (!patientName || !category || !priority || !target || !notes) {
      return NextResponse.json(
        { success: false, message: 'Missing required escalation parameters.' },
        { status: 400 }
      );
    }

    const escalationData: EscalationData = {
      patientId: patientId || 'unassigned',
      patientName,
      patientPhone: patientPhone || '',
      category,
      priority,
      target,
      notes,
      status: 'PENDING',
      escalatedBy: escalatedBy || 'Care Team Fieldworker',
      createdAt: new Date().toISOString(),
    };

    const supabaseResult = await saveEscalationToSupabase(escalationData);

    return NextResponse.json({
      success: true,
      escalation: escalationData,
      supabaseSynced: supabaseResult.success,
      supabaseError: supabaseResult.error,
      message: supabaseResult.success
        ? 'Escalation issue successfully synchronized with Supabase!'
        : 'Escalation recorded in portal store (Supabase pending).',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/escalate — Update an escalation ticket status in Supabase (e.g. ACKNOWLEDGED, RESOLVED)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: 'Missing escalation id or status.' },
        { status: 400 }
      );
    }

    if (!['PENDING', 'ACKNOWLEDGED', 'RESOLVED'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status. Must be PENDING, ACKNOWLEDGED, or RESOLVED.' },
        { status: 400 }
      );
    }

    const result = await updateEscalationStatusInSupabase(id, status);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error || 'Failed to update escalation in Supabase.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Escalation ${id} status successfully updated to ${status} in Supabase!`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error updating escalation' },
      { status: 500 }
    );
  }
}
