import '../models/patient.dart';
import '../models/prescription.dart';
import '../models/medication.dart';
import '../models/diagnostic_test.dart';
import '../models/appointment.dart';
import '../data/mock/mock_data.dart';
import 'patient_repository.dart';

/// In-memory mock implementation of [PatientRepository].
/// Provides realistic clinical records for offline demonstration.
class MockPatientRepository implements PatientRepository {
  final bool simulateDelay;

  MockPatientRepository({this.simulateDelay = false});

  Future<void> _maybeDelay([int milliseconds = 50]) async {
    if (simulateDelay) {
      await Future.delayed(Duration(milliseconds: milliseconds));
    }
  }

  @override
  Future<List<Patient>> getPatients() async {
    await _maybeDelay(60);
    return List.of(MockData.patients);
  }

  @override
  Future<Patient?> getPatientById(String patientId) async {
    await _maybeDelay(30);
    final matches = MockData.patients.where((p) => p.id == patientId);
    return matches.isNotEmpty ? matches.first : null;
  }

  @override
  Future<Prescription?> getLatestPrescription(String patientId) async {
    await _maybeDelay(50);
    return MockData.getLatestPrescription(patientId);
  }

  @override
  Future<List<Prescription>> getPrescriptionHistory(String patientId) async {
    await _maybeDelay(60);
    return MockData.getPrescriptionsForPatient(patientId);
  }

  @override
  Future<Prescription?> getPrescriptionById(String prescriptionId) async {
    await _maybeDelay(40);
    for (final p in MockData.patients) {
      final list = MockData.getPrescriptionsForPatient(p.id);
      for (final rx in list) {
        if (rx.id == prescriptionId) return rx;
      }
    }
    return null;
  }

  @override
  Future<List<Medication>> getAllMedications(String patientId) async {
    await _maybeDelay(50);
    return MockData.getAllMedicationsForPatient(patientId);
  }

  @override
  Future<List<DiagnosticTest>> getAllDiagnosticTests(String patientId) async {
    await _maybeDelay(50);
    return MockData.getAllTestsForPatient(patientId);
  }

  @override
  Future<List<Appointment>> getAppointments(String patientId) async {
    await _maybeDelay(40);
    return MockData.getAppointmentsForPatient(patientId);
  }
}
