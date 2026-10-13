import 'package:flutter/material.dart';
import 'app/app_state.dart';
import 'app/curalink_app.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final appState = AppState(initialAuthenticated: false);
  runApp(CuraLinkApp(appState: appState));
}
