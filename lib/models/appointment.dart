enum AppointmentStatus { confirmed, recommendedFollowUp, completed, cancelled }

class Appointment {
  final String id;
  final String patientId;
  final String doctorName;
  final String doctorSpecialty;
  final String department;
  final DateTime dateTime;
  final String location;
  final AppointmentStatus status;
  final String? clinicalReason;
  final bool isFollowUp;

  const Appointment({
    required this.id,
    required this.patientId,
    required this.doctorName,
    required this.doctorSpecialty,
    required this.department,
    required this.dateTime,
    required this.location,
    required this.status,
    this.clinicalReason,
    required this.isFollowUp,
  });

  bool get isConfirmed => status == AppointmentStatus.confirmed;
  bool get isRecommendedOnly => status == AppointmentStatus.recommendedFollowUp;

  String get statusDisplay {
    switch (status) {
      case AppointmentStatus.confirmed:
        return 'Confirmed OPD Appointment';
      case AppointmentStatus.recommendedFollowUp:
        return 'Doctor Recommended Review';
      case AppointmentStatus.completed:
        return 'Completed Visit';
      case AppointmentStatus.cancelled:
        return 'Cancelled';
    }
  }
}
