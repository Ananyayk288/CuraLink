import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../app/app_state.dart';
import '../../models/prescription.dart';
import '../../theme/app_theme.dart';
import '../../widgets/notification_bell_button.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/empty_state.dart';
import 'prescription_detail_screen.dart';

class PrescriptionHistoryScreen extends StatefulWidget {
  const PrescriptionHistoryScreen({super.key});

  @override
  State<PrescriptionHistoryScreen> createState() =>
      _PrescriptionHistoryScreenState();
}

class _PrescriptionHistoryScreenState extends State<PrescriptionHistoryScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedFilter = 'All'; // All, Active, Completed

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appState = AppStateScope.of(context);
    final patient = appState.selectedPatient;
    final prescriptions = appState.prescriptions;
    final dateFormat = DateFormat('dd MMM yyyy');

    // Filter prescriptions by search & status
    final filtered = prescriptions.where((rx) {
      final query = _searchQuery.toLowerCase();
      final matchesQuery =
          query.isEmpty ||
          rx.referenceNumber.toLowerCase().contains(query) ||
          rx.doctorName.toLowerCase().contains(query) ||
          rx.diagnosis.toLowerCase().contains(query) ||
          rx.hospitalOrClinic.toLowerCase().contains(query) ||
          rx.medications.any((m) => m.name.toLowerCase().contains(query));

      if (!matchesQuery) return false;

      if (_selectedFilter == 'Active') return rx.isActive;
      if (_selectedFilter == 'Past Orders') return !rx.isActive;
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: AppTheme.backgroundCream,
      appBar: AppBar(
        title: Text('Prescription History', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
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
              // Search Field & Filter Chips
              Container(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
                color: AppTheme.backgroundWhite,
                child: Column(
                  children: [
                    TextField(
                      controller: _searchController,
                      decoration: InputDecoration(
                        hintText: 'Search by doctor, medicine, diagnosis...',
                        hintStyle: const TextStyle(
                          fontSize: 13,
                          color: AppTheme.textMuted,
                        ),
                        prefixIcon: const Icon(
                          Icons.search,
                          size: 20,
                          color: AppTheme.textMuted,
                        ),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 18),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() {
                                    _searchQuery = '';
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
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      onChanged: (val) {
                        setState(() {
                          _searchQuery = val;
                        });
                      },
                    ),
                    const SizedBox(height: 10),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildFilterChip('All', prescriptions.length),
                          const SizedBox(width: 8),
                          _buildFilterChip(
                            'Active',
                            prescriptions.where((r) => r.isActive).length,
                          ),
                          const SizedBox(width: 8),
                          _buildFilterChip(
                            'Past Orders',
                            prescriptions.where((r) => !r.isActive).length,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(),

              // List of Prescriptions (Timeline presentation)
              Expanded(
                child: filtered.isEmpty
                    ? EmptyState(
                        icon: Icons.search_off_rounded,
                        title: 'No Prescriptions Found',
                        message: _searchQuery.isEmpty
                            ? 'No prescriptions recorded for ${patient?.fullName ?? "this patient"}.'
                            : 'No records matched "$_searchQuery". Try clearing your search.',
                        action: _searchQuery.isNotEmpty
                            ? TextButton(
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() {
                                    _searchQuery = '';
                                    _selectedFilter = 'All';
                                  });
                                },
                                child: const Text('Reset Search Filters'),
                              )
                            : null,
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final rx = filtered[index];
                          return _buildPrescriptionCard(
                            context,
                            rx,
                            dateFormat,
                          );
                        },
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
      onTap: () => setState(() => _selectedFilter = label),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryBlue : AppTheme.backgroundWhite,
          borderRadius: BorderRadius.circular(AppTheme.radiusPill),
          border: Border.all(color: isSelected ? AppTheme.primaryBlue : AppTheme.borderSubtle),
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

  Widget _buildPrescriptionCard(
    BuildContext context,
    Prescription rx,
    DateFormat dateFormat,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        borderRadius: BorderRadius.circular(AppTheme.radiusCard),
        border: Border.all(
          color: rx.isActive ? AppTheme.primaryBlueBorder : AppTheme.borderSubtle,
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
              builder: (context) => PrescriptionDetailScreen(prescription: rx),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Ref number, Date, and Status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: rx.isActive
                              ? AppTheme.primaryBlueSurface
                              : AppTheme.surfaceMuted,
                          borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                          border: Border.all(
                            color: rx.isActive
                                ? AppTheme.primaryBlueBorder
                                : AppTheme.borderSubtle,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.receipt_long_rounded,
                              size: 14,
                              color: rx.isActive
                                  ? AppTheme.primaryBlue
                                  : AppTheme.textMuted,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              rx.referenceNumber,
                              style: GoogleFonts.outfit(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: rx.isActive
                                    ? AppTheme.primaryBlue
                                    : AppTheme.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Text(
                        dateFormat.format(rx.date),
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textMuted,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 8),
                      StatusChip(
                        label: rx.isActive ? 'Active Order' : 'Past Order',
                        variant: rx.isActive
                            ? ChipVariant.emerald
                            : ChipVariant.slate,
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 10),

              // Doctor & Hospital
              Text(
                rx.doctorName,
                style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 2),
              Text(
                '${rx.doctorSpecialty} • ${rx.hospitalOrClinic}',
                style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w500, color: AppTheme.primaryBlue),
              ),
              const SizedBox(height: 8),

              // Diagnosis
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppTheme.backgroundCream,
                  borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                  border: Border.all(color: AppTheme.borderSubtle),
                ),
                child: Text(
                  'Diagnosis: ${rx.diagnosis}',
                  style: GoogleFonts.outfit(fontSize: 12.5, fontWeight: FontWeight.w500, color: AppTheme.textSecondary),
                ),
              ),
              const SizedBox(height: 10),

              // Prescribed Medicines Preview Tags
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  ...rx.medications.take(3).map(
                    (m) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryBlueSurface,
                        borderRadius: BorderRadius.circular(AppTheme.radiusPill),
                        border: Border.all(color: AppTheme.primaryBlueBorder),
                      ),
                      child: Text(
                        '${m.name} · ${m.strength}',
                        style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.primaryBlue),
                      ),
                    ),
                  ),
                  if (rx.medications.length > 3)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceMuted,
                        borderRadius: BorderRadius.circular(AppTheme.radiusPill),
                      ),
                      child: Text('+${rx.medications.length - 3} more', style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textMuted)),
                    ),
                ],
              ),
              const SizedBox(height: 10),

              // Summary Footer with Open Full Record Link
              Row(
                children: [
                  Expanded(
                    child: Text(
                      '${rx.medications.length} medicines${rx.associatedTests.isNotEmpty ? " · ${rx.associatedTests.length} tests" : ""}',
                      style: GoogleFonts.outfit(fontSize: 12, color: AppTheme.textMuted),
                    ),
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('View Full Rx', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.primaryBlue)),
                      const SizedBox(width: 3),
                      const Icon(Icons.arrow_forward_ios_rounded, size: 11, color: AppTheme.primaryBlue),
                    ],
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
