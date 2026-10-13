import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../models/medication.dart';
import '../theme/app_theme.dart';
import '../screens/medical_history/medication_detail_sheet.dart';
import 'status_chip.dart';

class MedicationCard extends StatelessWidget {
  final Medication medication;
  final bool showDoctorInfo;
  final VoidCallback? onTap;

  const MedicationCard({
    super.key,
    required this.medication,
    this.showDoctorInfo = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final med = medication;
    final dateFormat = DateFormat('dd MMM yyyy');

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        border: Border.all(
          color: med.isActive ? AppTheme.primaryBlueBorder : AppTheme.borderSubtle,
          width: 1,
        ),
        boxShadow: AppTheme.cardShadow,
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        onTap: onTap ?? () => MedicationDetailSheet.show(context, med),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Row: Icon, Name, Strength, and Status
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: med.isActive
                          ? AppTheme.primaryBlueSurface
                          : AppTheme.surfaceMuted,
                      borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                    ),
                    child: Icon(
                      Icons.medication_rounded,
                      color: med.isActive
                          ? AppTheme.primaryBlue
                          : AppTheme.textMuted,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                med.name,
                                style: GoogleFonts.outfit(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.textPrimary,
                                  letterSpacing: -0.2,
                                ),
                              ),
                            ),
                            StatusChip(
                              label: med.isActive ? 'Active' : 'Past Rx',
                              variant: med.isActive
                                  ? ChipVariant.emerald
                                  : ChipVariant.slate,
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Strength: ${med.strength} • Dosage: ${med.dosage}',
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
              const SizedBox(height: 12),

              // Visual Schedule & Sticker Packaging Indicators
              _buildScheduleAndStickerRow(med),

              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 10),

              // Timing & Frequency Row
              Row(
                children: [
                  Expanded(
                    child: _buildInfoItem(
                      icon: Icons.access_time_rounded,
                      label: 'Timing',
                      value: med.timing,
                    ),
                  ),
                  Expanded(
                    child: _buildInfoItem(
                      icon: Icons.repeat_rounded,
                      label: 'Frequency',
                      value: med.frequency,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Meal & Duration Row
              Row(
                children: [
                  Expanded(
                    child: _buildInfoItem(
                      icon: Icons.restaurant_rounded,
                      label: 'Take',
                      value: med.mealInstructionDisplay,
                    ),
                  ),
                  Expanded(
                    child: _buildInfoItem(
                      icon: Icons.calendar_today_rounded,
                      label: 'Duration',
                      value: med.duration,
                    ),
                  ),
                ],
              ),

              // Optional Doctor & Prescribed Date Info (For Medical History Screen)
              if (showDoctorInfo) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: _buildInfoItem(
                        icon: Icons.person_outline_rounded,
                        label: 'Prescribed By',
                        value: med.prescribingDoctor,
                      ),
                    ),
                    Expanded(
                      child: _buildInfoItem(
                        icon: Icons.event_note_rounded,
                        label: 'Rx Date',
                        value: dateFormat.format(med.prescribedDate),
                      ),
                    ),
                  ],
                ),
              ],

              // Clinical Instructions / Advice Preview
              if (med.clinicalNotes != null) ...[
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryBlueSurface,
                    borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                    border: Border.all(color: AppTheme.primaryBlueBorder),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.info_outline_rounded,
                        size: 14,
                        color: AppTheme.primaryBlue,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          med.clinicalNotes!,
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            color: AppTheme.textSecondary,
                            height: 1.35,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    'Details',
                    style: GoogleFonts.outfit(
                      fontSize: 11,
                      color: AppTheme.primaryBlue,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(
                    Icons.arrow_forward_ios_rounded,
                    size: 10,
                    color: AppTheme.primaryBlue,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 14, color: AppTheme.textMuted),
        const SizedBox(width: 6),
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
                  color: AppTheme.textPrimary,
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

  Widget _buildScheduleAndStickerRow(Medication med) {
    Color stickerColor;
    Color stickerBg;
    switch (med.stickerColor?.toLowerCase()) {
      case 'blue':
        stickerColor = AppTheme.stickerBlue;
        stickerBg = const Color(0xFFEFF6FF);
        break;
      case 'red':
        stickerColor = AppTheme.stickerRed;
        stickerBg = const Color(0xFFFEF2F2);
        break;
      case 'amber':
      case 'yellow':
        stickerColor = AppTheme.stickerAmber;
        stickerBg = const Color(0xFFFFFBEB);
        break;
      case 'green':
        stickerColor = AppTheme.stickerGreen;
        stickerBg = const Color(0xFFECFDF5);
        break;
      case 'purple':
        stickerColor = AppTheme.stickerPurple;
        stickerBg = const Color(0xFFF5F3FF);
        break;
      case 'orange':
        stickerColor = AppTheme.stickerOrange;
        stickerBg = const Color(0xFFFFF7ED);
        break;
      case 'pink':
        stickerColor = AppTheme.stickerPink;
        stickerBg = const Color(0xFFFDF2F8);
        break;
      default:
        stickerColor = AppTheme.primaryBlue;
        stickerBg = AppTheme.primaryBlueSurface;
    }

    return Wrap(
      spacing: 6,
      runSpacing: 6,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        if (med.isMorning)
          _buildScheduleChip(
            icon: Icons.wb_sunny_rounded,
            label: 'Morning',
            color: const Color(0xFFD97706),
            bg: const Color(0xFFFFFBEB),
          ),
        if (med.isAfternoon)
          _buildScheduleChip(
            icon: Icons.wb_cloudy_rounded,
            label: 'Afternoon',
            color: const Color(0xFF2563EB),
            bg: const Color(0xFFEFF6FF),
          ),
        if (med.isNight)
          _buildScheduleChip(
            icon: Icons.nightlight_round,
            label: 'Night',
            color: const Color(0xFF4338CA),
            bg: const Color(0xFFEEF2FF),
          ),
        if (med.stickerColor != null)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: stickerBg,
              borderRadius: BorderRadius.circular(AppTheme.radiusPill),
              border: Border.all(color: stickerColor.withValues(alpha: 0.35)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: stickerColor,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  med.stickerColorDisplay,
                  style: GoogleFonts.outfit(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: stickerColor,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildScheduleChip({
    required IconData icon,
    required String label,
    required Color color,
    required Color bg,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
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
}
