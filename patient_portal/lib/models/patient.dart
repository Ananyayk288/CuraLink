class Patient {
  final String id;
  final String uniquePatientId; // e.g. PNT followed by 5 digits (PNT10492)
  final String fullName;
  final int age;
  final String gender;
  final String phoneNumber;
  final String emergencyContact;
  final String preferredLanguage;
  final String bloodGroup;
  final List<String> allergies;
  final String primaryDiagnosis;
  final String abhaNumber; // Ayushman Bharat Health Account / Health ID for India

  const Patient({
    required this.id,
    this.uniquePatientId = 'PNT10492',
    required this.fullName,
    required this.age,
    required this.gender,
    required this.phoneNumber,
    required this.emergencyContact,
    required this.preferredLanguage,
    required this.bloodGroup,
    required this.allergies,
    required this.primaryDiagnosis,
    required this.abhaNumber,
  });

  Patient copyWith({
    String? id,
    String? uniquePatientId,
    String? fullName,
    int? age,
    String? gender,
    String? phoneNumber,
    String? emergencyContact,
    String? preferredLanguage,
    String? bloodGroup,
    List<String>? allergies,
    String? primaryDiagnosis,
    String? abhaNumber,
  }) {
    return Patient(
      id: id ?? this.id,
      uniquePatientId: uniquePatientId ?? this.uniquePatientId,
      fullName: fullName ?? this.fullName,
      age: age ?? this.age,
      gender: gender ?? this.gender,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      emergencyContact: emergencyContact ?? this.emergencyContact,
      preferredLanguage: preferredLanguage ?? this.preferredLanguage,
      bloodGroup: bloodGroup ?? this.bloodGroup,
      allergies: allergies ?? this.allergies,
      primaryDiagnosis: primaryDiagnosis ?? this.primaryDiagnosis,
      abhaNumber: abhaNumber ?? this.abhaNumber,
    );
  }
}
