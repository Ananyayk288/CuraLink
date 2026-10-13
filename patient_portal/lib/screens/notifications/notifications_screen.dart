import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/app_state.dart';
import '../../theme/app_theme.dart';
import '../../widgets/appointment_card.dart';
import '../../widgets/demo_banner.dart';
import '../prescription_history/prescription_detail_screen.dart';
import '../scan_test_history/diagnostic_report_detail_screen.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  String _selectedFilter = 'All';

  final List<Map<String, dynamic>> _allNotifications = [
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
    final filtered = _allNotifications.where((n) {
      if (_selectedFilter == 'All') return true;
      return n['category'] == _selectedFilter;
    }).toList();

    return Scaffold(
      backgroundColor: AppTheme.backgroundCream,
      appBar: AppBar(
        title: Text(
          'Alerts',
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
          ),
        ),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: Column(
            children: [
              const DemoBanner(),

              // Filter Chips
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 10,
                ),
                color: AppTheme.backgroundWhite,
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip('All'),
                      const SizedBox(width: 8),
                      _buildFilterChip('Clinical'),
                      const SizedBox(width: 8),
                      _buildFilterChip('Appointments'),
                      const SizedBox(width: 8),
                      _buildFilterChip('Tests'),
                    ],
                  ),
                ),
              ),
              const Divider(height: 1),

              // Notifications List
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: filtered.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final item = filtered[index];
                    return _buildNotificationCard(context, appState, item);
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label) {
    final isSelected = _selectedFilter == label;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedFilter = label;
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

  Widget _buildNotificationCard(
    BuildContext context,
    AppState appState,
    Map<String, dynamic> item,
  ) {
    final Color color = item['color'] as Color;
    final Color bg = item['bg'] as Color;
    final String? actionLabel = item['actionLabel'] as String?;
    final String? actionType = item['actionType'] as String?;

    return Container(
      padding: const EdgeInsets.all(16),
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
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
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
          if (actionLabel != null && actionType != null) ...[
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
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  textStyle: GoogleFonts.outfit(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                onPressed: () {
                  if (actionType == 'test') {
                    final testId = item['testId'] as String?;
                    final test = appState.diagnosticTests.firstWhere(
                      (t) => t.id == testId,
                      orElse: () => appState.diagnosticTests.first,
                    );
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) =>
                            DiagnosticReportDetailScreen(test: test),
                      ),
                    );
                  } else if (actionType == 'rx') {
                    final rx = appState.latestPrescription;
                    if (rx != null) {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) =>
                              PrescriptionDetailScreen(prescription: rx),
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
                        builder: (ctx) => Container(
                          padding: const EdgeInsets.all(20),
                          decoration: const BoxDecoration(
                            color: AppTheme.backgroundWhite,
                            borderRadius: BorderRadius.vertical(
                              top: Radius.circular(20),
                            ),
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Confirmed Appointment Details',
                                    style: GoogleFonts.outfit(
                                      fontSize: 15,
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
                },
              ),
            ),
          ],
        ],
      ),
    );
  }
}
