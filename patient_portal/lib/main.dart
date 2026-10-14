import 'package:flutter/material.dart';
import 'app/app_state.dart';
import 'app/curalink_app.dart';
import 'repositories/supabase_patient_repository.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final repository = SupabasePatientRepository();
  final appState = AppState(repository: repository, initialAuthenticated: false);
  runApp(CuraLinkApp(appState: appState));
}
