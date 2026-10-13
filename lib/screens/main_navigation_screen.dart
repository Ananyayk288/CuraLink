import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../app/app_state.dart';
import '../theme/app_theme.dart';
import 'dashboard/dashboard_screen.dart';
import 'prescription_history/prescription_history_screen.dart';
import 'medical_records/medical_records_screen.dart';
import 'profile/profile_screen.dart';

/// Persistent 4-destination navigation shell for CuraLink Healthcare
class MainNavigationScreen extends StatelessWidget {
  const MainNavigationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = AppStateScope.of(context);
    final currentIndex = appState.currentTabIndex;

    const screens = [
      DashboardScreen(),
      PrescriptionHistoryScreen(),
      MedicalRecordsScreen(),
      ProfileScreen(),
    ];

    const items = [
      _NavItem(icon: Icons.home_outlined, activeIcon: Icons.home_rounded, label: 'Home'),
      _NavItem(icon: Icons.receipt_long_outlined, activeIcon: Icons.receipt_long_rounded, label: 'Prescriptions'),
      _NavItem(icon: Icons.folder_shared_outlined, activeIcon: Icons.folder_shared_rounded, label: 'Medical Records'),
      _NavItem(icon: Icons.person_outline_rounded, activeIcon: Icons.person_rounded, label: 'Profile'),
    ];

    return Scaffold(
      backgroundColor: AppTheme.backgroundCream,
      body: IndexedStack(index: currentIndex, children: screens),
      bottomNavigationBar: _BottomNavBar(
        currentIndex: currentIndex,
        items: items,
        onTap: (i) => appState.setTabIndex(i),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const _NavItem({required this.icon, required this.activeIcon, required this.label});
}

class _BottomNavBar extends StatelessWidget {
  final int currentIndex;
  final List<_NavItem> items;
  final ValueChanged<int> onTap;

  const _BottomNavBar({
    required this.currentIndex,
    required this.items,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final bottomPad = MediaQuery.of(context).padding.bottom;
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.backgroundWhite,
        boxShadow: AppTheme.navShadow,
        border: const Border(top: BorderSide(color: AppTheme.borderSubtle, width: 1)),
      ),
      padding: EdgeInsets.only(bottom: bottomPad > 0 ? bottomPad : 8, top: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          for (int i = 0; i < items.length; i++)
            _NavBarItem(
              item: items[i],
              isSelected: i == currentIndex,
              onTap: () => onTap(i),
            ),
        ],
      ),
    );
  }
}

class _NavBarItem extends StatelessWidget {
  final _NavItem item;
  final bool isSelected;
  final VoidCallback onTap;

  const _NavBarItem({
    required this.item,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryBlueSurface : Colors.transparent,
          borderRadius: BorderRadius.circular(AppTheme.radiusPill),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isSelected ? item.activeIcon : item.icon,
              size: 22,
              color: isSelected ? AppTheme.primaryBlue : AppTheme.textMuted,
            ),
            const SizedBox(height: 3),
            Text(
              item.label,
              style: GoogleFonts.outfit(
                fontSize: 10.5,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? AppTheme.primaryBlue : AppTheme.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
