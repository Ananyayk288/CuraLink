import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/app_state.dart';
import '../../models/medication.dart';
import '../../theme/app_theme.dart';
import '../../widgets/demo_banner.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/medication_card.dart';

class DailyMedicationScheduleScreen extends StatefulWidget {
  const DailyMedicationScheduleScreen({super.key});

  @override
  State<DailyMedicationScheduleScreen> createState() =>
      _DailyMedicationScheduleScreenState();
}

class _DailyMedicationScheduleScreenState
    extends State<DailyMedicationScheduleScreen> {
  String _selectedFilter = 'All'; // All, Morning, Afternoon, Evening, Night

  @override
  Widget build(BuildContext context) {
    final appState = AppStateScope.of(context);
    final patient = appState.selectedPatient;
    final activeMeds = appState.medications.where((m) => m.isActive).toList();

    // Group active medications by timing supported in mock data
    final morningMeds = activeMeds.where((m) => m.isMorning).toList();
    final afternoonMeds = activeMeds.where((m) => m.isAfternoon).toList();
    final eveningMeds = activeMeds.where((m) => m.isEvening).toList();
    final nightMeds = activeMeds.where((m) => m.isNight).toList();

    return Scaffold(
      backgroundColor: AppTheme.backgroundCream,
      appBar: AppBar(
        title: Text(
          'Daily Medication Schedule',
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

              // Daily Schedule Guidance Notice
              Container(
                margin: const EdgeInsets.fromLTRB(16, 12, 16, 8),
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
                      Icons.schedule_rounded,
                      size: 16,
                      color: AppTheme.primaryBlue,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Take medicines strictly as prescribed by your doctor.',
                        style: GoogleFonts.outfit(
                          fontSize: 11.5,
                          color: AppTheme.primaryBlueDark,
                          height: 1.35,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Filter Chips Row
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip('All', activeMeds.length),
                      const SizedBox(width: 8),
                      _buildFilterChip('Morning', morningMeds.length),
                      const SizedBox(width: 8),
                      _buildFilterChip('Afternoon', afternoonMeds.length),
                      const SizedBox(width: 8),
                      _buildFilterChip('Evening', eveningMeds.length),
                      const SizedBox(width: 8),
                      _buildFilterChip('Night', nightMeds.length),
                    ],
                  ),
                ),
              ),
              const Divider(height: 1),

              // Medication List by Time Group
              Expanded(
                child: activeMeds.isEmpty
                    ? EmptyState(
                        icon: Icons.medication_outlined,
                        title: 'No Active Medications',
                        message:
                            'No active medications currently scheduled for ${patient?.fullName ?? "this patient"}.',
                      )
                    : _buildScheduleBody(
                        morningMeds: morningMeds,
                        afternoonMeds: afternoonMeds,
                        eveningMeds: eveningMeds,
                        nightMeds: nightMeds,
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, int count) {
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
          '$label ($count)',
          style: GoogleFonts.outfit(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : AppTheme.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildScheduleBody({
    required List<Medication> morningMeds,
    required List<Medication> afternoonMeds,
    required List<Medication> eveningMeds,
    required List<Medication> nightMeds,
  }) {
    if (_selectedFilter == 'Morning') {
      return _buildSingleTimeGroup(
        title: 'Morning Regimen',
        subtitle: '08:00 AM - 11:59 AM',
        icon: Icons.wb_sunny_rounded,
        color: const Color(0xFFD97706),
        bg: const Color(0xFFFFFBEB),
        meds: morningMeds,
      );
    }

    if (_selectedFilter == 'Afternoon') {
      return _buildSingleTimeGroup(
        title: 'Afternoon Regimen',
        subtitle: '12:00 PM - 04:59 PM',
        icon: Icons.wb_cloudy_rounded,
        color: const Color(0xFF2563EB),
        bg: const Color(0xFFEFF6FF),
        meds: afternoonMeds,
      );
    }

    if (_selectedFilter == 'Evening') {
      return _buildSingleTimeGroup(
        title: 'Evening Regimen',
        subtitle: '05:00 PM - 07:59 PM',
        icon: Icons.wb_twilight_rounded,
        color: const Color(0xFFD97706),
        bg: const Color(0xFFFFFBEB),
        meds: eveningMeds,
      );
    }

    if (_selectedFilter == 'Night') {
      return _buildSingleTimeGroup(
        title: 'Night Regimen',
        subtitle: '08:00 PM - 11:59 PM',
        icon: Icons.nightlight_round,
        color: const Color(0xFF4338CA),
        bg: const Color(0xFFEEF2FF),
        meds: nightMeds,
      );
    }

    // "All" Filter: chronological timeline of only time groups that have prescribed medications
    final List<Widget> sections = [];

    if (morningMeds.isNotEmpty) {
      sections.add(
        _buildTimeSectionHeader(
          title: 'Morning Regimen',
          subtitle:
              '08:00 AM - 11:59 AM • ${morningMeds.length} dose${morningMeds.length > 1 ? "s" : ""}',
          icon: Icons.wb_sunny_rounded,
          color: const Color(0xFFD97706),
          bg: const Color(0xFFFFFBEB),
        ),
      );
      for (final med in morningMeds) {
        sections.add(MedicationCard(medication: med));
      }
      sections.add(const SizedBox(height: 12));
    }

    if (afternoonMeds.isNotEmpty) {
      sections.add(
        _buildTimeSectionHeader(
          title: 'Afternoon Regimen',
          subtitle:
              '12:00 PM - 04:59 PM • ${afternoonMeds.length} dose${afternoonMeds.length > 1 ? "s" : ""}',
          icon: Icons.wb_cloudy_rounded,
          color: const Color(0xFF2563EB),
          bg: const Color(0xFFEFF6FF),
        ),
      );
      for (final med in afternoonMeds) {
        sections.add(MedicationCard(medication: med));
      }
      sections.add(const SizedBox(height: 12));
    }

    if (eveningMeds.isNotEmpty) {
      sections.add(
        _buildTimeSectionHeader(
          title: 'Evening Regimen',
          subtitle:
              '05:00 PM - 07:59 PM • ${eveningMeds.length} dose${eveningMeds.length > 1 ? "s" : ""}',
          icon: Icons.wb_twilight_rounded,
          color: const Color(0xFFD97706),
          bg: const Color(0xFFFFFBEB),
        ),
      );
      for (final med in eveningMeds) {
        sections.add(MedicationCard(medication: med));
      }
      sections.add(const SizedBox(height: 12));
    }

    if (nightMeds.isNotEmpty) {
      sections.add(
        _buildTimeSectionHeader(
          title: 'Night Regimen',
          subtitle:
              '08:00 PM - 11:59 PM • ${nightMeds.length} dose${nightMeds.length > 1 ? "s" : ""}',
          icon: Icons.nightlight_round,
          color: const Color(0xFF4338CA),
          bg: const Color(0xFFEEF2FF),
        ),
      );
      for (final med in nightMeds) {
        sections.add(MedicationCard(medication: med));
      }
      sections.add(const SizedBox(height: 12));
    }

    return ListView(padding: const EdgeInsets.all(16), children: sections);
  }

  Widget _buildSingleTimeGroup({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required Color bg,
    required List<Medication> meds,
  }) {
    if (meds.isEmpty) {
      return EmptyState(
        icon: Icons.event_available_rounded,
        title: 'No $title Medications',
        message:
            'There are no active medications scheduled for this time group in the clinical prescription.',
      );
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildTimeSectionHeader(
          title: title,
          subtitle: subtitle,
          icon: icon,
          color: color,
          bg: bg,
        ),
        ...meds.map((med) => MedicationCard(medication: med)),
      ],
    );
  }

  Widget _buildTimeSectionHeader({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required Color bg,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
            ),
            child: Icon(icon, color: color, size: 20),
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
                    color: color,
                  ),
                ),
                const SizedBox(height: 1),
                Text(
                  subtitle,
                  style: GoogleFonts.outfit(
                    fontSize: 11.5,
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
