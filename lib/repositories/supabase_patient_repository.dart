import '../models/patient.dart';
import '../models/prescription.dart';
import '../models/medication.dart';
import '../models/diagnostic_test.dart';
import '../models/appointment.dart';
import 'patient_repository.dart';

/// Scaffolding for future Supabase cloud integration.
///
/// ============================================================================
/// SUPABASE INTEGRATION READINESS SPECIFICATION:
/// ============================================================================
/// 1. Package requirement:
///    Add `supabase_flutter: ^2.8.0` to pubspec.yaml once approval is granted.
///
/// 2. Initialization requirement:
///    ```dart
///    await Supabase.initialize(
///      url: const String.fromEnvironment('SUPABASE_URL'),
///      anonKey: const String.fromEnvironment('SUPABASE_ANON_KEY'),
///    );
///    ```
///
/// 3. Security Guidelines:
///    - NEVER place a service-role key in this mobile application.
///    - The anon/publishable key only permits Row Level Security (RLS) operations.
///    - Medical records must be protected via authenticated patient RLS policies.
///    - Anon key + Project URL alone are not sufficient to access private PHI.
/// ============================================================================
class SupabasePatientRepository implements PatientRepository {
  final String? supabaseUrl;
  final String? anonKey;

  SupabasePatientRepository({this.supabaseUrl, this.anonKey});

  bool get isConfigured =>
      supabaseUrl != null &&
      supabaseUrl!.isNotEmpty &&
      anonKey != null &&
      anonKey!.isNotEmpty;

  @override
  Future<List<Patient>> getPatients() async {
    _assertConfigured();
    // Planned query: supabase.from('patients').select().eq('auth_user_id', currentUid);
    throw UnimplementedError('Supabase phase pending explicit user approval.');
  }

  @override
  Future<Patient?> getPatientById(String patientId) async {
    _assertConfigured();
    // Planned query: supabase.from('patients').select().eq('id', patientId).single();
    throw UnimplementedError('Supabase phase pending explicit user approval.');
  }

  @override
  Future<Prescription?> getLatestPrescription(String patientId) async {
    _assertConfigured();
    // Planned query: supabase.from('prescriptions').select('*, medications(*), diagnostic_tests(*)').eq('patient_id', patientId).order('date', ascending: false).limit(1);
    throw UnimplementedError('Supabase phase pending explicit user approval.');
  }

  @override
  Future<List<Prescription>> getPrescriptionHistory(String patientId) async {
    _assertConfigured();
    // Planned query: supabase.from('prescriptions').select('*, medications(*), diagnostic_tests(*)').eq('patient_id', patientId).order('date', ascending: false);
    throw UnimplementedError('Supabase phase pending explicit user approval.');
  }

  @override
  Future<Prescription?> getPrescriptionById(String prescriptionId) async {
    _assertConfigured();
    throw UnimplementedError('Supabase phase pending explicit user approval.');
  }

  @override
  Future<List<Medication>> getAllMedications(String patientId) async {
    _assertConfigured();
    // Planned query: supabase.from('medications').select().eq('patient_id', patientId);
    throw UnimplementedError('Supabase phase pending explicit user approval.');
  }

  @override
  Future<List<DiagnosticTest>> getAllDiagnosticTests(String patientId) async {
    _assertConfigured();
    // Planned query: supabase.from('diagnostic_tests').select().eq('patient_id', patientId);
    throw UnimplementedError('Supabase phase pending explicit user approval.');
  }

  @override
  Future<List<Appointment>> getAppointments(String patientId) async {
    _assertConfigured();
    // Planned query: supabase.from('appointments').select().eq('patient_id', patientId);
    throw UnimplementedError('Supabase phase pending explicit user approval.');
  }

  void _assertConfigured() {
    if (!isConfigured) {
      throw StateError(
        'Supabase is not yet connected. CuraLink is operating in Mock Data mode.',
      );
    }
  }
}
