import 'package:flutter/material.dart';
import '../medical_records/medical_records_screen.dart';

/// Legacy alias consolidating test history to the authoritative primary destination:
/// Medical Records -> Scans & Lab Tests.
class ScanTestHistoryScreen extends StatelessWidget {
  const ScanTestHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const MedicalRecordsScreen(initialTab: 1);
  }
}
