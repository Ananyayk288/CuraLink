import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_theme.dart';
import '../../widgets/demo_banner.dart';

class HelpAboutScreen extends StatelessWidget {
  const HelpAboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundCream,
      appBar: AppBar(
        title: Text(
          'About CuraLink',
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
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Brand Identity Card
                    Container(
                      padding: const EdgeInsets.all(22),
                      decoration: BoxDecoration(
                        color: AppTheme.backgroundWhite,
                        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
                        border: Border.all(
                          color: AppTheme.primaryBlueBorder,
                          width: 1.2,
                        ),
                        boxShadow: AppTheme.cardShadow,
                      ),
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: const BoxDecoration(
                              color: AppTheme.primaryBlueSurface,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.health_and_safety_rounded,
                              color: AppTheme.primaryBlue,
                              size: 40,
                            ),
                          ),
                          const SizedBox(height: 14),
                          Text(
                            'CuraLink Healthcare',
                            style: GoogleFonts.outfit(
                              fontSize: 19,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Patient Clinical Portal · Version 2.0 (Official Release)',
                            style: GoogleFonts.outfit(
                              fontSize: 12,
                              color: AppTheme.textMuted,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Section 1: Core Purpose
                    _buildSectionCard(
                      icon: Icons.lightbulb_outline_rounded,
                      title: 'About the Platform',
                      body:
                          'CuraLink is designed to bridge the communication gap between healthcare providers and patients. '
                          'It helps patients understand their prescriptions, track active medication timings, review diagnostic reports, and monitor doctor-recommended follow-ups.',
                    ),
                    const SizedBox(height: 14),

                    // Section 2: Unified Packaging System
                    _buildSectionCard(
                      icon: Icons.palette_outlined,
                      title: 'Unified Medication Packaging',
                      body:
                          'Every medicine card combines the official pharmaceutical drug name with an assigned sticker colour indicator (e.g. Blue, Red, Amber). '
                          'This ensures clear physical packaging recognition alongside exact clinical dosage, strength, and meal instructions without segregating literacy modes.',
                    ),
                    const SizedBox(height: 14),

                    // Section 3: Architecture & Security
                    _buildSectionCard(
                      icon: Icons.security_rounded,
                      title: 'Data Privacy & Architecture',
                      body:
                          'CuraLink utilizes modern clinical record architecture and secure client-side storage protocols. '
                          'All medical records and personal health data comply with digital healthcare privacy and confidentiality standards.',
                    ),
                    const SizedBox(height: 14),

                    // Section 4: ABHA Interoperability Concept
                    _buildSectionCard(
                      icon: Icons.verified_user_rounded,
                      title: 'Ayushman Bharat Digital Mission (ABDM)',
                      body:
                          'The interface is built to support future ABDM / ABHA health records integration. '
                          'Patients can seamlessly view verified hospital records from participating medical centres.',
                    ),
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

  Widget _buildSectionCard({
    required IconData icon,
    required String title,
    required String body,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
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
            padding: const EdgeInsets.all(9),
            decoration: BoxDecoration(
              color: AppTheme.primaryBlueSurface,
              borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
            ),
            child: Icon(icon, color: AppTheme.primaryBlue, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.outfit(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  body,
                  style: GoogleFonts.outfit(
                    fontSize: 12.5,
                    height: 1.45,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
