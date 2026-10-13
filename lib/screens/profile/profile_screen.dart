import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/app_state.dart';
import '../../theme/app_theme.dart';
import '../../widgets/demo_banner.dart';
import '../../widgets/notification_bell_button.dart';
import '../notifications/notifications_screen.dart';
import 'help_about_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = AppStateScope.of(context);
    final patient = appState.selectedPatient;

    if (patient == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final initials = patient.fullName
        .split(' ')
        .where((s) => s.isNotEmpty && !s.contains('.'))
        .map((s) => s[0])
        .take(2)
        .join();

    return Scaffold(
      backgroundColor: AppTheme.backgroundCream,
      appBar: AppBar(
        title: Text(
          'Patient Profile',
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
          ),
        ),
        actions: const [
          NotificationBellButton(),
          SizedBox(width: 8),
        ],
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: Column(
            children: [
              const DemoBanner(),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Patient Identity Card
                      _buildIdentityCard(context, patient, initials),
                      const SizedBox(height: 16),

                      // Clinical Health Profile Card
                      _buildClinicalProfileCard(patient),
                      const SizedBox(height: 16),

                      // Quick App Navigation Section
                      _buildNavigationSection(context, appState),
                      const SizedBox(height: 16),

                      // Patient Account Card
                      _buildPatientAccountCard(context, patient),
                      const SizedBox(height: 16),

                      // Privacy Notice
                      _buildOfflineNotice(),
                      const SizedBox(height: 24),
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

  Widget _buildIdentityCard(
    BuildContext context,
    dynamic patient,
    String initials,
  ) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        border: Border.all(color: AppTheme.primaryBlueBorder, width: 1.2),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: AppTheme.primaryBlueSurface,
                child: Text(
                  initials.isNotEmpty ? initials : 'P',
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.primaryBlue,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      patient.fullName,
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textPrimary,
                        letterSpacing: -0.2,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${patient.age} Yrs · ${patient.gender} · Blood Group: ${patient.bloodGroup}',
                      style: GoogleFonts.outfit(
                        fontSize: 12.5,
                        color: AppTheme.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Ayushman Bharat Health Account (ABHA) Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: AppTheme.primaryBlueSurface,
              borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
              border: Border.all(color: AppTheme.primaryBlueBorder),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.verified_rounded,
                  size: 20,
                  color: AppTheme.primaryBlue,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Ayushman Bharat Health Account (ABHA)',
                        style: GoogleFonts.outfit(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.primaryBlue,
                          letterSpacing: 0.3,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        patient.abhaNumber,
                        style: GoogleFonts.outfit(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textPrimary,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.successGreen,
                    borderRadius: BorderRadius.circular(AppTheme.radiusPill),
                  ),
                  child: Text(
                    'Verified',
                    style: GoogleFonts.outfit(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildClinicalProfileCard(dynamic patient) {
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
                'Clinical Profile & Emergency Data',
                style: GoogleFonts.outfit(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _buildProfileRow(
            icon: Icons.favorite_border_rounded,
            label: 'Primary Diagnosis',
            value: patient.primaryDiagnosis,
          ),
          const SizedBox(height: 10),
          _buildProfileRow(
            icon: Icons.warning_amber_rounded,
            label: 'Known Allergies',
            value: (patient.allergies as List<String>).join(', '),
          ),
          const SizedBox(height: 10),
          _buildProfileRow(
            icon: Icons.contact_phone_outlined,
            label: 'Emergency Contact',
            value: patient.emergencyContact,
          ),
          const SizedBox(height: 10),
          _buildProfileRow(
            icon: Icons.language_rounded,
            label: 'Language Preference',
            value: patient.preferredLanguage,
          ),
          const SizedBox(height: 10),
          _buildProfileRow(
            icon: Icons.phone_outlined,
            label: 'Registered Phone',
            value: patient.phoneNumber,
          ),
        ],
      ),
    );
  }

  Widget _buildProfileRow({
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
          width: 125,
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
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNavigationSection(BuildContext context, AppState appState) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        border: Border.all(color: AppTheme.borderSubtle),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        children: [
          _buildNavigationTile(
            context: context,
            icon: Icons.notifications_active_outlined,
            color: AppTheme.primaryBlue,
            bg: AppTheme.primaryBlueSurface,
            title: 'Notifications & Clinical Alerts',
            badge: Container(
              margin: const EdgeInsets.only(left: 8),
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444),
                borderRadius: BorderRadius.circular(10),
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
            subtitle:
                'Hospital appointments, allergy notices, and test updates',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const NotificationsScreen()),
              );
            },
          ),
          const Divider(height: 1, indent: 56),
          _buildNavigationTile(
            context: context,
            icon: Icons.info_outline_rounded,
            color: AppTheme.primaryBlue,
            bg: AppTheme.primaryBlueSurface,
            title: 'About CuraLink Healthcare',
            subtitle:
                'Architecture, medication packaging guide, and transparency',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const HelpAboutScreen()),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildNavigationTile({
    required BuildContext context,
    required IconData icon,
    required Color color,
    required Color bg,
    required String title,
    required String subtitle,
    Widget? badge,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        title: Row(
          children: [
            Flexible(
              child: Text(
                title,
                style: GoogleFonts.outfit(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
            ),
            ?badge,
          ],
        ),
        subtitle: Text(
          subtitle,
          style: GoogleFonts.outfit(fontSize: 11.5, color: AppTheme.textMuted),
        ),
        trailing: const Icon(
          Icons.chevron_right_rounded,
          size: 20,
          color: AppTheme.textMuted,
        ),
        onTap: onTap,
      ),
    );
  }

  Widget _buildPatientAccountCard(BuildContext context, dynamic patient) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primaryBlueSurface,
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        border: Border.all(color: AppTheme.primaryBlueBorder),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
            ),
            child: const Icon(
              Icons.verified_user_rounded,
              color: AppTheme.primaryBlue,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Verified Patient Account',
                  style: GoogleFonts.outfit(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.primaryBlue,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${patient.fullName} • ${patient.id}',
                  style: GoogleFonts.outfit(
                    fontSize: 11.5,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: AppTheme.emeraldBackground,
              borderRadius: BorderRadius.circular(AppTheme.radiusPill),
              border: Border.all(
                color: AppTheme.emeraldGreen.withValues(alpha: 0.3),
              ),
            ),
            child: Text(
              'Active',
              style: GoogleFonts.outfit(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: AppTheme.emeraldGreen,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOfflineNotice() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.surfaceMuted,
        borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.shield_outlined, size: 14, color: AppTheme.textMuted),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'All clinical health data, diagnostic records, and personal health details are securely encrypted and protected in accordance with digital healthcare privacy standards.',
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
}
