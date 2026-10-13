import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../models/diagnostic_test.dart';
import '../../theme/app_theme.dart';
import '../../widgets/demo_banner.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/report_preview_dialog.dart';

/// Dedicated full-page screen displaying complete diagnostic test findings,
/// clinical impression, lab values, and report documentation.
class DiagnosticReportDetailScreen extends StatelessWidget {
  final DiagnosticTest test;

  const DiagnosticReportDetailScreen({super.key, required this.test});

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd MMM yyyy');
    final isCompleted = test.isCompleted;

    return Scaffold(
      backgroundColor: AppTheme.backgroundCream,
      appBar: AppBar(
        title: Text(
          'Diagnostic Test Details',
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
          ),
        ),
        actions: [
          if (test.hasReport)
            IconButton(
              icon: const Icon(Icons.open_in_new_rounded, size: 20),
              tooltip: 'Quick Preview Dialog',
              onPressed: () => ReportPreviewDialog.show(context, test),
            ),
        ],
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: Column(
            children: [
              const DemoBanner(),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Header Card
                    _buildHeaderCard(context, dateFormat, isCompleted),
                    const SizedBox(height: 16),

                    // Test Metadata Details Card
                    _buildMetadataCard(dateFormat),
                    const SizedBox(height: 16),

                    // Key Clinical Findings
                    if (test.keyFindings != null &&
                        test.keyFindings!.isNotEmpty) ...[
                      _buildKeyFindingsCard(),
                      const SizedBox(height: 16),
                    ],

                    // Full Report Summary / Clinical Impression
                    if (isCompleted && test.reportSummary != null) ...[
                      _buildReportSummaryCard(),
                      const SizedBox(height: 16),
                    ],

                    // Attached Document / File Card
                    if (test.hasReport && test.reportFileName != null) ...[
                      _buildAttachmentCard(context),
                      const SizedBox(height: 16),
                    ],

                    // Pending / Upcoming Notice if not completed
                    if (!isCompleted) ...[
                      _buildPendingNoticeCard(dateFormat),
                      const SizedBox(height: 16),
                    ],

                    // Clinical Disclaimer Footer
                    _buildDisclaimerCard(),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderCard(
    BuildContext context,
    DateFormat dateFormat,
    bool isCompleted,
  ) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        border: Border.all(
          color: isCompleted ? AppTheme.primaryBlueBorder : AppTheme.warningBorder,
          width: 1.2,
        ),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: isCompleted
                      ? AppTheme.primaryBlueSurface
                      : AppTheme.warningSurface,
                  borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                ),
                child: Icon(
                  _getCategoryIcon(test.category),
                  color: isCompleted
                      ? AppTheme.primaryBlue
                      : AppTheme.warningAmber,
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      test.testName,
                      style: GoogleFonts.outfit(
                        fontSize: 17.5,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textPrimary,
                        letterSpacing: -0.2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      test.categoryDisplay,
                      style: GoogleFonts.outfit(
                        fontSize: 13,
                        color: AppTheme.primaryBlue,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(height: 1),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              StatusChip(
                label: test.statusDisplay,
                variant: isCompleted ? ChipVariant.emerald : ChipVariant.amber,
              ),
              Text(
                isCompleted && test.completedDate != null
                    ? 'Conducted: ${dateFormat.format(test.completedDate!)}'
                    : 'Target: ${dateFormat.format(test.targetDate)}',
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textMuted,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetadataCard(DateFormat dateFormat) {
    return Container(
      padding: const EdgeInsets.all(18),
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
            children: [
              Container(
                width: 4,
                height: 16,
                decoration: BoxDecoration(
                  color: AppTheme.primaryBlue,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'Clinical Order & Facility Information',
                style: GoogleFonts.outfit(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _buildInfoRow(
            icon: Icons.person_outline_rounded,
            label: 'Ordering Physician',
            value: test.orderingDoctor,
          ),
          const SizedBox(height: 10),
          _buildInfoRow(
            icon: Icons.local_hospital_outlined,
            label: 'Diagnostic Facility',
            value: test.diagnosticCenter,
          ),
          const SizedBox(height: 10),
          _buildInfoRow(
            icon: Icons.calendar_today_outlined,
            label: 'Order Date',
            value: dateFormat.format(test.orderedDate),
          ),
          const SizedBox(height: 10),
          _buildInfoRow(
            icon: Icons.receipt_long_outlined,
            label: 'Prescription Reference',
            value: 'Linked Clinical Order',
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppTheme.textMuted),
        const SizedBox(width: 10),
        SizedBox(
          width: 130,
          child: Text(
            label,
            style: GoogleFonts.outfit(
              fontSize: 12,
              color: AppTheme.textMuted,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 12.5,
              color: AppTheme.textPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildKeyFindingsCard() {
    final findings = test.keyFindings!;
    return Container(
      padding: const EdgeInsets.all(18),
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
            children: [
              Container(
                width: 4,
                height: 16,
                decoration: BoxDecoration(
                  color: AppTheme.primaryBlue,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'Key Clinical Lab Findings',
                style: GoogleFonts.outfit(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            decoration: BoxDecoration(
              color: AppTheme.surfaceMuted,
              borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
            ),
            child: Column(
              children: findings.entries.map((entry) {
                return Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        flex: 5,
                        child: Text(
                          entry.key,
                          style: GoogleFonts.outfit(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 6,
                        child: Text(
                          entry.value,
                          textAlign: TextAlign.end,
                          style: GoogleFonts.outfit(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.primaryBlue,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReportSummaryCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppTheme.primaryBlueSurface,
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        border: Border.all(color: AppTheme.primaryBlueBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.assignment_rounded,
                size: 18,
                color: AppTheme.primaryBlue,
              ),
              const SizedBox(width: 8),
              Text(
                'Physician Diagnostic Impression',
                style: GoogleFonts.outfit(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.primaryBlue,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            test.reportSummary!,
            style: GoogleFonts.outfit(
              fontSize: 13,
              height: 1.5,
              color: AppTheme.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttachmentCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        border: Border.all(color: AppTheme.borderSubtle),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.errorSurface,
              borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
            ),
            child: const Icon(
              Icons.picture_as_pdf_rounded,
              color: AppTheme.errorRed,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  test.reportFileName!,
                  style: GoogleFonts.outfit(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  'Signed Clinical Diagnostic Document',
                  style: GoogleFonts.outfit(fontSize: 11, color: AppTheme.textMuted),
                ),
              ],
            ),
          ),
          ElevatedButton.icon(
            icon: const Icon(Icons.visibility_outlined, size: 14),
            label: const Text('View Report'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryBlue,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppTheme.radiusPill),
              ),
              textStyle: GoogleFonts.outfit(
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
              ),
            ),
            onPressed: () => ReportPreviewDialog.show(context, test),
          ),
        ],
      ),
    );
  }

  Widget _buildPendingNoticeCard(DateFormat dateFormat) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.warningSurface,
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        border: Border.all(color: AppTheme.warningBorder),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.hourglass_top_rounded,
            color: AppTheme.warningAmber,
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Investigation Pending Conduction',
                  style: GoogleFonts.outfit(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.warningAmber,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  'This diagnostic order is scheduled for ${dateFormat.format(test.targetDate)} at ${test.diagnosticCenter}. '
                  'Clinical findings and laboratory report will appear once conducted and verified by the attending physician.',
                  style: GoogleFonts.outfit(
                    fontSize: 11.5,
                    color: AppTheme.textSecondary,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDisclaimerCard() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.surfaceMuted,
        borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.verified_user_outlined,
            size: 14,
            color: AppTheme.textMuted,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Diagnostic records are retrieved for patient viewing. For clinical interpretations, consult your attending doctor.',
              style: GoogleFonts.outfit(
                fontSize: 11,
                color: AppTheme.textMuted,
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    );
  }

  IconData _getCategoryIcon(TestCategory category) {
    switch (category) {
      case TestCategory.cardiac:
        return Icons.monitor_heart_rounded;
      case TestCategory.diagnosticScan:
        return Icons.scanner_rounded;
      case TestCategory.labTest:
        return Icons.science_rounded;
    }
  }
}
