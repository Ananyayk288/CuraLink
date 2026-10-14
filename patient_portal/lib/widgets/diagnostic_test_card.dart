import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../models/diagnostic_test.dart';
import '../theme/app_theme.dart';
import '../screens/scan_test_history/diagnostic_report_detail_screen.dart';
import 'status_chip.dart';

class DiagnosticTestCard extends StatelessWidget {
  final DiagnosticTest test;
  final String? prescriptionRef;

  const DiagnosticTestCard({
    super.key,
    required this.test,
    this.prescriptionRef,
  });

  void _openDetail(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => DiagnosticReportDetailScreen(test: test),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd MMM yyyy');

    IconData icon;
    Color iconColor;
    Color iconBg;

    switch (test.category) {
      case TestCategory.diagnosticScan:
        icon = Icons.scanner_rounded;
        iconColor = AppTheme.primaryBlue;
        iconBg = AppTheme.primaryBlueSurface;
        break;
      case TestCategory.labTest:
        icon = Icons.biotech_rounded;
        iconColor = AppTheme.primaryBlueDark;
        iconBg = AppTheme.primaryBlueSurface;
        break;
      case TestCategory.cardiac:
        icon = Icons.monitor_heart_rounded;
        iconColor = AppTheme.errorRed;
        iconBg = AppTheme.errorSurface;
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        border: Border.all(color: AppTheme.borderSubtle),
        boxShadow: AppTheme.cardShadow,
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        onTap: () => _openDetail(context),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Row: Icon, Title, and Category Chip
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: iconBg,
                      borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                    ),
                    child: Icon(icon, color: iconColor, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          test.testName,
                          style: GoogleFonts.outfit(
                            fontSize: 15.5,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textPrimary,
                            letterSpacing: -0.2,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          test.categoryDisplay,
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            color: AppTheme.textMuted,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  StatusChip(
                    label: test.statusDisplay,
                    variant: test.isCompleted
                        ? ChipVariant.emerald
                        : test.status == TestStatus.scheduled
                        ? ChipVariant.blue
                        : ChipVariant.amber,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 10),

              // Metadata: Ordering Doctor, Center, Date
              Row(
                children: [
                  Expanded(
                    child: _buildMeta(
                      Icons.person_outline_rounded,
                      'Doctor',
                      test.orderingDoctor,
                    ),
                  ),
                  Expanded(
                    child: _buildMeta(
                      Icons.event_rounded,
                      test.isCompleted ? 'Date' : 'Target',
                      test.completedDate != null
                          ? dateFormat.format(test.completedDate!)
                          : test.scheduledDate != null
                          ? dateFormat.format(test.scheduledDate!)
                          : dateFormat.format(test.orderedDate),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              Row(
                children: [
                  Expanded(
                    child: _buildMeta(
                      Icons.location_on_outlined,
                      'Facility',
                      test.diagnosticCenter,
                    ),
                  ),
                  if (prescriptionRef != null)
                    Expanded(
                      child: _buildMeta(
                        Icons.receipt_long_outlined,
                        'Linked Rx',
                        prescriptionRef!,
                      ),
                    ),
                ],
              ),

              const SizedBox(height: 10),

              // Short Result Summary preview if present in existing data
              if (test.hasReport && test.reportSummary != null) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.successSurface,
                    borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                    border: Border.all(color: AppTheme.successBorder),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.check_circle_rounded,
                        size: 15,
                        color: AppTheme.successGreen,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          test.reportSummary!,
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            color: AppTheme.textPrimary,
                            height: 1.35,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
              ] else if (!test.hasReport) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.warningSurface,
                    borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                    border: Border.all(color: AppTheme.warningBorder),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.pending_actions_rounded,
                        size: 14,
                        color: AppTheme.warningAmber,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          test.status == TestStatus.scheduled
                              ? 'Scheduled'
                              : 'Processing',
                          style: GoogleFonts.outfit(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.warningAmber,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
              ],

              // Action Row
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (test.hasReport) ...[
                    TextButton.icon(
                      icon: const Icon(Icons.visibility_outlined, size: 15),
                      label: const Text('View Report'),
                      style: TextButton.styleFrom(
                        foregroundColor: AppTheme.primaryBlue,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        textStyle: GoogleFonts.outfit(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      onPressed: () => _openDetail(context),
                    ),
                  ] else ...[
                    TextButton.icon(
                      icon: const Icon(Icons.info_outline_rounded, size: 15),
                      label: const Text('Status'),
                      style: TextButton.styleFrom(
                        foregroundColor: AppTheme.warningAmber,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        textStyle: GoogleFonts.outfit(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      onPressed: () => _openDetail(context),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMeta(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 14, color: AppTheme.textMuted),
        const SizedBox(width: 5),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.outfit(
                  fontSize: 10.5,
                  color: AppTheme.textMuted,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                value,
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  color: AppTheme.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
