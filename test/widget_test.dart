import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:curalink/app/app_state.dart';
import 'package:curalink/app/curalink_app.dart';

void main() {
  testWidgets(
    'CuraLink Flutter app launches and renders latest prescription on dashboard',
    (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final appState = AppState(initialAuthenticated: true);

      // Pump CuraLink application
      await tester.pumpWidget(CuraLinkApp(appState: appState));
      await tester.pumpAndSettle();

      // Verify CuraLink branding
      expect(find.text('CuraLink Healthcare'), findsAtLeastNWidgets(1));

      // Verify initial patient (Lakshmi Devi) and her latest prescription
      expect(find.text('Lakshmi Devi'), findsOneWidget);
      expect(find.text('RX-2026-1049'), findsAtLeastNWidgets(1));
      expect(find.text('Amlodipine Besylate (5 mg)'), findsOneWidget);

      // Verify bottom navigation bar has all four main destinations
      expect(find.text('Home'), findsOneWidget);
      expect(find.text('Prescriptions'), findsOneWidget);
      expect(find.text('Medical Records'), findsOneWidget);
      expect(find.text('Profile'), findsOneWidget);

      // Tap on Prescriptions tab
      await tester.tap(find.text('Prescriptions'));
      await tester.pumpAndSettle();
      expect(find.text('Prescription History'), findsOneWidget);

      // Tap on Medical Records tab
      await tester.tap(find.text('Medical Records'));
      await tester.pumpAndSettle();
      expect(find.text('Medical Records'), findsAtLeastNWidgets(1));

      // Tap on Profile tab
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();
      expect(find.text('Patient Profile'), findsOneWidget);
    },
  );

  testWidgets('Switching demo patient updates records across screens', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(800, 1800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final appState = AppState(initialAuthenticated: true);

    await tester.pumpWidget(CuraLinkApp(appState: appState));
    await tester.pumpAndSettle();

    // Initially Lakshmi Devi
    expect(find.text('Lakshmi Devi'), findsOneWidget);

    // Switch to Rajesh Sharma
    final rajesh = appState.patients.firstWhere((p) => p.id == 'p-002');
    await appState.switchPatient(rajesh);
    await tester.pumpAndSettle();

    // Verify dashboard now features Rajesh Sharma and his Rx
    expect(find.text('Rajesh Sharma'), findsOneWidget);
    expect(find.text('RX-2026-1180'), findsAtLeastNWidgets(1));
    expect(find.text('Glimepiride (2 mg)'), findsOneWidget);
  });

  testWidgets(
    'Tapping medication opens MedicationDetailSheet with schedule and sticker',
    (WidgetTester tester) async {
      final appState = AppState(initialAuthenticated: true);
      await tester.pumpWidget(CuraLinkApp(appState: appState));
      await tester.pumpAndSettle();

      // Tap on Medical Records tab
      await tester.tap(find.text('Medical Records'));
      await tester.pumpAndSettle();

      // Verify Amlodipine Besylate is visible with Blue Sticker Packaging badge
      expect(find.text('Amlodipine Besylate'), findsOneWidget);
      expect(find.text('Blue Sticker Packaging'), findsOneWidget);

      // Tap on Amlodipine to open detail sheet
      await tester.tap(find.text('Amlodipine Besylate'));
      await tester.pumpAndSettle();

      // Verify detail sheet opened with clinical instructions
      expect(
        find.text('CLINICAL DOSAGE & TIMING INSTRUCTIONS'),
        findsOneWidget,
      );
      expect(find.text('Close Details'), findsOneWidget);

      // Close detail sheet
      await tester.ensureVisible(find.text('Close Details'));
      await tester.tap(find.text('Close Details'));
      await tester.pumpAndSettle();
    },
  );

  testWidgets(
    'Prescription history filtering and tapping opens correct detail screen',
    (WidgetTester tester) async {
      final appState = AppState(initialAuthenticated: true);
      await tester.pumpWidget(CuraLinkApp(appState: appState));
      await tester.pumpAndSettle();

      // Navigate to Prescriptions tab
      await tester.tap(find.text('Prescriptions'));
      await tester.pumpAndSettle();

      // Verify filter chips exist
      expect(find.text('All (2)'), findsOneWidget);
      expect(find.text('Active (1)'), findsOneWidget);
      expect(find.text('Past Orders (1)'), findsOneWidget);

      // Tap on Active filter
      await tester.tap(find.text('Active (1)'));
      await tester.pumpAndSettle();

      // Tap on the latest prescription card to open its detail screen
      await tester.tap(find.text('View Full Rx').first);
      await tester.pumpAndSettle();

      // Verify PrescriptionDetailScreen opened with reference number and doctor
      expect(find.text('Dr. Arvind Kumar'), findsAtLeastNWidgets(1));
      expect(
        find.textContaining('Essential Hypertension'),
        findsAtLeastNWidgets(1),
      );
    },
  );

  testWidgets(
    'Login screen renders branding, email, password, and demo notices',
    (WidgetTester tester) async {
      final appState = AppState(initialAuthenticated: false);
      await tester.pumpWidget(CuraLinkApp(appState: appState));
      await tester.pumpAndSettle();

      // Verify Login UI elements
      expect(find.text('Welcome back'), findsOneWidget);
      expect(
        find.text('Sign in to continue to your healthcare dashboard.'),
        findsOneWidget,
      );
      expect(find.text('Unique Patient ID'), findsOneWidget);
      expect(find.text('Password'), findsOneWidget);
      expect(find.text('Sign In'), findsOneWidget);
      expect(find.text('Official Patient Healthcare Portal'), findsOneWidget);
      expect(find.text('Forgot password?'), findsOneWidget);
    },
  );

  testWidgets('Login form rejects empty patient ID and empty password with errors', (
    WidgetTester tester,
  ) async {
    final appState = AppState(initialAuthenticated: false);
    await tester.pumpWidget(CuraLinkApp(appState: appState));
    await tester.pumpAndSettle();

    // Clear initial value
    final idField = find.widgetWithText(
      TextFormField,
      'PNT10492',
    );
    await tester.enterText(idField, '');

    final passwordField = find.byType(TextFormField).at(1);
    await tester.enterText(passwordField, '');

    // Tap Sign In
    await tester.ensureVisible(find.text('Sign In'));
    await tester.tap(find.text('Sign In'));
    await tester.pumpAndSettle();

    // Form errors should be visible
    expect(find.text('Please enter your Unique Patient ID.'), findsOneWidget);
    expect(find.text('Please enter your password.'), findsOneWidget);
  });

  testWidgets('Login form rejects invalid patient ID format', (
    WidgetTester tester,
  ) async {
    final appState = AppState(initialAuthenticated: false);
    await tester.pumpWidget(CuraLinkApp(appState: appState));
    await tester.pumpAndSettle();

    final idField = find.widgetWithText(
      TextFormField,
      'PNT10492',
    );
    await tester.enterText(idField, 'INVALID123');

    await tester.ensureVisible(find.text('Sign In'));
    await tester.tap(find.text('Sign In'));
    await tester.pumpAndSettle();

    expect(
      find.text('Please enter a valid Patient ID (e.g. PNT10492).'),
      findsOneWidget,
    );
  });

  testWidgets('Forgot password opens honest demo recovery dialog', (
    WidgetTester tester,
  ) async {
    final appState = AppState(initialAuthenticated: false);
    await tester.pumpWidget(CuraLinkApp(appState: appState));
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('Forgot password?'));
    await tester.tap(find.text('Forgot password?'));
    await tester.pumpAndSettle();

    expect(find.text('Password Recovery'), findsOneWidget);
    expect(find.text('Understood'), findsOneWidget);

    await tester.tap(find.text('Understood'));
    await tester.pumpAndSettle();
    expect(find.text('Password Recovery'), findsNothing);
  });

  testWidgets(
    'Sign In transitions to dashboard and signing out returns to login screen',
    (WidgetTester tester) async {
      final appState = AppState(initialAuthenticated: false);
      await tester.pumpWidget(CuraLinkApp(appState: appState));
      await tester.pumpAndSettle();

      // On login screen
      expect(find.text('Welcome back'), findsOneWidget);

      // Tap Sign In with authorized credentials
      await tester.ensureVisible(find.text('Sign In'));
      await tester.tap(find.text('Sign In'));
      await tester.pump(const Duration(milliseconds: 300));
      await tester.pumpAndSettle();

      // Successfully in app
      expect(find.text('CuraLink Healthcare'), findsAtLeastNWidgets(1));
      expect(find.text('Home'), findsOneWidget);

      // Sign out
      appState.signOut();
      await tester.pumpAndSettle();

      // Verify back on login screen
      expect(find.text('Welcome back'), findsOneWidget);
    },
  );

  testWidgets(
    'Dashboard renders Today Medication Schedule and navigates to DailyMedicationScheduleScreen',
    (WidgetTester tester) async {
      final appState = AppState(initialAuthenticated: true);
      await tester.pumpWidget(CuraLinkApp(appState: appState));
      await tester.pumpAndSettle();

      // Verify Today's Medication Schedule section exists
      expect(find.text('Today’s Medication Schedule'), findsOneWidget);
      expect(find.text('View Full Schedule'), findsOneWidget);

      // Tap View Full Schedule
      await tester.ensureVisible(find.text('View Full Schedule'));
      await tester.tap(find.text('View Full Schedule'));
      await tester.pumpAndSettle();

      // Verify DailyMedicationScheduleScreen is shown
      expect(find.text('Daily Medication Schedule'), findsOneWidget);
      expect(find.text('Morning Regimen'), findsAtLeastNWidgets(1));
      expect(find.text('Amlodipine Besylate'), findsOneWidget);
      expect(find.text('Blue Sticker Packaging'), findsOneWidget);

      // Ensure Night filter chip is scrolled into view and tapped
      await tester.ensureVisible(find.text('Night (2)'));
      await tester.tap(find.text('Night (2)'));
      await tester.pumpAndSettle();
      expect(find.text('Night Regimen'), findsAtLeastNWidgets(1));
      expect(find.text('Atorvastatin Calcium'), findsOneWidget);
      expect(find.text('Red Sticker Packaging'), findsOneWidget);

      // Back navigation
      await tester.pageBack();
      await tester.pumpAndSettle();
      expect(find.text('Today’s Medication Schedule'), findsOneWidget);
    },
  );

  testWidgets(
    'Unified medicine card displays medicine name, sticker color, strength, and dosage without literacy modes',
    (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final appState = AppState(initialAuthenticated: true);
      await tester.pumpWidget(CuraLinkApp(appState: appState));
      await tester.pumpAndSettle();

      // Dashboard hero displays medicine preview tag
      expect(find.text('Amlodipine Besylate (5 mg)'), findsOneWidget);

      // Navigate to Medical Records tab
      await tester.tap(find.text('Medical Records'));
      await tester.pumpAndSettle();

      // Same unified display
      expect(find.text('Amlodipine Besylate'), findsOneWidget);
      expect(find.text('Blue Sticker Packaging'), findsOneWidget);
      expect(find.text('Strength: 5 mg • Dosage: 1 Tablet'), findsOneWidget);

      // Drag down to reveal next medication in list
      await tester.drag(find.byType(TabBarView), const Offset(0, -300));
      await tester.pumpAndSettle();
      expect(find.text('Atorvastatin Calcium'), findsOneWidget);
      expect(find.text('Red Sticker Packaging'), findsOneWidget);
    },
  );

  testWidgets(
    'Clearly distinguishes between confirmed appointments and doctor review recommendations',
    (WidgetTester tester) async {
      final appState = AppState(initialAuthenticated: true);
      await tester.pumpWidget(CuraLinkApp(appState: appState));
      await tester.pumpAndSettle();

      // Check recommendation label
      expect(find.text('RECOMMENDED REVIEW (NOT SCHEDULED)'), findsOneWidget);
      expect(find.text('Doctor Advice • Unbooked'), findsOneWidget);

      // Check confirmed appointment card
      expect(find.text('Confirmed Hospital Appointment'), findsOneWidget);
      expect(find.text('Dr. Arvind Kumar'), findsAtLeastNWidgets(1));
    },
  );

  testWidgets(
    'Profile screen displays ABHA number, diagnosis, emergency contact, and navigation tiles',
    (WidgetTester tester) async {
      final appState = AppState(initialAuthenticated: true);
      await tester.pumpWidget(CuraLinkApp(appState: appState));
      await tester.pumpAndSettle();

      // Tap on Profile tab
      expect(find.text('Profile'), findsOneWidget);
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();

      expect(
        find.text('Ayushman Bharat Health Account (ABHA)'),
        findsOneWidget,
      );
      expect(find.text('14-8821-4902-1104'), findsOneWidget);
      expect(find.text('Clinical Profile & Emergency Data'), findsOneWidget);
      expect(find.text('Verified Patient Account'), findsOneWidget);
      expect(find.text('About CuraLink Healthcare'), findsOneWidget);
    },
  );

  testWidgets(
    'Medical Records allows viewing DiagnosticReportDetailScreen and popping back',
    (WidgetTester tester) async {
      final appState = AppState(initialAuthenticated: true);
      await tester.pumpWidget(CuraLinkApp(appState: appState));
      await tester.pumpAndSettle();

      // Go to Medical Records tab
      await tester.tap(find.text('Medical Records'));
      await tester.pumpAndSettle();

      // Switch to Scans & Lab Tests sub-tab
      await tester.tap(find.textContaining('Scans & Lab Tests'));
      await tester.pumpAndSettle();

      // Verify ECG is in list
      expect(find.text('12-Lead Electrocardiogram (ECG)'), findsOneWidget);

      // Tap on ECG card
      await tester.tap(find.text('12-Lead Electrocardiogram (ECG)'));
      await tester.pumpAndSettle();

      // Verify DiagnosticReportDetailScreen is shown
      expect(find.text('Diagnostic Test Details'), findsOneWidget);
      expect(find.text('Key Clinical Lab Findings'), findsOneWidget);
      expect(find.text('Heart Rate'), findsOneWidget);
      expect(find.text('72 bpm (Normal Sinus)'), findsOneWidget);

      // Pop back
      await tester.pageBack();
      await tester.pumpAndSettle();
      expect(find.text('Medical Records'), findsAtLeastNWidgets(1));
    },
  );

  testWidgets(
    'NotificationsScreen opens from Home action and displays alerts',
    (WidgetTester tester) async {
      final appState = AppState(initialAuthenticated: true);
      await tester.pumpWidget(CuraLinkApp(appState: appState));
      await tester.pumpAndSettle();

      // Tap notifications icon
      await tester.tap(find.byTooltip('Clinical Alerts & Notifications'));
      await tester.pumpAndSettle();

      // Verify NotificationsScreen
      expect(find.text('Notifications & Alerts'), findsOneWidget);
      expect(
        find.text('Clinical Update: Active Regimen in Progress'),
        findsOneWidget,
      );

      // Pop back
      await tester.pageBack();
      await tester.pumpAndSettle();
      expect(find.text('Home'), findsOneWidget);
    },
  );

  testWidgets(
    'Deduplication audit: Profile removes duplicate Daily Schedule tile and retains single Help/About',
    (WidgetTester tester) async {
      final appState = AppState(initialAuthenticated: true);
      await tester.pumpWidget(CuraLinkApp(appState: appState));
      await tester.pumpAndSettle();

      // Go to Profile tab
      await tester.tap(find.text('Profile'));
      await tester.pumpAndSettle();

      // Daily Medication Schedule should NOT appear in Profile
      expect(
        find.widgetWithText(ListTile, 'Daily Medication Schedule'),
        findsNothing,
      );

      // Single authoritative Help & About exists in Profile
      expect(find.text('About CuraLink Healthcare'), findsOneWidget);

      // Open Help & About
      await tester.ensureVisible(find.text('About CuraLink Healthcare'));
      await tester.tap(find.text('About CuraLink Healthcare'));
      await tester.pumpAndSettle();
      expect(find.text('About the Platform'), findsOneWidget);
      expect(find.text('Unified Medication Packaging'), findsOneWidget);

      // Back navigation returns to Profile
      await tester.pageBack();
      await tester.pumpAndSettle();
      expect(find.text('Patient Profile'), findsOneWidget);
    },
  );

  testWidgets(
    'Deduplication audit: Home renders compact latest test report summary and consolidated quick actions',
    (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final appState = AppState(initialAuthenticated: true);
      await tester.pumpWidget(CuraLinkApp(appState: appState));
      await tester.pumpAndSettle();

      // Duplicate standalone shortcuts on Home should not exist
      expect(find.widgetWithText(InkWell, 'Alerts'), findsNothing);
      expect(find.widgetWithText(InkWell, 'Help & Info'), findsNothing);

      // Home shows compact latest diagnostic report card
      expect(find.text('LATEST DIAGNOSTIC REPORT'), findsOneWidget);
      expect(find.text('12-Lead Electrocardiogram (ECG)'), findsOneWidget);

      // Tapping View Full Report opens DiagnosticReportDetailScreen
      await tester.ensureVisible(
        find.widgetWithText(ElevatedButton, 'View Full Report'),
      );
      await tester.tap(find.widgetWithText(ElevatedButton, 'View Full Report'));
      await tester.pumpAndSettle();

      expect(find.text('Diagnostic Test Details'), findsOneWidget);
      expect(
        find.text('12-Lead Electrocardiogram (ECG)'),
        findsAtLeastNWidgets(1),
      );

      // Back navigation returns to Home
      await tester.pageBack();
      await tester.pumpAndSettle();
      expect(find.text('CuraLink Healthcare'), findsAtLeastNWidgets(1));
    },
  );

  testWidgets(
    'Deduplication audit: Medical Records clarifies Medical & Medication History without duplicate daily schedule',
    (WidgetTester tester) async {
      final appState = AppState(initialAuthenticated: true);
      await tester.pumpWidget(CuraLinkApp(appState: appState));
      await tester.pumpAndSettle();

      // Go to Medical Records
      await tester.tap(find.text('Medical Records'));
      await tester.pumpAndSettle();

      // Tab title is Medical & Medication History
      expect(find.text('Medical & Medication History'), findsOneWidget);

      // Clinical medical conditions summary is visible
      expect(find.text('CLINICAL MEDICAL HISTORY'), findsOneWidget);

      // Subtabs are Active Medications and Past / Discontinued
      expect(find.textContaining('Active Medications'), findsOneWidget);
      expect(find.textContaining('Past / Discontinued'), findsOneWidget);
    },
  );
}
