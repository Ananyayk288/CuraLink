import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

enum ChipVariant { primary, emerald, blue, amber, slate, rose }

class StatusChip extends StatelessWidget {
  final String label;
  final IconData? icon;
  final ChipVariant variant;

  const StatusChip({
    super.key,
    required this.label,
    this.icon,
    this.variant = ChipVariant.primary,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color border;
    Color text;

    switch (variant) {
      case ChipVariant.primary:
      case ChipVariant.blue:
        bg = AppTheme.primaryBlueSurface;
        border = AppTheme.primaryBlueBorder;
        text = AppTheme.primaryBlue;
        break;
      case ChipVariant.emerald:
        bg = AppTheme.successSurface;
        border = AppTheme.successBorder;
        text = AppTheme.successGreen;
        break;
      case ChipVariant.amber:
        bg = AppTheme.warningSurface;
        border = AppTheme.warningBorder;
        text = AppTheme.warningAmber;
        break;
      case ChipVariant.rose:
        bg = AppTheme.errorSurface;
        border = AppTheme.errorBorder;
        text = AppTheme.errorRed;
        break;
      case ChipVariant.slate:
        bg = AppTheme.surfaceMuted;
        border = AppTheme.borderSubtle;
        text = AppTheme.textSecondary;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppTheme.radiusPill),
        border: Border.all(color: border, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: text),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: GoogleFonts.outfit(
              color: text,
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.1,
            ),
          ),
        ],
      ),
    );
  }
}

// Legacy alias for backward compatibility
const ChipVariant tealChipVariant = ChipVariant.primary;
