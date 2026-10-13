import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

class HelpAboutDialog extends StatelessWidget {
  const HelpAboutDialog({super.key});

  static void show(BuildContext context) {
    showDialog(context: context, builder: (context) => const HelpAboutDialog());
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: AppTheme.backgroundWhite,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppTheme.primaryBlueSurface,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.health_and_safety_rounded,
              color: AppTheme.primaryBlue,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'About CuraLink',
                  style: GoogleFonts.outfit(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimary,
                  ),
                ),
                Text(
                  'Patient Healthcare Portal',
                  style: GoogleFonts.outfit(
                    fontSize: 11.5,
                    color: AppTheme.primaryBlue,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'CuraLink is an accessible patient healthcare portal designed to help patients understand prescriptions, track medications, view diagnostic reports, and manage clinical care plans.',
              style: GoogleFonts.outfit(
                fontSize: 12.5,
                color: AppTheme.textSecondary,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.primaryBlueSurface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.primaryBlueBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'DEMONSTRATION & ARCHITECTURE STATUS',
                    style: GoogleFonts.outfit(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.primaryBlue,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '• Stage: Frontend-only with typed data models & repository pattern.\n'
                    '• Data: Realistic fictional demonstration records (Lakshmi Devi & Rajesh Sharma).\n'
                    '• Security: No real patient credentials, passwords, or external servers connected.\n'
                    '• Standards: ABHA / ABDM demographic schemas prepared for future backend link.',
                    style: GoogleFonts.outfit(
                      fontSize: 11.5,
                      color: AppTheme.textPrimary,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      actions: [
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryBlue,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppTheme.radiusPill),
            ),
          ),
          onPressed: () => Navigator.pop(context),
          child: Text(
            'Understood',
            style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
          ),
        ),
      ],
    );
  }
}
