import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../screens/main_navigation_screen.dart';
import '../screens/auth/login_screen.dart';
import 'app_state.dart';

class CuraLinkApp extends StatelessWidget {
  final AppState appState;
  final Widget? home;

  const CuraLinkApp({super.key, required this.appState, this.home});

  @override
  Widget build(BuildContext context) {
    return AppStateScope(
      appState: appState,
      child: ListenableBuilder(
        listenable: appState,
        builder: (context, _) {
          return MaterialApp(
            title: 'CuraLink Healthcare',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            home:
                home ??
                (appState.isAuthenticated
                    ? const MainNavigationScreen()
                    : const LoginScreen()),
          );
        },
      ),
    );
  }
}
