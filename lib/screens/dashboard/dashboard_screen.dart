import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../app/app_state.dart';
import '../../models/prescription.dart';
import '../../models/diagnostic_test.dart';
import '../../theme/app_theme.dart';
import '../../widgets/appointment_card.dart';
import '../../widgets/notification_bell_button.dart';
import '../medical_history/daily_medication_schedule_screen.dart';
import '../notifications/notifications_screen.dart';
import '../prescription_history/prescription_detail_screen.dart';
import '../scan_test_history/diagnostic_report_detail_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _selectedNotificationFilter = 'All';

  final List<Map<String, dynamic>> _homeNotifications = [
    {
      'title': 'Hospital Appointment Confirmed',
      'body':
          'Cardiology OPD follow-up confirmed with Dr. Arvind Kumar for 28 Oct 2026 at 10:30 AM (Room 304).',
      'time': '10 Oct 2026',
      'category': 'Appointments',
      'icon': Icons.calendar_month_rounded,
      'color': AppTheme.primaryBlue,
      'bg': AppTheme.primaryBlueSurface,
      'actionType': 'appointment',
      'actionLabel': 'View Appointment Details',
    },
    {
      'title': 'Upcoming Scan: 2D Echocardiogram [Diagnostic Imaging]',
      'body':
          'Type: Diagnostic Scan (Ultrasound imaging). Scheduled for 28 Oct 2026 at St. John’s Cardiac Imaging Suite 2. Please arrive 15 minutes prior to the scan appointment.',
      'time': 'Yesterday',
      'category': 'Tests',
      'icon': Icons.biotech_rounded,
      'color': AppTheme.warningAmber,
      'bg': AppTheme.warningSurface,
      'actionType': 'test',
      'testId': 'test-003',
      'actionLabel': 'View Scheduled Scan Details',
    },
    {
      'title': 'Regimen Update: Morning Regimen Active',
      'body':
          'Dr. Arvind Kumar updated your morning regimen with Amlodipine Besylate 5 mg and Metformin 500 mg. Blood pressure targets are stable.',
      'time': 'Today, 08:30 AM',
      'category': 'Clinical',
      'icon': Icons.medication_rounded,
      'color': AppTheme.primaryBlue,
      'bg': AppTheme.primaryBlueSurface,
      'actionType': 'rx',
      'actionLabel': 'View Prescription Details',
    },
    {
      'title': 'Laboratory Test Verified: 12-Lead ECG Report',
      'body':
          'Type: Diagnostic Cardiology Test. Dr. Arvind Kumar reviewed your ECG report: Normal sinus rhythm at 72 bpm. No acute ischemic changes detected.',
      'time': '04 Oct 2026',
      'category': 'Tests',
      'icon': Icons.assignment_turned_in_rounded,
      'color': AppTheme.successGreen,
      'bg': AppTheme.successSurface,
      'actionType': 'test',
      'testId': 'test-001',
      'actionLabel': 'View ECG Test Report',
    },
    {
      'title': 'Medical Allergy / Medication Note Recorded',
      'body':
          'Telmisartan course marked discontinued due to mild dry throat complaints. Replaced with Amlodipine monotherapy.',
      'time': '14 Jun 2026',
      'category': 'Clinical',
      'icon': Icons.health_and_safety_rounded,
      'color': const Color(0xFF7C3AED),
      'bg': const Color(0xFFF5F3FF),
      'actionType': 'rx',
      'actionLabel': 'View Clinical Rx',
    },
  ];

  @override
  Widget build(BuildContext context) {
    final appState = AppStateScope.of(context);
    final patient = appState.selectedPatient;
    final rx = appState.latestPrescription;
    final dateFormat = DateFormat('dd MMM yyyy');

    if (patient == null) {
      return const Scaffold(
        backgroundColor: AppTheme.backgroundCream,
        body: Center(child: CircularProgressIndicator(color: AppTheme.primaryBlue)),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.backgroundCream,
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: CustomScrollView(
            slivers: [
              _buildSliverAppBar(context, appState, patient),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // 1. Today's Medication Summary
                      _buildTodayMedicationCard(context, appState),
                      const SizedBox(height: 20),

                      // 2. Latest Prescription Hero Card
                      if (rx != null) _buildLatestPrescriptionCard(context, appState, rx, dateFormat),
                      if (rx != null) const SizedBox(height: 20),

                      // 3. Upcoming Schedule & Scans (Unified with 4 days to go countdown)
                      if (rx != null) _buildUpcomingScheduleCard(context, appState, rx, dateFormat),
                      if (rx != null) const SizedBox(height: 20),

                      // 4. Latest Diagnostic Test
                      _buildLatestTestCard(context, appState, dateFormat),
                      const SizedBox(height: 20),

                      // 5. Interactive Notifications & Clinical Alerts (Filterable on Home)
                      _buildHomeNotificationsSection(context, appState),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Sliver App Bar ──────────────────────────────────────────────────────────
  Widget _buildSliverAppBar(BuildContext context, AppState appState, dynamic patient) {
    final hour = DateTime.now().hour;
    final greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    return SliverAppBar(
      expandedHeight: 110,
      floating: false,
      pinned: true,
      backgroundColor: AppTheme.backgroundWhite,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      shadowColor: AppTheme.borderSubtle,
      actions: const [
        NotificationBellButton(),
        SizedBox(width: 8),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          color: AppTheme.backgroundWhite,
          child: Align(
            alignment: Alignment.bottomLeft,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppTheme.primaryBlue, AppTheme.primaryBlueLight],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        patient.fullName.split(' ').where((s) => s.isNotEmpty && !s.contains('.')).map((s) => s[0]).take(2).join(),
                        style: GoogleFonts.outfit(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              'CuraLink Healthcare',
                              style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.primaryBlue),
                            ),
                            Text(
                              ' • $greeting',
                              style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w500, color: AppTheme.textMuted),
                            ),
                          ],
                        ),
                        Text(
                          patient.fullName,
                          style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w700, color: AppTheme.primaryBlue, letterSpacing: -0.3),
                        ),
                        Text(
                          '${patient.age} yrs • ${patient.gender} • ${patient.bloodGroup}',
                          style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w500, color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }


  // ─── Today Medication Summary ─────────────────────────────────────────────────
  Widget _buildTodayMedicationCard(BuildContext context, AppState appState) {
    final activeMeds = appState.medications.where((m) => m.isActive).toList();
    final morningCount = activeMeds.where((m) => m.isMorning).length;
    final nightCount = activeMeds.where((m) => m.isNight).length;

    return _SectionCard(
      child: Column(
        children: [
          _SectionHeader(
            icon: Icons.wb_sunny_rounded,
            iconColor: const Color(0xFFF59E0B),
            title: "Today’s Medication Schedule",
            action: TextButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const DailyMedicationScheduleScreen()),
              ),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                backgroundColor: AppTheme.primaryBlueSurface,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.radiusPill)),
              ),
              child: Text(
                'View Full Schedule',
                style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.primaryBlue),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _DoseTimeBadge(label: 'Morning', count: morningCount, icon: Icons.wb_sunny_outlined, color: const Color(0xFFF59E0B), bg: const Color(0xFFFFFBEB)),
              const SizedBox(width: 8),
              _DoseTimeBadge(label: 'Afternoon', count: activeMeds.where((m) => m.isAfternoon).length, icon: Icons.wb_cloudy_outlined, color: AppTheme.textMuted, bg: AppTheme.surfaceMuted),
              const SizedBox(width: 8),
              _DoseTimeBadge(label: 'Evening', count: activeMeds.where((m) => m.isEvening).length, icon: Icons.nights_stay_outlined, color: const Color(0xFF7C3AED), bg: const Color(0xFFF5F3FF)),
              const SizedBox(width: 8),
              _DoseTimeBadge(label: 'Night', count: nightCount, icon: Icons.bedtime_outlined, color: AppTheme.primaryBlue, bg: AppTheme.primaryBlueSurface),
            ],
          ),
          if (activeMeds.isNotEmpty) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppTheme.primaryBlueSurface,
                borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
              ),
              child: Row(
                children: [
                  const Icon(Icons.access_time_rounded, size: 15, color: AppTheme.primaryBlue),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Next: Morning 08:00 AM  •  Amlodipine Besylate & Metformin',
                      style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w500, color: AppTheme.textSecondary),
                    ),
                  ),
                ],
              ),
            ),
          ],
          // Next Clinical Investigation (Explicit Scan vs Test Notification)
          if (appState.diagnosticTests.any((t) => t.status == TestStatus.scheduled)) ...[
            Builder(
              builder: (context) {
                final scheduledTests = appState.diagnosticTests
                    .where((t) => t.status == TestStatus.scheduled)
                    .toList();
                final nextInv = scheduledTests.first;
                final isScan = nextInv.category == TestCategory.diagnosticScan;
                final invType = isScan ? '[Diagnostic Scan]' : '[Laboratory Test]';
                final daysText = nextInv.scheduledDate != null
                    ? 'In 4 days (${DateFormat('dd MMM yyyy, hh:mm a').format(nextInv.scheduledDate!)})'
                    : 'In 4 days';
                return Container(
                  margin: const EdgeInsets.only(top: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                    border: Border.all(color: const Color(0xFFFCD34D)),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        isScan ? Icons.scanner_rounded : Icons.biotech_rounded,
                        size: 15,
                        color: const Color(0xFFB45309),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: RichText(
                          text: TextSpan(
                            style: GoogleFonts.outfit(
                              fontSize: 12,
                              color: const Color(0xFF92400E),
                            ),
                            children: [
                              TextSpan(
                                text: 'Next $invType: ',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFFB45309),
                                ),
                              ),
                              TextSpan(
                                text: '${nextInv.testName}  •  $daysText',
                                style: const TextStyle(fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ],
      ),
    );
  }

  // ─── Upcoming Appointments & Scans Card (Unified) ─────────────────────────────
  Widget _buildUpcomingScheduleCard(
    BuildContext context,
    AppState appState,
    Prescription rx,
    DateFormat dateFormat,
  ) {
    final appt = rx.confirmedAppointment;
    final rec = rx.followUpRecommendationText;
    final scheduledTests = appState.diagnosticTests.where((t) => t.status == TestStatus.scheduled).toList();
    final cards = <Widget>[];

    if (rec != null) {
      cards.add(
        _SectionCard(
          borderColor: AppTheme.warningBorder,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _SectionHeader(
                icon: Icons.info_outline_rounded,
                iconColor: AppTheme.warningAmber,
                title: 'RECOMMENDED REVIEW (NOT SCHEDULED)',
                badge: const _PillBadge(
                  label: 'Doctor Advice • Unbooked',
                  color: AppTheme.warningAmber,
                  bg: AppTheme.warningSurface,
                ),
              ),
              const SizedBox(height: 10),
              Text(rec, style: AppTheme.body),
            ],
          ),
        ),
      );
    }

    if (appt != null) {
      if (cards.isNotEmpty) cards.add(const SizedBox(height: 14));
      cards.add(
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _SectionHeader(
                icon: Icons.event_available_rounded,
                iconColor: AppTheme.primaryBlue,
                title: 'Confirmed Hospital Appointment',
                badge: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(AppTheme.radiusPill),
                    border: Border.all(color: const Color(0xFFF59E0B)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.timer_outlined, size: 13, color: Color(0xFFB45309)),
                      const SizedBox(width: 4),
                      Text(
                        '4 days to go',
                        style: GoogleFonts.outfit(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFFB45309),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryBlueSurface,
                      borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                    ),
                    child: const Icon(Icons.local_hospital_outlined, color: AppTheme.primaryBlue, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(appt.doctorName, style: AppTheme.cardTitle),
                        Text(appt.doctorSpecialty, style: AppTheme.cardSubtitle),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: AppTheme.backgroundCream,
                  borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                  border: Border.all(color: AppTheme.borderSubtle),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.schedule_rounded, size: 15, color: AppTheme.primaryBlue),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        DateFormat('EEE, dd MMM yyyy • hh:mm a').format(appt.dateTime),
                        style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.location_on_outlined, size: 14, color: AppTheme.textMuted),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      appt.location,
                      style: GoogleFonts.outfit(fontSize: 11.5, color: AppTheme.textMuted),
                    ),
                  ),
                ],
              ),

              // Upcoming Scans or Tests to be done in 4 days
              if (scheduledTests.isNotEmpty) ...[
                const SizedBox(height: 16),
                const Divider(height: 1),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(7),
                      decoration: BoxDecoration(
                        color: AppTheme.warningSurface,
                        borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                      ),
                      child: const Icon(Icons.biotech_rounded, size: 16, color: AppTheme.warningAmber),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Upcoming Scans & Tests to be Done',
                        style: GoogleFonts.outfit(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(AppTheme.radiusPill),
                        border: Border.all(color: const Color(0xFFFCD34D)),
                      ),
                      child: Text(
                        '4 days to go',
                        style: GoogleFonts.outfit(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFFB45309),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                for (final test in scheduledTests)
                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceMuted,
                      borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                      border: Border.all(color: AppTheme.borderSubtle),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: test.category == TestCategory.diagnosticScan
                                    ? const Color(0xFFEFF6FF)
                                    : const Color(0xFFECFDF5),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: test.category == TestCategory.diagnosticScan
                                      ? const Color(0xFF93C5FD)
                                      : const Color(0xFF6EE7B7),
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    test.category == TestCategory.diagnosticScan
                                        ? Icons.scanner_rounded
                                        : Icons.biotech_rounded,
                                    size: 13,
                                    color: test.category == TestCategory.diagnosticScan
                                        ? const Color(0xFF1D4ED8)
                                        : const Color(0xFF047857),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    test.category == TestCategory.diagnosticScan
                                        ? 'DIAGNOSTIC SCAN (Imaging)'
                                        : 'LABORATORY TEST (Pathology)',
                                    style: GoogleFonts.outfit(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w800,
                                      color: test.category == TestCategory.diagnosticScan
                                          ? const Color(0xFF1D4ED8)
                                          : const Color(0xFF047857),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '${test.category == TestCategory.diagnosticScan ? "[Scan] " : "[Test] "}${test.testName}',
                          style: GoogleFonts.outfit(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          test.diagnosticCenter,
                          style: GoogleFonts.outfit(fontSize: 11.5, color: AppTheme.textSecondary),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.schedule_rounded, size: 14, color: AppTheme.warningAmber),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                test.scheduledDate != null
                                    ? DateFormat('EEE, dd MMM yyyy • hh:mm a').format(test.scheduledDate!)
                                    : 'Scheduled in 4 days',
                                style: GoogleFonts.outfit(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                'Arrive 15 min prior • Fasting not required',
                                style: GoogleFonts.outfit(fontSize: 11, color: AppTheme.textMuted),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            TextButton(
                              onPressed: () => Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => DiagnosticReportDetailScreen(test: test)),
                              ),
                              style: TextButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                minimumSize: Size.zero,
                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              ),
                              child: Text(
                                'View Details →',
                                style: GoogleFonts.outfit(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.primaryBlue,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
              ],
            ],
          ),
        ),
      );
    }

    if (cards.isEmpty) return const SizedBox.shrink();
    return Column(children: cards);
  }

  // ─── Interactive Notifications & Clinical Alerts Section on Home ───────────────
  Widget _buildHomeNotificationsSection(BuildContext context, AppState appState) {
    final filtered = _homeNotifications.where((n) {
      if (_selectedNotificationFilter == 'All') return true;
      return n['category'] == _selectedNotificationFilter;
    }).toList();

    return _SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionHeader(
            icon: Icons.notifications_active_rounded,
            iconColor: AppTheme.primaryBlue,
            title: 'Notifications & Clinical Alerts',
            badge: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444),
                borderRadius: BorderRadius.circular(AppTheme.radiusPill),
              ),
              child: const Text(
                '3 New',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  height: 1.1,
                ),
              ),
            ),
            action: TextButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const NotificationsScreen()),
              ),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                backgroundColor: AppTheme.primaryBlueSurface,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.radiusPill)),
              ),
              child: Text(
                'Full Center',
                style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.primaryBlue),
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Interactive Filter Chips: All, Clinical, Appointments, Tests
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildHomeFilterChip('All'),
                const SizedBox(width: 8),
                _buildHomeFilterChip('Clinical'),
                const SizedBox(width: 8),
                _buildHomeFilterChip('Appointments'),
                const SizedBox(width: 8),
                _buildHomeFilterChip('Tests'),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Notifications Cards matching the selected filter
          if (filtered.isEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              alignment: Alignment.center,
              child: Text(
                'No notifications in this category.',
                style: GoogleFonts.outfit(color: AppTheme.textMuted, fontSize: 13),
              ),
            )
          else ...[
            _buildHomeNotificationCard(context, appState, filtered.first),
            if (filtered.length > 1) ...[
              const SizedBox(height: 8),
              Center(
                child: TextButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                  ),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: Text(
                    '+${filtered.length - 1} more alert${filtered.length > 2 ? 's' : ''} • View in Notifications Center',
                    style: GoogleFonts.outfit(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.primaryBlue,
                    ),
                  ),
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildHomeFilterChip(String label) {
    final isSelected = _selectedNotificationFilter == label;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedNotificationFilter = label;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryBlue : AppTheme.backgroundWhite,
          borderRadius: BorderRadius.circular(AppTheme.radiusPill),
          border: Border.all(
            color: isSelected ? AppTheme.primaryBlue : AppTheme.borderSubtle,
          ),
          boxShadow: isSelected ? AppTheme.cardShadow : null,
        ),
        child: Text(
          label,
          style: GoogleFonts.outfit(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : AppTheme.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildHomeNotificationCard(
    BuildContext context,
    AppState appState,
    Map<String, dynamic> item,
  ) {
    final Color color = item['color'] as Color;
    final Color bg = item['bg'] as Color;
    final String? actionLabel = item['actionLabel'] as String?;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        border: Border.all(color: AppTheme.borderSubtle),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: bg,
                  borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                ),
                child: Icon(item['icon'] as IconData, size: 20, color: color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item['title'] as String,
                      style: GoogleFonts.outfit(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item['body'] as String,
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        height: 1.4,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          item['time'] as String,
                          style: GoogleFonts.outfit(
                            fontSize: 11,
                            color: AppTheme.textMuted,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceMuted,
                            borderRadius: BorderRadius.circular(AppTheme.radiusPill),
                          ),
                          child: Text(
                            item['category'] as String,
                            style: GoogleFonts.outfit(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.textMuted,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (actionLabel != null) ...[
            const SizedBox(height: 10),
            const Divider(height: 1),
            const SizedBox(height: 6),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                icon: const Icon(Icons.arrow_forward_rounded, size: 14),
                label: Text(actionLabel),
                style: TextButton.styleFrom(
                  foregroundColor: color,
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  textStyle: GoogleFonts.outfit(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                onPressed: () => _handleNotificationAction(context, appState, item),
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _handleNotificationAction(
    BuildContext context,
    AppState appState,
    Map<String, dynamic> item,
  ) {
    final actionType = item['actionType'] as String?;
    if (actionType == 'test') {
      final testId = item['testId'] as String?;
      final test = appState.diagnosticTests.firstWhere(
        (t) => t.id == testId,
        orElse: () => appState.diagnosticTests.first,
      );
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => DiagnosticReportDetailScreen(test: test),
        ),
      );
    } else if (actionType == 'rx') {
      final rx = appState.latestPrescription;
      if (rx != null) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => PrescriptionDetailScreen(prescription: rx),
          ),
        );
      }
    } else if (actionType == 'appointment') {
      final appt = appState.appointments.isNotEmpty
          ? appState.appointments.first
          : appState.latestPrescription?.confirmedAppointment;
      if (appt != null) {
        showModalBottomSheet(
          context: context,
          backgroundColor: Colors.transparent,
          isScrollControlled: true,
          builder: (ctx) => Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: AppTheme.backgroundWhite,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Confirmed Appointment Details',
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                AppointmentCard(appointment: appt),
                const SizedBox(height: 16),
              ],
            ),
          ),
        );
      }
    }
  }

  // ─── Latest Prescription ─────────────────────────────────────────────────────
  Widget _buildLatestPrescriptionCard(BuildContext context, AppState appState, Prescription rx, DateFormat dateFormat) {
    return _SectionCard(
      child: Column(
        children: [
          _SectionHeader(
            icon: Icons.receipt_long_rounded,
            iconColor: AppTheme.primaryBlue,
            title: 'Latest Prescription',
            action: TextButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => PrescriptionDetailScreen(prescription: rx)),
              ),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                backgroundColor: AppTheme.primaryBlueSurface,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.radiusPill)),
              ),
              child: Text('Details', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.primaryBlue)),
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(rx.referenceNumber, style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.primaryBlue, letterSpacing: 0.3)),
                    const SizedBox(height: 3),
                    Text(rx.doctorName, style: AppTheme.cardTitle),
                    Text(rx.hospitalOrClinic, style: AppTheme.cardSubtitle),
                  ],
                ),
              ),
              _PillBadge(
                label: dateFormat.format(rx.date),
                color: AppTheme.textMuted,
                bg: AppTheme.backgroundCream,
                border: AppTheme.borderSubtle,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: AppTheme.backgroundCream,
              borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
              border: Border.all(color: AppTheme.borderSubtle),
            ),
            child: Row(
              children: [
                const Icon(Icons.medical_services_outlined, size: 15, color: AppTheme.textMuted),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(rx.diagnosis, style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w500, color: AppTheme.textSecondary)),
                ),
              ],
            ),
          ),
          if (rx.medications.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: rx.medications.map((m) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.primaryBlueSurface,
                  borderRadius: BorderRadius.circular(AppTheme.radiusPill),
                  border: Border.all(color: AppTheme.primaryBlueBorder),
                ),
                child: Text(
                  '${m.name} (${m.strength})',
                  style: GoogleFonts.outfit(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.primaryBlue,
                  ),
                ),
              )).toList(),
            ),
          ],
        ],
      ),
    );
  }

  // ─── Latest Diagnostic Test ───────────────────────────────────────────────────
  Widget _buildLatestTestCard(BuildContext context, AppState appState, DateFormat dateFormat) {
    final tests = appState.diagnosticTests;
    final DiagnosticTest? latestTest = tests.where((t) => t.isCompleted).isNotEmpty
        ? tests.where((t) => t.isCompleted).first
        : (tests.isNotEmpty ? tests.first : null);

    if (latestTest == null) return const SizedBox.shrink();

    return _SectionCard(
      child: Column(
        children: [
          _SectionHeader(
            icon: Icons.biotech_outlined,
            iconColor: const Color(0xFF7C3AED),
            title: 'LATEST DIAGNOSTIC REPORT',
            badge: _PillBadge(
              label: latestTest.isCompleted ? 'Completed' : 'Scheduled',
              color: latestTest.isCompleted ? AppTheme.successGreen : AppTheme.warningAmber,
              bg: latestTest.isCompleted ? AppTheme.successSurface : AppTheme.warningSurface,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: const Color(0xFFF5F3FF),
                  borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                ),
                child: const Icon(Icons.science_outlined, color: Color(0xFF7C3AED), size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(latestTest.testName, style: AppTheme.cardTitle),
                    const SizedBox(height: 2),
                    Text('${latestTest.diagnosticCenter} • ${dateFormat.format(latestTest.targetDate)}', style: AppTheme.bodySmall),
                  ],
                ),
              ),
            ],
          ),
          if (latestTest.reportSummary != null && latestTest.reportSummary!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.backgroundCream,
                borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                border: Border.all(color: AppTheme.borderSubtle),
              ),
              child: Text(
                latestTest.reportSummary!,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: AppTheme.bodySmall,
              ),
            ),
          ],
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => DiagnosticReportDetailScreen(test: latestTest)),
              ),
              child: const Text('View Full Report'),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Shared Reusable Sub-Widgets ─────────────────────────────────────────────

