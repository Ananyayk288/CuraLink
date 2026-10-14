import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../models/appointment.dart';
import '../theme/app_theme.dart';
import 'status_chip.dart';

class AppointmentCard extends StatelessWidget {
  final Appointment appointment;

  const AppointmentCard({super.key, required this.appointment});

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('EEE, dd MMM yyyy • hh:mm a');
    final isConfirmed = appointment.isConfirmed;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isConfirmed ? AppTheme.backgroundWhite : AppTheme.warningSurface,
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        border: Border.all(
          color: isConfirmed ? AppTheme.primaryBlueBorder : AppTheme.warningBorder,
          width: 1,
        ),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isConfirmed
                        ? AppTheme.primaryBlueSurface
                        : AppTheme.warningSurface,
                    borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                  ),
                  child: Icon(
                    isConfirmed
                        ? Icons.calendar_month_rounded
                        : Icons.notification_important_rounded,
                    color: isConfirmed
                        ? AppTheme.primaryBlue
                        : AppTheme.warningAmber,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isConfirmed
                            ? 'Confirmed Hospital Appointment'
                            : 'Doctor Recommended Follow-up',
                        style: GoogleFonts.outfit(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: isConfirmed
                              ? AppTheme.primaryBlue
                              : AppTheme.warningAmber,
                        ),
                      ),
                      Text(
                        isConfirmed
                            ? 'Scheduled in Hospital OPD system'
                            : 'Recommended target timeline by attending physician',
                        style: GoogleFonts.outfit(
                          fontSize: 11,
                          color: AppTheme.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                StatusChip(
                  label: isConfirmed ? 'Confirmed' : 'Recommended',
                  icon: isConfirmed ? Icons.check_circle : Icons.schedule,
                  variant: isConfirmed
                      ? ChipVariant.emerald
                      : ChipVariant.amber,
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(),
            const SizedBox(height: 10),

            // Doctor details
            Text(
              appointment.doctorName,
              style: GoogleFonts.outfit(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              appointment.doctorSpecialty,
              style: GoogleFonts.outfit(
                fontSize: 12.5,
                color: AppTheme.primaryBlue,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              appointment.department,
              style: GoogleFonts.outfit(fontSize: 12, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 12),

            // Date & Location Info Box
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isConfirmed
                    ? AppTheme.surfaceMuted
                    : AppTheme.backgroundWhite,
                borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.access_time_rounded,
                        size: 15,
                        color: AppTheme.primaryBlue,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          dateFormat.format(appointment.dateTime),
                          style: GoogleFonts.outfit(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.location_on_rounded,
                        size: 15,
                        color: AppTheme.textMuted,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          appointment.location,
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            color: AppTheme.textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            if (appointment.clinicalReason != null) ...[
              const SizedBox(height: 10),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.notes_rounded,
                    size: 14,
                    color: AppTheme.textMuted,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Clinical Purpose: ${appointment.clinicalReason}',
                      style: GoogleFonts.outfit(
                        fontSize: 11.5,
                        color: AppTheme.textSecondary,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
