import 'package:flutter/material.dart';
import '../medical_records/medical_records_screen.dart';

/// Legacy alias consolidating medical history to the authoritative primary destination:
/// Medical Records -> Medical & Medication History.
class MedicalHistoryScreen extends StatelessWidget {
  const MedicalHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const MedicalRecordsScreen(initialTab: 0);
  }
}