class _SectionCard extends StatelessWidget {
  final Widget child;
  final Color? borderColor;

  const _SectionCard({required this.child, this.borderColor});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        border: Border.all(color: borderColor ?? AppTheme.borderSubtle, width: 1),
        boxShadow: AppTheme.cardShadow,
      ),
      child: child,
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final Widget? action;
  final Widget? badge;

  const _SectionHeader({
    required this.icon,
    required this.iconColor,
    required this.title,
    this.action,
    this.badge,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
          ),
          child: Icon(icon, size: 17, color: iconColor),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(title, style: AppTheme.sectionHeading.copyWith(fontSize: 15)),
        ),
        ?badge,
        ?action,
      ],
    );
  }
}

class _PillBadge extends StatelessWidget {
  final String label;
  final Color color;
  final Color bg;
  final Color? border;

  const _PillBadge({required this.label, required this.color, required this.bg, this.border});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppTheme.radiusPill),
        border: Border.all(color: border ?? color.withValues(alpha: 0.25), width: 1),
      ),
      child: Text(label, style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
    );
  }
}


class _DoseTimeBadge extends StatelessWidget {
  final String label;
  final int count;
  final IconData icon;
  final Color color;
  final Color bg;

  const _DoseTimeBadge({
    required this.label,
    required this.count,
    required this.icon,
    required this.color,
    required this.bg,
  });

  @override
  Widget build(BuildContext context) {
    final hasCount = count > 0;
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
        decoration: BoxDecoration(
          color: hasCount ? bg : AppTheme.surfaceMuted,
          borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
          border: Border.all(color: hasCount ? color.withValues(alpha: 0.3) : AppTheme.borderSubtle),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 17, color: hasCount ? color : AppTheme.textLight),
            const SizedBox(height: 4),
            Text(
              label,
              style: GoogleFonts.outfit(fontSize: 9.5, fontWeight: FontWeight.w600, color: hasCount ? color : AppTheme.textLight),
            ),
            Text(
              hasCount ? '$count dose${count > 1 ? "s" : ""}' : 'None',
              style: GoogleFonts.outfit(fontSize: 9, fontWeight: FontWeight.w500, color: hasCount ? AppTheme.textSecondary : AppTheme.textLight),
            ),
          ],
        ),
      ),
    );
  }
}
