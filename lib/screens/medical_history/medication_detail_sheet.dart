import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../models/medication.dart';
import '../../theme/app_theme.dart';
import '../../widgets/status_chip.dart';

class MedicationDetailSheet extends StatelessWidget {
  final Medication medication;

  const MedicationDetailSheet({super.key, required this.medication});

  static Future<void> show(BuildContext context, Medication medication) {
    return showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      constraints: const BoxConstraints(maxWidth: 680),
      builder: (context) => MedicationDetailSheet(medication: medication),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd MMMM yyyy');

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.9,
      ),
      decoration: const BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: AppTheme.borderMedium,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Top Header: Name and Active badge
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: medication.isActive
                          ? AppTheme.primaryBlueSurface
                          : AppTheme.surfaceMuted,
                      borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                    ),
                    child: Icon(
                      Icons.medication_rounded,
                      color: medication.isActive
                          ? AppTheme.primaryBlue
                          : AppTheme.textMuted,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          medication.name,
                          style: GoogleFonts.outfit(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${medication.strength} · ${medication.dosage}',
                          style: GoogleFonts.outfit(
                            fontSize: 13,
                            color: AppTheme.primaryBlue,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                  StatusChip(
                    label: medication.isActive
                        ? 'Active Regimen'
                        : 'Past Prescription',
                    variant: medication.isActive
                        ? ChipVariant.emerald
                        : ChipVariant.slate,
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Time-of-day Schedule & Packaging Sticker Badges
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  if (medication.isMorning)
                    _buildPill(
                      Icons.wb_sunny_rounded,
                      'Morning Schedule',
                      const Color(0xFFD97706),
                      const Color(0xFFFFFBEB),
                    ),
                  if (medication.isAfternoon)
                    _buildPill(
                      Icons.wb_cloudy_rounded,
                      'Afternoon Schedule',
                      const Color(0xFF2563EB),
                      const Color(0xFFEFF6FF),
                    ),
                  if (medication.isNight)
                    _buildPill(
                      Icons.nightlight_round,
                      'Night Schedule',
                      const Color(0xFF4338CA),
                      const Color(0xFFEEF2FF),
                    ),
                  if (medication.stickerColor != null)
                    _buildStickerPill(medication.stickerColor!),
                ],
              ),

              if (medication.stickerColor != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryBlueSurface,
                    borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                    border: Border.all(color: AppTheme.primaryBlueBorder),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.label_outline_rounded,
                        size: 16,
                        color: AppTheme.primaryBlue,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '${medication.stickerColor} sticker packaging for visual identification.',
                          style: GoogleFonts.outfit(
                            fontSize: 11.5,
                            color: AppTheme.textSecondary,
                            height: 1.35,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 14),
              const Divider(),
              const SizedBox(height: 14),

              // Clinical Prescription Schedule Details
              Text(
                'DOSAGE & TIMING',
                style: GoogleFonts.outfit(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textMuted,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 8),

              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceMuted,
                  borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                ),
                child: Column(
                  children: [
                    _buildDetailRow('Timing', medication.timing),
                    const SizedBox(height: 8),
                    _buildDetailRow('Frequency', medication.frequency),
                    const SizedBox(height: 8),
                    _buildDetailRow(
                      'Meal Instruction',
                      medication.mealInstructionDisplay,
                    ),
                    const SizedBox(height: 8),
                    _buildDetailRow('Duration', medication.duration),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Prescribing Physician Information
              Text(
                'PRESCRIBED BY',
                style: GoogleFonts.outfit(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textMuted,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTheme.backgroundWhite,
                  borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                  border: Border.all(color: AppTheme.borderSubtle),
                ),
                child: Column(
                  children: [
                    _buildDetailRow(
                      'Doctor',
                      medication.prescribingDoctor,
                    ),
                    const SizedBox(height: 8),
                    _buildDetailRow(
                      'Date',
                      dateFormat.format(medication.prescribedDate),
                    ),
                    const SizedBox(height: 8),
                    _buildDetailRow(
                      'Rx Ref',
                      medication.prescriptionId,
                    ),
                  ],
                ),
              ),

              if (medication.clinicalNotes != null) ...[
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryBlueSurface,
                    borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                    border: Border.all(color: AppTheme.primaryBlueBorder),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.info_outline,
                        size: 16,
                        color: AppTheme.primaryBlue,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          medication.clinicalNotes!,
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            color: AppTheme.textSecondary,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 18),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryBlue,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppTheme.radiusPill),
                    ),
                  ),
                  onPressed: () => Navigator.pop(context),
                  child: Text(
                    'Close',
                    style: GoogleFonts.outfit(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 145,
            child: Text(
              label,
              style: GoogleFonts.outfit(
                fontSize: 12.5,
                color: AppTheme.textMuted,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.outfit(
                fontSize: 12.5,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPill(IconData icon, String label, Color color, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppTheme.radiusPill),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: GoogleFonts.outfit(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStickerPill(String stickerColorName) {
    Color color;
    Color bg;
    switch (stickerColorName.toLowerCase()) {
      case 'blue':
        color = AppTheme.stickerBlue;
        bg = const Color(0xFFEFF6FF);
        break;
      case 'red':
        color = AppTheme.stickerRed;
        bg = const Color(0xFFFEF2F2);
        break;
      case 'amber':
      case 'yellow':
        color = AppTheme.stickerAmber;
        bg = const Color(0xFFFFFBEB);
        break;
      case 'green':
        color = AppTheme.stickerGreen;
        bg = const Color(0xFFECFDF5);
        break;
      case 'purple':
        color = AppTheme.stickerPurple;
        bg = const Color(0xFFF5F3FF);
        break;
      case 'orange':
        color = AppTheme.stickerOrange;
        bg = const Color(0xFFFFF7ED);
        break;
      case 'pink':
        color = AppTheme.stickerPink;
        bg = const Color(0xFFFDF2F8);
        break;
      default:
        color = AppTheme.primaryBlue;
        bg = AppTheme.primaryBlueSurface;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppTheme.radiusPill),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            '$stickerColorName Sticker Packaging',
            style: GoogleFonts.outfit(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
