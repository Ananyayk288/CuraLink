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
  int _selectedDayIndex = 2; // Default to middle active day (e.g. Tue 23 style)

  final List<Map<String, dynamic>> _homeNotifications = [
    {
      'title': 'Appointment Confirmed',
      'body': 'Cardiology OPD • 28 Oct, 10:30 AM (Room 304)',
      'time': '10 Oct',
      'category': 'Appointments',
      'icon': Icons.calendar_month_rounded,
      'color': AppTheme.primaryBlue,
      'bg': AppTheme.primaryBlueSurface,
      'actionType': 'appointment',
      'actionLabel': 'Details',
    },
    {
      'title': 'Next Scan: 2D Echo',
      'body': 'Diagnostic Ultrasound • 28 Oct, Suite 2',
      'time': 'Yesterday',
      'category': 'Tests',
      'icon': Icons.biotech_rounded,
      'color': AppTheme.warningAmber,
      'bg': AppTheme.warningSurface,
      'actionType': 'test',
      'testId': 'test-003',
      'actionLabel': 'Details',
    },
    {
      'title': 'Regimen Updated',
      'body': 'Morning: Amlodipine 5mg & Metformin 500mg',
      'time': '08:30 AM',
      'category': 'Clinical',
      'icon': Icons.medication_rounded,
      'color': AppTheme.primaryBlue,
      'bg': AppTheme.primaryBlueSurface,
      'actionType': 'rx',
      'actionLabel': 'Details',
    },
    {
      'title': 'ECG Verified',
      'body': 'Sinus rhythm 72 bpm • Normal',
      'time': '04 Oct',
      'category': 'Tests',
      'icon': Icons.assignment_turned_in_rounded,
      'color': AppTheme.successGreen,
      'bg': AppTheme.successSurface,
      'actionType': 'test',
      'testId': 'test-001',
      'actionLabel': 'Details',
    },
    {
      'title': 'Allergy Recorded',
      'body': 'Telmisartan stopped (throat irritation)',
      'time': '14 Jun',
      'category': 'Clinical',
      'icon': Icons.health_and_safety_rounded,
      'color': const Color(0xFF7C3AED),
      'bg': const Color(0xFFF5F3FF),
      'actionType': 'rx',
      'actionLabel': 'Details',
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
        backgroundColor: AppTheme.backgroundLavender,
        body: Center(child: CircularProgressIndicator(color: AppTheme.primaryBlue)),
      );
    }

    final activeMeds = appState.medications.where((m) => m.isActive).toList();
    final morningCount = activeMeds.where((m) => m.isMorning).length;
    final nightCount = activeMeds.where((m) => m.isNight).length;

    return Scaffold(
      backgroundColor: AppTheme.backgroundLavender,
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: CustomScrollView(
            slivers: [
              // ─── Hero Gradient Header ──────────────────────────────────────────
              SliverToBoxAdapter(
                child: _buildGradientHeroHeader(
                  context,
                  appState,
                  patient,
                  activeMeds.length,
                  morningCount + nightCount,
                ),
              ),

              // ─── Main Content Cards ────────────────────────────────────────────
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 80),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // 1. Today's Medication Summary
                      _buildTodayMedicationCard(context, appState),
                      const SizedBox(height: 14),

                      // 2. Latest Prescription Hero Card
                      if (rx != null) _buildLatestPrescriptionCard(context, appState, rx, dateFormat),
                      if (rx != null) const SizedBox(height: 14),

                      // 3. Upcoming Schedule & Scans (Unified with 4 days countdown)
                      if (rx != null) _buildUpcomingScheduleCard(context, appState, rx, dateFormat),
                      if (rx != null) const SizedBox(height: 14),

                      // 4. Latest Diagnostic Test
                      _buildLatestTestCard(context, appState, dateFormat),
                      const SizedBox(height: 14),

                      // 5. Interactive Notifications & Clinical Alerts
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

  // ─── Hero Gradient Header matching Reference Screen 2 ────────────────────────
  Widget _buildGradientHeroHeader(
    BuildContext context,
    AppState appState,
    dynamic patient,
    int activeMedsCount,
    int totalDosesToday,
  ) {
    final topPad = MediaQuery.of(context).padding.top;
    final hour = DateTime.now().hour;
    final greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    return Container(
      decoration: const BoxDecoration(
        gradient: AppTheme.headerGradient,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Color(0x332B33E7),
            blurRadius: 24,
            offset: Offset(0, 8),
          ),
        ],
      ),
      padding: EdgeInsets.fromLTRB(18, topPad + 8, 18, 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Bar: Profile avatar + Greeting + Frosted Notification Bell
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.2),
                  border: Border.all(color: Colors.white, width: 2),
                ),
                child: Center(
                  child: Text(
                    patient.fullName.split(' ').where((s) => s.isNotEmpty && !s.contains('.')).map((s) => s[0]).take(2).join(),
                    style: GoogleFonts.outfit(
                      color: Colors.white,
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'CuraLink Healthcare',
                          style: GoogleFonts.outfit(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.accentLime,
                            letterSpacing: 0.2,
                          ),
                        ),
                        Text(
                          ' • $greeting',
                          style: GoogleFonts.outfit(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: AppTheme.textOnDarkMuted,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      patient.fullName,
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: -0.3,
                      ),
                    ),
                    Text(
                      '${patient.age} yrs • ${patient.gender} • ${patient.bloodGroup}',
                      style: GoogleFonts.outfit(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.textOnDarkSubtle,
                      ),
                    ),
                  ],
                ),
              ),
              const NotificationBellButton(isTranslucent: true),
            ],
          ),

          const SizedBox(height: 12),

          // Kicker + Large Italic Headline
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Patient Management',
                    style: GoogleFonts.outfit(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textOnDarkMuted,
                      letterSpacing: 0.3,
                    ),
                  ),
                  Text(
                    'Dashboard',
                    style: GoogleFonts.outfit(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      fontStyle: FontStyle.italic,
                      color: Colors.white,
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Horizontal Date Selector with Lime Green Active Pill
          _buildHorizontalDateSelector(),

          const SizedBox(height: 12),

          // Side-by-Side Translucent Stat Cards
          Row(
            children: [
              Expanded(
                child: _FrostedStatCard(
                  title: 'Counseling',
                  value: '1:45',
                  unit: 'Hours',
                  icon: Icons.timer_outlined,
                  iconColor: const Color(0xFFFCD34D),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _FrostedStatCard(
                  title: 'Lab Tests',
                  value: '${appState.diagnosticTests.where((t) => t.isCompleted).length}/${appState.diagnosticTests.length}',
                  unit: 'Results',
                  icon: Icons.biotech_rounded,
                  iconColor: AppTheme.accentLime,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ─── Horizontal Date Selector (Sun 21, Mon 22, Tue 23 [Lime], Wed 24, Thu 25) ──
  Widget _buildHorizontalDateSelector() {
    final now = DateTime.now();
    final days = List.generate(5, (index) {
      final date = now.subtract(Duration(days: 2 - index));
      return {
        'day': DateFormat('EEE').format(date),
        'date': DateFormat('d').format(date),
      };
    });

    return LayoutBuilder(
      builder: (context, constraints) {
        final itemWidth = (constraints.maxWidth - (8 * 4)) / 5;
        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            for (int i = 0; i < days.length; i++)
              GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedDayIndex = i;
                  });
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: itemWidth.clamp(50.0, 68.0),
                  padding: const EdgeInsets.symmetric(vertical: 7),
                  decoration: BoxDecoration(
                    color: i == _selectedDayIndex
                        ? AppTheme.accentLime
                        : Colors.white.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: i == _selectedDayIndex
                          ? AppTheme.accentLimeLight
                          : Colors.white.withValues(alpha: 0.22),
                      width: 1.2,
                    ),
                    boxShadow: i == _selectedDayIndex ? AppTheme.limeButtonShadow : null,
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        days[i]['day']!,
                        style: GoogleFonts.outfit(
                          fontSize: 11,
                          fontWeight: i == _selectedDayIndex ? FontWeight.w800 : FontWeight.w500,
                          color: i == _selectedDayIndex ? AppTheme.accentLimeDark : Colors.white,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        days[i]['date']!,
                        style: GoogleFonts.outfit(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w800,
                          color: i == _selectedDayIndex ? AppTheme.accentLimeDark : Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        );
      },
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
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                backgroundColor: AppTheme.primaryBlueSurface,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.radiusPill)),
              ),
              child: Text(
                'View Full Schedule',
                style: GoogleFonts.outfit(fontSize: 11.5, fontWeight: FontWeight.w700, color: AppTheme.primaryBlue),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _DoseTimeBadge(label: 'Morning', count: morningCount, icon: Icons.wb_sunny_outlined, color: const Color(0xFFF59E0B), bg: const Color(0xFFFFFBEB)),
              const SizedBox(width: 6),
              _DoseTimeBadge(label: 'Afternoon', count: activeMeds.where((m) => m.isAfternoon).length, icon: Icons.wb_cloudy_outlined, color: AppTheme.textMuted, bg: AppTheme.surfaceMuted),
              const SizedBox(width: 6),
              _DoseTimeBadge(label: 'Evening', count: activeMeds.where((m) => m.isEvening).length, icon: Icons.nights_stay_outlined, color: const Color(0xFF7C3AED), bg: const Color(0xFFF5F3FF)),
              const SizedBox(width: 6),
              _DoseTimeBadge(label: 'Night', count: nightCount, icon: Icons.bedtime_outlined, color: AppTheme.primaryBlue, bg: AppTheme.primaryBlueSurface),
            ],
          ),
          if (activeMeds.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.primaryBlueSurface,
                borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                border: Border.all(color: AppTheme.primaryBlueBorder, width: 1),
              ),
              child: Row(
                children: [
                  const Icon(Icons.access_time_rounded, size: 15, color: AppTheme.primaryBlue),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Next Dose: 08:00 AM • Morning',
                      style: GoogleFonts.outfit(fontSize: 11.5, fontWeight: FontWeight.w700, color: AppTheme.primaryBlue),
                    ),
                  ),
                  Container(
                    width: 7,
                    height: 7,
                    decoration: const BoxDecoration(
                      color: AppTheme.accentLime,
                      shape: BoxShape.circle,
                    ),
                  ),
                ],
              ),
            ),
          ],
          // Next Scan / Test (Minimized Text)
          if (appState.diagnosticTests.any((t) => t.status == TestStatus.scheduled)) ...[
            Builder(
              builder: (context) {
                final scheduledTests = appState.diagnosticTests
                    .where((t) => t.status == TestStatus.scheduled)
                    .toList();
                final nextInv = scheduledTests.first;
                final isScan = nextInv.category == TestCategory.diagnosticScan;
                final label = isScan ? 'Next Scan' : 'Next Test';
                return Container(
                  margin: const EdgeInsets.only(top: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
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
                              fontSize: 11.5,
                              color: const Color(0xFF92400E),
                            ),
                            children: [
                              TextSpan(
                                text: '$label: ',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFFB45309),
                                ),
                              ),
                              TextSpan(
                                text: '${nextInv.testName} (4 days)',
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
              const SizedBox(height: 8),
              Text(rec, style: AppTheme.body),
            ],
          ),
        ),
      );
    }

    if (appt != null) {
      if (cards.isNotEmpty) cards.add(const SizedBox(height: 12));
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
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(AppTheme.radiusPill),
                    border: Border.all(color: const Color(0xFFF59E0B)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.timer_outlined, size: 12, color: Color(0xFFB45309)),
                      const SizedBox(width: 4),
                      Text(
                        '4 days to go',
                        style: GoogleFonts.outfit(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFFB45309),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryBlueSurface,
                      borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                      border: Border.all(color: AppTheme.primaryBlueBorder),
                    ),
                    child: const Icon(Icons.local_hospital_outlined, color: AppTheme.primaryBlue, size: 22),
                  ),
                  const SizedBox(width: 10),
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
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppTheme.backgroundLavender,
                  borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                  border: Border.all(color: AppTheme.borderSubtle),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.schedule_rounded, size: 14, color: AppTheme.primaryBlue),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        DateFormat('EEE, dd MMM yyyy • hh:mm a').format(appt.dateTime),
                        style: GoogleFonts.outfit(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.location_on_outlined, size: 13, color: AppTheme.textMuted),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      appt.location,
                      style: GoogleFonts.outfit(fontSize: 11, color: AppTheme.textMuted),
                    ),
                  ),
                ],
              ),

              // Upcoming Scans or Tests to be done in 4 days
              if (scheduledTests.isNotEmpty) ...[
                const SizedBox(height: 12),
                const Divider(height: 1),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: AppTheme.warningSurface,
                        borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                      ),
                      child: const Icon(Icons.biotech_rounded, size: 15, color: AppTheme.warningAmber),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Next Scans & Tests',
                        style: GoogleFonts.outfit(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(AppTheme.radiusPill),
                        border: Border.all(color: const Color(0xFFFCD34D)),
                      ),
                      child: Text(
                        '4 days',
                        style: GoogleFonts.outfit(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFFB45309),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                for (final test in scheduledTests)
                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    padding: const EdgeInsets.all(10),
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
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
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
                                    size: 12,
                                    color: test.category == TestCategory.diagnosticScan
                                        ? const Color(0xFF1D4ED8)
                                        : const Color(0xFF047857),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    test.category == TestCategory.diagnosticScan
                                        ? 'Scan'
                                        : 'Test',
                                    style: GoogleFonts.outfit(
                                      fontSize: 10,
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
                        const SizedBox(height: 4),
                        Text(
                          test.testName,
                          style: GoogleFonts.outfit(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 1),
                        Text(
                          test.diagnosticCenter,
                          style: GoogleFonts.outfit(fontSize: 11, color: AppTheme.textSecondary),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(Icons.schedule_rounded, size: 13, color: AppTheme.warningAmber),
                            const SizedBox(width: 5),
                            Expanded(
                              child: Text(
                                test.scheduledDate != null
                                    ? DateFormat('EEE, dd MMM yyyy • hh:mm a').format(test.scheduledDate!)
                                    : 'Scheduled in 4 days',
                                style: GoogleFonts.outfit(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                            ),
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
                                'Details',
                                style: GoogleFonts.outfit(
                                  fontSize: 11,
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
            title: 'Alerts',
            badge: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444),
                borderRadius: BorderRadius.circular(AppTheme.radiusPill),
              ),
              child: const Text(
                '3 New',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 10,
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
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                backgroundColor: AppTheme.primaryBlueSurface,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.radiusPill)),
              ),
              child: Text(
                'All',
                style: GoogleFonts.outfit(fontSize: 11.5, fontWeight: FontWeight.w700, color: AppTheme.primaryBlue),
              ),
            ),
          ),
          const SizedBox(height: 12),

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
          const SizedBox(height: 12),

          // Notifications Cards matching the selected filter
          if (filtered.isEmpty)
            Container(
              padding: const EdgeInsets.all(14),
              alignment: Alignment.center,
              child: Text(
                'No alerts',
                style: GoogleFonts.outfit(color: AppTheme.textMuted, fontSize: 13),
              ),
            )
          else ...[
            _buildHomeNotificationCard(context, appState, filtered.first),
            if (filtered.length > 1) ...[
              const SizedBox(height: 6),
              Center(
                child: TextButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                  ),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: Text(
                    '+${filtered.length - 1} more',
                    style: GoogleFonts.outfit(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
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
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.accentLime : AppTheme.backgroundWhite,
          borderRadius: BorderRadius.circular(AppTheme.radiusPill),
          border: Border.all(
            color: isSelected ? AppTheme.accentLimeBorder : AppTheme.borderSubtle,
            width: 1.2,
          ),
          boxShadow: isSelected ? AppTheme.limeButtonShadow : null,
        ),
        child: Text(
          label,
          style: GoogleFonts.outfit(
            fontSize: 11.5,
            fontWeight: FontWeight.w700,
            color: isSelected ? AppTheme.accentLimeDark : AppTheme.textSecondary,
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
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        border: Border.all(color: AppTheme.borderSubtle),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: bg,
                  borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                ),
                child: Icon(item['icon'] as IconData, size: 18, color: color),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item['title'] as String,
                      style: GoogleFonts.outfit(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      item['body'] as String,
                      style: GoogleFonts.outfit(
                        fontSize: 11.5,
                        height: 1.35,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          item['time'] as String,
                          style: GoogleFonts.outfit(
                            fontSize: 10.5,
                            color: AppTheme.textMuted,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceMuted,
                            borderRadius: BorderRadius.circular(AppTheme.radiusPill),
                          ),
                          child: Text(
                            item['category'] as String,
                            style: GoogleFonts.outfit(
                              fontSize: 10,
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
            const SizedBox(height: 8),
            const Divider(height: 1),
            const SizedBox(height: 4),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                icon: const Icon(Icons.arrow_forward_rounded, size: 13),
                label: Text(actionLabel),
                style: TextButton.styleFrom(
                  foregroundColor: color,
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  textStyle: GoogleFonts.outfit(
                    fontSize: 11.5,
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

  // ─── Latest Prescription Hero Card (Ref Styled with standalone ref text) ──────
  Widget _buildLatestPrescriptionCard(BuildContext context, AppState appState, Prescription rx, DateFormat dateFormat) {
    return _SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with id pill & circular arrow button matching Reference Screen 2
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceMuted,
                  borderRadius: BorderRadius.circular(AppTheme.radiusPill),
                  border: Border.all(color: AppTheme.borderSubtle),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'id: ',
                      style: GoogleFonts.outfit(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.textMuted,
                      ),
                    ),
                    Text(
                      rx.referenceNumber,
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.primaryBlue,
                      ),
                    ),
                  ],
                ),
              ),
              InkWell(
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => PrescriptionDetailScreen(prescription: rx)),
                ),
                borderRadius: BorderRadius.circular(AppTheme.radiusPill),
                child: Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryBlueSurface,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppTheme.primaryBlueBorder),
                  ),
                  child: const Icon(
                    Icons.arrow_outward_rounded,
                    size: 16,
                    color: AppTheme.primaryBlue,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // 3 Columns: Date & Time, Doctor, Medical Card (from reference mockup)
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Date & Time',
                      style: GoogleFonts.outfit(fontSize: 10.5, fontWeight: FontWeight.w500, color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      dateFormat.format(rx.date),
                      style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Doctor',
                      style: GoogleFonts.outfit(fontSize: 10.5, fontWeight: FontWeight.w500, color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 18,
                          height: 18,
                          decoration: const BoxDecoration(
                            color: AppTheme.primaryBlue,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.person_rounded, size: 12, color: Colors.white),
                        ),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            rx.doctorName,
                            style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Medical card',
                      style: GoogleFonts.outfit(fontSize: 10.5, fontWeight: FontWeight.w500, color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Active ABHA',
                      style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // Diagnosis Container
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppTheme.backgroundLavender,
              borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
              border: Border.all(color: AppTheme.borderSubtle),
            ),
            child: Row(
              children: [
                const Icon(Icons.medical_services_outlined, size: 15, color: AppTheme.primaryBlue),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    rx.diagnosis,
                    style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                  ),
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
                    fontWeight: FontWeight.w700,
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
            iconColor: AppTheme.primaryViolet,
            title: 'Latest Report',
            badge: _PillBadge(
              label: latestTest.isCompleted ? 'Completed' : 'Scheduled',
              color: latestTest.isCompleted ? AppTheme.successGreen : AppTheme.warningAmber,
              bg: latestTest.isCompleted ? AppTheme.successSurface : AppTheme.warningSurface,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: AppTheme.primaryBlueSurface,
                  borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                  border: Border.all(color: AppTheme.primaryBlueBorder),
                ),
                child: const Icon(Icons.science_outlined, color: AppTheme.primaryBlue, size: 22),
              ),
              const SizedBox(width: 10),
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
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.backgroundLavender,
                borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                border: Border.all(color: AppTheme.borderSubtle),
              ),
              child: Text(
                latestTest.reportSummary!,
                maxLines: 2,
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
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryBlue,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppTheme.radiusPill),
                ),
              ),
              child: const Text('View Report'),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Shared Reusable Sub-Widgets ─────────────────────────────────────────────

class _FrostedStatCard extends StatelessWidget {
  final String title;
  final String value;
  final String unit;
  final IconData icon;
  final Color iconColor;

  const _FrostedStatCard({
    required this.title,
    required this.value,
    required this.unit,
    required this.icon,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.22),
          width: 1.2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: GoogleFonts.outfit(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textOnDarkMuted,
                ),
              ),
              Icon(icon, size: 16, color: iconColor),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              letterSpacing: -0.4,
            ),
          ),
          Text(
            unit,
            style: GoogleFonts.outfit(
              fontSize: 10.5,
              fontWeight: FontWeight.w500,
              color: AppTheme.textOnDarkSubtle,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final Widget child;
  final Color? borderColor;

  const _SectionCard({required this.child, this.borderColor});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
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
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            title,
            style: GoogleFonts.outfit(
              fontSize: 14.5,
              fontWeight: FontWeight.w800,
              fontStyle: FontStyle.italic,
              color: AppTheme.textPrimary,
            ),
          ),
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

  const _PillBadge({required this.label, required this.color, required this.bg});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppTheme.radiusPill),
        border: Border.all(color: color.withValues(alpha: 0.25), width: 1),
      ),
      child: Text(label, style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
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
        padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 4),
        decoration: BoxDecoration(
          color: hasCount ? bg : AppTheme.surfaceMuted,
          borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
          border: Border.all(
            color: hasCount ? color.withValues(alpha: 0.3) : AppTheme.borderSubtle,
            width: 1.2,
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: hasCount ? color : AppTheme.textLight),
            const SizedBox(height: 3),
            Text(
              label,
              style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w700, color: hasCount ? color : AppTheme.textLight),
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
