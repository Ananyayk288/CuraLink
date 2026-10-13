import 'medication.dart';
import 'diagnostic_test.dart';
import 'appointment.dart';

enum PrescriptionStatus { active, completed, revised }

class Prescription {
  final String id;
  final String referenceNumber; // e.g. RX-2026-1049
  final String patientId;
  final DateTime date;
  final String doctorName;
  final String doctorSpecialty;
  final String hospitalOrClinic;
  final String diagnosis;
  final String visitReason;
  final String doctorInstructions;
  final List<Medication> medications;
  final List<DiagnosticTest> associatedTests;
  final String? followUpRecommendationText;
  final DateTime? recommendedFollowUpDate;
  final Appointment? confirmedAppointment;
  final PrescriptionStatus status;

  const Prescription({
    required this.id,
    required this.referenceNumber,
    required this.patientId,
    required this.date,
    required this.doctorName,
    required this.doctorSpecialty,
    required this.hospitalOrClinic,
    required this.diagnosis,
    required this.visitReason,
    required this.doctorInstructions,
    required this.medications,
    required this.associatedTests,
    this.followUpRecommendationText,
    this.recommendedFollowUpDate,
    this.confirmedAppointment,
    required this.status,
  });

  bool get isActive => status == PrescriptionStatus.active;
}
