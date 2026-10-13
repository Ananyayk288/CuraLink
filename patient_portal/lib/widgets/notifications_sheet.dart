import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

class NotificationsSheet extends StatelessWidget {
  const NotificationsSheet({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const NotificationsSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final List<Map<String, dynamic>> notifications = [
      {
        'title': 'Active Prescription Regimen in Progress',
        'subtitle':
            'Prescription RX-2026-1049 is active. Remember to maintain regular morning and bedtime doses as prescribed by Dr. Arvind Kumar.',
        'time': 'Today, 08:00 AM',
        'icon': Icons.medication_rounded,
        'color': AppTheme.primaryBlue,
        'bg': AppTheme.primaryBlueSurface,
        'priority': 'CLINICAL ADVICE',
      },
      {
        'title': 'Upcoming 2D Echocardiogram Scheduled',
        'subtitle':
            'Appointment confirmed for 28 Oct 2026 at 11:00 AM in St. John’s Cardiac Imaging Suite 2. Please carry prior ECG reports.',
        'time': '2 days ago',
        'icon': Icons.calendar_month_rounded,
        'color': AppTheme.primaryBlue,
        'bg': AppTheme.primaryBlueSurface,
        'priority': 'APPOINTMENT',
      },
      {
        'title': 'Documented Medication Allergy Alert',
        'subtitle':
            'Sulfa Antibiotics and Mild Penicillin Sensitivity recorded on your clinical profile. Healthcare staff are notified on every order.',
        'time': 'Active Profile',
        'icon': Icons.shield_outlined,
        'color': AppTheme.warningAmber,
        'bg': AppTheme.warningSurface,
        'priority': 'SAFETY ALERT',
      },
      {
        'title': 'Lipid Profile Test Report Verified',
        'subtitle':
            'Comprehensive Lipid Profile Panel completed on 05 Oct 2026. Cholesterol targets well controlled on current statin regimen.',
        'time': '05 Oct 2026',
        'icon': Icons.assignment_turned_in_rounded,
        'color': AppTheme.successGreen,
        'bg': AppTheme.successSurface,
        'priority': 'LAB REPORT',
      },
    ];

    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Drag handle
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppTheme.borderMedium,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.notifications_active_rounded,
                        color: AppTheme.primaryBlue,
                        size: 22,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Healthcare Updates',
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'Clinical alerts, test notifications, and prescription updates',
                style: GoogleFonts.outfit(fontSize: 12.5, color: AppTheme.textMuted),
              ),
              const SizedBox(height: 14),
              const Divider(),
              const SizedBox(height: 10),

              ...notifications.map(
                (n) => Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppTheme.backgroundWhite,
                    borderRadius: BorderRadius.circular(AppTheme.radiusCard),
                    border: Border.all(color: AppTheme.borderSubtle),
                    boxShadow: AppTheme.cardShadow,
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: n['bg'] as Color,
                          borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                        ),
                        child: Icon(
                          n['icon'] as IconData,
                          size: 18,
                          color: n['color'] as Color,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: n['bg'] as Color,
                                    borderRadius: BorderRadius.circular(AppTheme.radiusPill),
                                  ),
                                  child: Text(
                                    n['priority'] as String,
                                    style: GoogleFonts.outfit(
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.w800,
                                      color: n['color'] as Color,
                                      letterSpacing: 0.3,
                                    ),
                                  ),
                                ),
                                Text(
                                  n['time'] as String,
                                  style: GoogleFonts.outfit(
                                    fontSize: 11,
                                    color: AppTheme.textLight,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              n['title'] as String,
                              style: GoogleFonts.outfit(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              n['subtitle'] as String,
                              style: GoogleFonts.outfit(
                                fontSize: 11.5,
                                color: AppTheme.textSecondary,
                                height: 1.35,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.primaryBlue,
                    side: const BorderSide(color: AppTheme.primaryBlueBorder),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppTheme.radiusPill),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onPressed: () => Navigator.pop(context),
                  child: Text(
                    'Close Notifications',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
