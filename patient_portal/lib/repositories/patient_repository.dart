import '../models/patient.dart';
import '../models/prescription.dart';
import '../models/medication.dart';
import '../models/diagnostic_test.dart';
import '../models/appointment.dart';

/// Abstract contract for patient data access in CuraLink.
/// Allows seamless transition between [MockPatientRepository] (current)
/// and [SupabasePatientRepository] (future cloud backend).
abstract class PatientRepository {
  /// Fetches all available patient profiles (e.g. for dependent switching).
  Future<List<Patient>> getPatients();

  /// Fetches a specific patient profile by [patientId].
  Future<Patient?> getPatientById(String patientId);

  /// Fetches the most recent, latest prescription for the patient.
  Future<Prescription?> getLatestPrescription(String patientId);

  /// Fetches all prescriptions for the patient, sorted newest first.
  Future<List<Prescription>> getPrescriptionHistory(String patientId);

  /// Fetches a specific prescription by [prescriptionId].
  Future<Prescription?> getPrescriptionById(String prescriptionId);

  /// Fetches all medications for the patient (both active and historical).
  Future<List<Medication>> getAllMedications(String patientId);

  /// Fetches all diagnostic tests and scans (both completed and upcoming).
  Future<List<DiagnosticTest>> getAllDiagnosticTests(String patientId);

  /// Fetches confirmed appointments and follow-up schedules.
  Future<List<Appointment>> getAppointments(String patientId);
}
