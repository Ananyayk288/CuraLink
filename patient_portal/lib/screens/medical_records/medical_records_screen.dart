import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../app/app_state.dart';
import '../../models/diagnostic_test.dart';
import '../../models/medication.dart';
import '../../theme/app_theme.dart';
import '../../widgets/demo_banner.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/medication_card.dart';
import '../../widgets/notification_bell_button.dart';
import '../../widgets/status_chip.dart';
import '../medical_history/medication_detail_sheet.dart';
import '../scan_test_history/diagnostic_report_detail_screen.dart';

class MedicalRecordsScreen extends StatefulWidget {
  final int initialTab;

  const MedicalRecordsScreen({super.key, this.initialTab = 0});

  @override
  State<MedicalRecordsScreen> createState() => _MedicalRecordsScreenState();
}

class _MedicalRecordsScreenState extends State<MedicalRecordsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Search and filter states for Medical History
  final TextEditingController _medSearchController = TextEditingController();
  String _medSearchQuery = '';
  int _medSubTab = 0; // 0 = Active, 1 = Past Orders

  // Search and filter states for Scans & Tests
  final TextEditingController _testSearchController = TextEditingController();
  String _testSearchQuery = '';
  String _testCategoryFilter = 'All'; // All, Scans & Cardiac, Lab Tests

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 2,
      vsync: this,
      initialIndex: widget.initialTab.clamp(0, 1),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    _medSearchController.dispose();
    _testSearchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appState = AppStateScope.of(context);
    final allMeds = appState.medications;
    final activeMeds = allMeds.where((m) => m.isActive).toList();
    final allTests = appState.diagnosticTests;

    return Scaffold(
      backgroundColor: AppTheme.backgroundCream,
      appBar: AppBar(
        title: Text(
          'Medical Records',
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
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primaryBlue,
          unselectedLabelColor: AppTheme.textMuted,
          indicatorColor: AppTheme.primaryBlue,
          indicatorWeight: 3,
          labelStyle: GoogleFonts.outfit(
            fontSize: 13,
            fontWeight: FontWeight.w700,
          ),
          unselectedLabelStyle: GoogleFonts.outfit(
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
          tabs: [
            const Tab(
              icon: Icon(Icons.history_edu_rounded, size: 18),
              text: 'Medical & Medication History',
            ),
            Tab(
              icon: const Icon(Icons.biotech_rounded, size: 18),
              text: 'Scans & Lab Tests (${allTests.length})',
            ),
          ],
        ),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: Column(
            children: [
              const DemoBanner(),
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    // Tab 1: Medical & Medication History
                    _buildMedicalHistoryTab(context, appState, activeMeds),

                    // Tab 2: Diagnostic Scans & Lab Tests
                    _buildScanTestTab(context, allTests),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ===========================================================================
  // Tab 1: Medical & Medication History
  // ===========================================================================
  Widget _buildMedicalHistoryTab(
    BuildContext context,
    AppState appState,
    List<Medication> activeMeds,
  ) {
    final patient = appState.selectedPatient;
    final allMeds = appState.medications;

    final filteredActive = allMeds.where((m) {
      if (!m.isActive) return false;
      final q = _medSearchQuery.toLowerCase();
      return q.isEmpty ||
          m.name.toLowerCase().contains(q) ||
          m.strength.toLowerCase().contains(q) ||
          m.prescribingDoctor.toLowerCase().contains(q);
    }).toList();

    final filteredPast = allMeds.where((m) {
      if (m.isActive) return false;
      final q = _medSearchQuery.toLowerCase();
      return q.isEmpty ||
          m.name.toLowerCase().contains(q) ||
          m.strength.toLowerCase().contains(q) ||
          m.prescribingDoctor.toLowerCase().contains(q);
    }).toList();

    final displayedList = _medSubTab == 0 ? filteredActive : filteredPast;

    return Column(
      children: [
        // Search & Sub-tabs Header
        Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
          color: AppTheme.backgroundWhite,
          child: Column(
            children: [
              TextField(
                controller: _medSearchController,
                decoration: InputDecoration(
                  hintText: 'Search medications...',
                  hintStyle: GoogleFonts.outfit(
                    fontSize: 13,
                    color: AppTheme.textMuted,
                  ),
                  prefixIcon: const Icon(
                    Icons.search,
                    size: 20,
                    color: AppTheme.textMuted,
                  ),
                  suffixIcon: _medSearchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 18),
                          onPressed: () {
                            _medSearchController.clear();
                            setState(() {
                              _medSearchQuery = '';
                            });
                          },
                        )
                      : null,
                  filled: true,
                  fillColor: AppTheme.surfaceMuted,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppTheme.radiusPill),
                    borderSide: BorderSide.none,
                  ),
                ),
                onChanged: (val) {
                  setState(() {
                    _medSearchQuery = val;
                  });
                },
              ),
              const SizedBox(height: 10),

              // Sub-tabs segment row
              Row(
                children: [
                  Expanded(
                    child: _buildSubTabButton(
                      title: 'Active Medications (${filteredActive.length})',
                      isSelected: _medSubTab == 0,
                      onTap: () => setState(() => _medSubTab = 0),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildSubTabButton(
                      title: 'Past / Discontinued (${filteredPast.length})',
                      isSelected: _medSubTab == 1,
                      onTap: () => setState(() => _medSubTab = 1),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const Divider(height: 1),

        // Medical History & Medication List
        Expanded(
          child: displayedList.isEmpty
              ? EmptyState(
                  icon: Icons.medication_outlined,
                  title: _medSubTab == 0
                      ? 'No Active Medications'
                      : 'No Past / Discontinued Medications',
                  message: _medSearchQuery.isEmpty
                      ? 'No medications recorded in this category for ${patient?.fullName ?? "this patient"}.'
                      : 'No medications matched "$_medSearchQuery".',
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: displayedList.length + 1,
                  itemBuilder: (context, index) {
                    if (index == 0) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (_medSearchQuery.isEmpty)
                            _buildClinicalMedicalConditionsCard(patient),
                          _buildMedicationGuidanceCallout(_medSubTab == 1),
                        ],
                      );
                    }
                    final med = displayedList[index - 1];
                    return MedicationCard(
                      medication: med,
                      showDoctorInfo: true,
                      onTap: () => MedicationDetailSheet.show(context, med),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildClinicalMedicalConditionsCard(dynamic patient) {
    if (patient == null) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        border: Border.all(color: AppTheme.primaryBlueBorder),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(9),
            decoration: BoxDecoration(
              color: AppTheme.primaryBlueSurface,
              borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
            ),
            child: const Icon(
              Icons.history_edu_rounded,
              color: AppTheme.primaryBlue,
              size: 18,
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
                    Text(
                      'CLINICAL MEDICAL HISTORY',
                      style: GoogleFonts.outfit(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.primaryBlue,
                        letterSpacing: 0.4,
                      ),
                    ),
                    Text(
                      'Allergies: ${(patient.allergies as List<String>).first}',
                      style: GoogleFonts.outfit(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.warningAmber,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  patient.primaryDiagnosis,
                  style: GoogleFonts.outfit(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubTabButton({
    required String title,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppTheme.radiusPill),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.accentLime : AppTheme.surfaceMuted,
          borderRadius: BorderRadius.circular(AppTheme.radiusPill),
          border: Border.all(
            color: isSelected ? AppTheme.accentLimeBorder : AppTheme.borderSubtle,
            width: 1.2,
          ),
          boxShadow: isSelected ? AppTheme.limeButtonShadow : null,
        ),
        alignment: Alignment.center,
        child: Text(
          title,
          style: GoogleFonts.outfit(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: isSelected ? AppTheme.accentLimeDark : AppTheme.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildMedicationGuidanceCallout(bool isHistorical) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isHistorical ? AppTheme.surfaceMuted : AppTheme.primaryBlueSurface,
        borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
        border: Border.all(
          color: isHistorical ? AppTheme.borderSubtle : AppTheme.primaryBlueBorder,
        ),
      ),
      child: Row(
        children: [
          Icon(
            isHistorical ? Icons.history_rounded : Icons.verified_rounded,
            size: 16,
            color: isHistorical ? AppTheme.textMuted : AppTheme.primaryBlue,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              isHistorical
                  ? 'Previous courses. Not active unless re-prescribed.'
                  : 'Active prescriptions. Tap card for details.',
              style: GoogleFonts.outfit(
                fontSize: 11.5,
                color: isHistorical
                    ? AppTheme.textSecondary
                    : AppTheme.primaryBlueDark,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // Tab 2: Diagnostic Scans & Lab Tests
  // ===========================================================================
  Widget _buildScanTestTab(
    BuildContext context,
    List<DiagnosticTest> allTests,
  ) {
    final dateFormat = DateFormat('dd MMM yyyy');

    final filtered = allTests.where((t) {
      final q = _testSearchQuery.toLowerCase();
      final matchesQuery =
          q.isEmpty ||
          t.testName.toLowerCase().contains(q) ||
          t.diagnosticCenter.toLowerCase().contains(q) ||
          t.orderingDoctor.toLowerCase().contains(q);

      if (!matchesQuery) return false;

      if (_testCategoryFilter == 'Scans & Cardiac') {
        return t.category == TestCategory.diagnosticScan ||
            t.category == TestCategory.cardiac;
      }
      if (_testCategoryFilter == 'Lab Tests') {
        return t.category == TestCategory.labTest;
      }
      return true;
    }).toList();

    return Column(
      children: [
        // Search & Filter Chips Header
        Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
          color: AppTheme.backgroundWhite,
          child: Column(
            children: [
              TextField(
                controller: _testSearchController,
                decoration: InputDecoration(
                  hintText: 'Search scans & tests...',
                  hintStyle: GoogleFonts.outfit(
                    fontSize: 13,
                    color: AppTheme.textMuted,
                  ),
                  prefixIcon: const Icon(
                    Icons.search,
                    size: 20,
                    color: AppTheme.textMuted,
                  ),
                  suffixIcon: _testSearchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 18),
                          onPressed: () {
                            _testSearchController.clear();
                            setState(() {
                              _testSearchQuery = '';
                            });
                          },
                        )
                      : null,
                  filled: true,
                  fillColor: AppTheme.surfaceMuted,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppTheme.radiusPill),
                    borderSide: BorderSide.none,
                  ),
                ),
                onChanged: (val) {
                  setState(() {
                    _testSearchQuery = val;
                  });
                },
              ),
              const SizedBox(height: 10),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildTestCategoryChip('All'),
                    const SizedBox(width: 8),
                    _buildTestCategoryChip('Scans & Cardiac'),
                    const SizedBox(width: 8),
                    _buildTestCategoryChip('Lab Tests'),
                  ],
                ),
              ),
            ],
          ),
        ),
        const Divider(height: 1),

        // Tests List
        Expanded(
          child: filtered.isEmpty
              ? EmptyState(
                  icon: Icons.biotech_outlined,
                  title: 'No Diagnostic Tests Found',
                  message: _testSearchQuery.isEmpty
                      ? 'No diagnostic tests recorded under $_testCategoryFilter category.'
                      : 'No tests matched "$_testSearchQuery".',
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final test = filtered[index];
                    return _buildCompactDiagnosticTestCard(
                      context,
                      test,
                      dateFormat,
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildTestCategoryChip(String label) {
    final isSelected = _testCategoryFilter == label;
    return GestureDetector(
      onTap: () {
        setState(() {
          _testCategoryFilter = label;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.accentLime : AppTheme.backgroundWhite,
          borderRadius: BorderRadius.circular(AppTheme.radiusPill),
          border: Border.all(
            color: isSelected ? AppTheme.accentLimeBorder : AppTheme.borderSubtle,
            width: 1.2,
          ),
          boxShadow: isSelected ? AppTheme.limeButtonShadow : null,
        ),
        child: Text(
          label,
          style: GoogleFonts.outfit(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: isSelected ? AppTheme.accentLimeDark : AppTheme.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildCompactDiagnosticTestCard(
    BuildContext context,
    DiagnosticTest test,
    DateFormat dateFormat,
  ) {
    final isCompleted = test.isCompleted;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        border: Border.all(
          color: isCompleted ? AppTheme.primaryBlueBorder : AppTheme.warningBorder,
          width: 1,
        ),
        boxShadow: AppTheme.cardShadow,
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => DiagnosticReportDetailScreen(test: test),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Row: Icon, Test Name, Category, Status Chip
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: isCompleted
                          ? AppTheme.primaryBlueSurface
                          : AppTheme.warningSurface,
                      borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                    ),
                    child: Icon(
                      test.category == TestCategory.labTest
                          ? Icons.science_rounded
                          : Icons.monitor_heart_rounded,
                      color: isCompleted
                          ? AppTheme.primaryBlue
                          : AppTheme.warningAmber,
                      size: 22,
                    ),
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
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          test.categoryDisplay,
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            color: AppTheme.primaryBlue,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  StatusChip(
                    label: test.statusDisplay,
                    variant: isCompleted
                        ? ChipVariant.emerald
                        : ChipVariant.amber,
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Facility & Date Details
              Row(
                children: [
                  const Icon(
                    Icons.location_on_outlined,
                    size: 14,
                    color: AppTheme.textMuted,
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      test.diagnosticCenter,
                      style: GoogleFonts.outfit(
                        fontSize: 11.5,
                        color: AppTheme.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(
                    Icons.event_outlined,
                    size: 14,
                    color: AppTheme.textMuted,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    isCompleted && test.completedDate != null
                        ? dateFormat.format(test.completedDate!)
                        : 'Scheduled: ${dateFormat.format(test.targetDate)}',
                    style: GoogleFonts.outfit(
                      fontSize: 11.5,
                      color: AppTheme.textMuted,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),

              if (isCompleted && test.reportSummary != null) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceMuted,
                    borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.check_circle_outline_rounded,
                        size: 14,
                        color: AppTheme.successGreen,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          test.reportSummary!,
                          style: GoogleFonts.outfit(
                            fontSize: 11.5,
                            color: AppTheme.textSecondary,
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
                    'View Report',
                    style: GoogleFonts.outfit(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.primaryBlue,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(
                    Icons.arrow_forward_rounded,
                    size: 14,
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
}
