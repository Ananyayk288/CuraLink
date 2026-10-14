import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  AppTheme._();

  // ─── Primary Brand: Royal Blue, Indigo & Violet Gradients ────────────────────
  static const Color primaryBlue = Color(0xFF2A38E8); // Vibrant Royal blue
  static const Color primaryBlueDark = Color(0xFF1C27B8); // Pressed / darker
  static const Color primaryBlueLight = Color(0xFF4F5CF6); // Lighter accent
  static const Color primaryIndigo = Color(0xFF452BE8); // Deep indigo
  static const Color primaryViolet = Color(0xFF6738EE); // Violet
  static const Color primaryPurpleLight = Color(0xFF8B5CF6);
  static const Color primaryBlueSurface = Color(0xFFEEF2FF); // Soft blue surface
  static const Color primaryBlueBorder = Color(0xFFC7D2FE); // Light blue border

  // ─── Accent Brand: Bright Lime Green ────────────────────────────────────────
  static const Color accentLime = Color(0xFFC6F432); // Bright lime green for selected buttons, active dates, highlights
  static const Color accentLimeLight = Color(0xFFD4FC38);
  static const Color accentLimeDark = Color(0xFF0F172A); // Dark text on lime-green buttons/pills
  static const Color accentLimeBorder = Color(0xFFAFE622);

  // ─── Backgrounds ────────────────────────────────────────────────────────────
  static const Color backgroundLavender = Color(0xFFF3F1FA); // Soft lavender / light grey
  static const Color backgroundCream = Color(0xFFF3F1FA); // Soft lavender / off-white
  static const Color backgroundWhite = Color(0xFFFFFFFF); // Pure white – card surfaces
  static const Color surfacePaleBlue = Color(0xFFEEF2FF); // Pale-blue card/section tint
  static const Color surfaceMuted = Color(0xFFF1F5F9); // Muted surface for subtabs etc.
  static const Color surfaceWhite = Color(0xFFFFFFFF);

  // ─── Translucent Glass Surfaces ─────────────────────────────────────────────
  static const Color glassSurface = Color(0x24FFFFFF); // ~14% white
  static const Color glassSurfaceLight = Color(0x38FFFFFF); // ~22% white
  static const Color glassBorder = Color(0x3AFFFFFF); // ~23% white border
  static const Color glassBorderStrong = Color(0x5EFFFFFF);

  // ─── Borders & Dividers ─────────────────────────────────────────────────────
  static const Color borderSubtle = Color(0xFFE5E7EB); // Clean neutral border
  static const Color borderMedium = Color(0xFFD1D5DB);
  static const Color divider = Color(0xFFF1F5F9);

  // ─── Typography ─────────────────────────────────────────────────────────────
  static const Color textPrimary = Color(0xFF0F172A); // Deep navy/slate
  static const Color textSecondary = Color(0xFF475569); // Muted slate
  static const Color textMuted = Color(0xFF94A3B8); // Light grey-blue
  static const Color textLight = Color(0xFFCBD5E1); // Very light for placeholders
  static const Color textOnDark = Color(0xFFFFFFFF);
  static const Color textOnDarkMuted = Color(0xD9FFFFFF);
  static const Color textOnDarkSubtle = Color(0x9EFFFFFF);

  // ─── Status Colours ─────────────────────────────────────────────────────────
  static const Color successGreen = Color(0xFF10B981); // Bright green
  static const Color successSurface = Color(0xFFECFDF5);
  static const Color successBorder = Color(0xFFA7F3D0);

  static const Color warningAmber = Color(0xFFF59E0B); // Amber
  static const Color warningSurface = Color(0xFFFFFBEB);
  static const Color warningBorder = Color(0xFFFDE68A);

  static const Color errorRed = Color(0xFFEF4444); // Red
  static const Color errorSurface = Color(0xFFFEF2F2);
  static const Color errorBorder = Color(0xFFFECACA);

  // ─── Medicine Sticker Colours (DO NOT mix with app palette) ─────────────────
  static const Color stickerBlue = Color(0xFF3B82F6);
  static const Color stickerRed = Color(0xFFEF4444);
  static const Color stickerAmber = Color(0xFFF59E0B);
  static const Color stickerGreen = Color(0xFF10B981);
  static const Color stickerPurple = Color(0xFF8B5CF6);
  static const Color stickerOrange = Color(0xFFF97316);
  static const Color stickerPink = Color(0xFFEC4899);
  static const Color stickerTeal = Color(0xFF14B8A6);

  // ─── Legacy aliases (kept for backward compat, map to new palette) ──────────
  static const Color primaryTeal = primaryBlue;
  static const Color primaryTealLight = primaryBlueLight;
  static const Color tealBackground = primaryBlueSurface;
  static const Color tealBorder = primaryBlueBorder;
  static const Color emeraldGreen = successGreen;
  static const Color emeraldBackground = successSurface;
  static const Color softBlue = primaryBlue;
  static const Color blueBackground = primaryBlueSurface;
  static const Color blueBorder = primaryBlueBorder;
  static const Color amberWarning = warningAmber;
  static const Color amberBackground = warningSurface;
  static const Color amberBorder = warningBorder;
  static const Color roseAlert = errorRed;
  static const Color roseBackground = errorSurface;
  static const Color backgroundNeutral = backgroundCream;

  // ─── Gradients ──────────────────────────────────────────────────────────────
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF2332E6),
      Color(0xFF3F2EE8),
      Color(0xFF6038EE),
      Color(0xFF784AF0),
    ],
  );

  static const LinearGradient headerGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF2633E7),
      Color(0xFF3E2DE8),
      Color(0xFF5F37ED),
      Color(0xFF7B4BF0),
    ],
  );

  static const LinearGradient deepNightGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [
      Color(0xFF181B52),
      Color(0xFF262A86),
      Color(0xFF3F32B5),
    ],
  );

  static const LinearGradient limeGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFFD6FC3A),
      Color(0xFFB8F32B),
    ],
  );

  // ─── Shadows ────────────────────────────────────────────────────────────────
  static List<BoxShadow> get cardShadow => [
    BoxShadow(
      color: const Color(0xFF3B28A8).withValues(alpha: 0.06),
      blurRadius: 20,
      spreadRadius: 0,
      offset: const Offset(0, 6),
    ),
    BoxShadow(
      color: const Color(0xFF0F172A).withValues(alpha: 0.02),
      blurRadius: 4,
      offset: const Offset(0, 1),
    ),
  ];

  static List<BoxShadow> get heroShadow => [
    BoxShadow(
      color: const Color(0xFF3F2EE8).withValues(alpha: 0.25),
      blurRadius: 28,
      spreadRadius: 0,
      offset: const Offset(0, 10),
    ),
  ];

  static List<BoxShadow> get limeButtonShadow => [
    BoxShadow(
      color: const Color(0xFFC6F432).withValues(alpha: 0.4),
      blurRadius: 16,
      spreadRadius: 0,
      offset: const Offset(0, 6),
    ),
  ];

  static List<BoxShadow> get navShadow => [
    BoxShadow(
      color: const Color(0xFF2B33E7).withValues(alpha: 0.12),
      blurRadius: 24,
      offset: const Offset(0, -4),
    ),
  ];

  // ─── Radius ──────────────────────────────────────────────────────────────────
  static const double radiusCard = 24.0;
  static const double radiusLarge = 28.0;
  static const double radiusMedium = 16.0;
  static const double radiusSmall = 12.0;
  static const double radiusPill = 100.0;

  // ─── Spacing ─────────────────────────────────────────────────────────────────
  static const double spacingXS = 4.0;
  static const double spacingS = 8.0;
  static const double spacingM = 12.0;
  static const double spacingL = 16.0;
  static const double spacingXL = 24.0;
  static const double spacingXXL = 32.0;

  // ─── Card Decorations ────────────────────────────────────────────────────────
  static BoxDecoration get cardDecoration => BoxDecoration(
    color: backgroundWhite,
    borderRadius: BorderRadius.circular(radiusCard),
    border: Border.all(color: borderSubtle, width: 1),
    boxShadow: cardShadow,
  );

  static BoxDecoration get glassCardDecoration => BoxDecoration(
    color: glassSurface,
    borderRadius: BorderRadius.circular(radiusCard),
    border: Border.all(color: glassBorder, width: 1.2),
  );

  static BoxDecoration get paleBlueSurfaceDecoration => BoxDecoration(
    color: surfacePaleBlue,
    borderRadius: BorderRadius.circular(radiusCard),
    border: Border.all(color: primaryBlueBorder, width: 1),
    boxShadow: cardShadow,
  );

  static BoxDecoration get limePillDecoration => BoxDecoration(
    gradient: limeGradient,
    borderRadius: BorderRadius.circular(radiusPill),
    boxShadow: limeButtonShadow,
  );

  // ─── Text Styles ─────────────────────────────────────────────────────────────
  static TextStyle get pageHeading => GoogleFonts.outfit(
    fontSize: 26,
    fontWeight: FontWeight.w700,
    color: textPrimary,
    letterSpacing: -0.5,
    height: 1.2,
  );

  static TextStyle get pageHeadingItalic => GoogleFonts.outfit(
    fontSize: 28,
    fontWeight: FontWeight.w800,
    fontStyle: FontStyle.italic,
    color: textPrimary,
    letterSpacing: -0.5,
    height: 1.15,
  );

  static TextStyle get pageHeadingItalicWhite => GoogleFonts.outfit(
    fontSize: 28,
    fontWeight: FontWeight.w800,
    fontStyle: FontStyle.italic,
    color: Colors.white,
    letterSpacing: -0.5,
    height: 1.15,
  );

  static TextStyle get sectionHeading => GoogleFonts.outfit(
    fontSize: 18,
    fontWeight: FontWeight.w700,
    color: textPrimary,
    letterSpacing: -0.3,
  );

  static TextStyle get sectionHeadingItalic => GoogleFonts.outfit(
    fontSize: 19,
    fontWeight: FontWeight.w800,
    fontStyle: FontStyle.italic,
    color: textPrimary,
    letterSpacing: -0.3,
  );

  static TextStyle get sectionHeadingItalicWhite => GoogleFonts.outfit(
    fontSize: 19,
    fontWeight: FontWeight.w800,
    fontStyle: FontStyle.italic,
    color: Colors.white,
    letterSpacing: -0.3,
  );

  static TextStyle get cardTitle => GoogleFonts.outfit(
    fontSize: 15,
    fontWeight: FontWeight.w600,
    color: textPrimary,
    letterSpacing: -0.2,
  );

  static TextStyle get cardSubtitle => GoogleFonts.outfit(
    fontSize: 13,
    fontWeight: FontWeight.w500,
    color: textSecondary,
  );

  static TextStyle get body => GoogleFonts.outfit(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: textSecondary,
    height: 1.5,
  );

  static TextStyle get bodySmall => GoogleFonts.outfit(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: textMuted,
    height: 1.4,
  );

  static TextStyle get label => GoogleFonts.outfit(
    fontSize: 11,
    fontWeight: FontWeight.w600,
    color: textMuted,
    letterSpacing: 0.3,
  );

  static TextStyle get buttonLabel => GoogleFonts.outfit(
    fontSize: 14,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.1,
  );

  static TextStyle get navLabel => GoogleFonts.outfit(
    fontSize: 11,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.1,
  );

  static TextStyle get chipLabel => GoogleFonts.outfit(
    fontSize: 12,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.1,
  );

  static TextStyle get metaDate => GoogleFonts.outfit(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: textMuted,
  );

  // ─── Theme Data ──────────────────────────────────────────────────────────────
  static ThemeData get lightTheme {
    final base = GoogleFonts.outfitTextTheme();
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: primaryBlue,
      scaffoldBackgroundColor: backgroundLavender,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryBlue,
        primary: primaryBlue,
        secondary: accentLime,
        surface: backgroundWhite,
        error: errorRed,
        brightness: Brightness.light,
      ).copyWith(
        surfaceContainerHighest: surfacePaleBlue,
      ),
      textTheme: base.copyWith(
        displayLarge: base.displayLarge?.copyWith(fontFamily: GoogleFonts.outfit().fontFamily, color: textPrimary),
        displayMedium: base.displayMedium?.copyWith(fontFamily: GoogleFonts.outfit().fontFamily, color: textPrimary),
        headlineLarge: base.headlineLarge?.copyWith(fontFamily: GoogleFonts.outfit().fontFamily, color: textPrimary, fontWeight: FontWeight.w700),
        headlineMedium: base.headlineMedium?.copyWith(fontFamily: GoogleFonts.outfit().fontFamily, color: textPrimary, fontWeight: FontWeight.w700),
        titleLarge: base.titleLarge?.copyWith(fontFamily: GoogleFonts.outfit().fontFamily, color: textPrimary, fontWeight: FontWeight.w600),
        titleMedium: base.titleMedium?.copyWith(fontFamily: GoogleFonts.outfit().fontFamily, color: textPrimary, fontWeight: FontWeight.w600),
        titleSmall: base.titleSmall?.copyWith(fontFamily: GoogleFonts.outfit().fontFamily, color: textSecondary, fontWeight: FontWeight.w500),
        bodyLarge: base.bodyLarge?.copyWith(fontFamily: GoogleFonts.outfit().fontFamily, color: textSecondary),
        bodyMedium: base.bodyMedium?.copyWith(fontFamily: GoogleFonts.outfit().fontFamily, color: textSecondary),
        bodySmall: base.bodySmall?.copyWith(fontFamily: GoogleFonts.outfit().fontFamily, color: textMuted),
        labelLarge: base.labelLarge?.copyWith(fontFamily: GoogleFonts.outfit().fontFamily, color: textSecondary, fontWeight: FontWeight.w600),
        labelMedium: base.labelMedium?.copyWith(fontFamily: GoogleFonts.outfit().fontFamily, color: textMuted),
        labelSmall: base.labelSmall?.copyWith(fontFamily: GoogleFonts.outfit().fontFamily, color: textLight),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: backgroundWhite,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        centerTitle: false,
        shadowColor: borderSubtle,
        iconTheme: const IconThemeData(color: textPrimary, size: 22),
        titleTextStyle: GoogleFonts.outfit(
          color: textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.3,
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: backgroundWhite,
        selectedItemColor: primaryBlue,
        unselectedItemColor: textMuted,
        selectedLabelStyle: GoogleFonts.outfit(
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
        unselectedLabelStyle: GoogleFonts.outfit(
          fontSize: 11,
          fontWeight: FontWeight.w500,
        ),
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        color: backgroundWhite,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusCard),
          side: const BorderSide(color: borderSubtle, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlue,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusPill),
          ),
          textStyle: GoogleFonts.outfit(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.1,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryBlue,
          side: const BorderSide(color: primaryBlueBorder, width: 1.5),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusPill),
          ),
          textStyle: GoogleFonts.outfit(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryBlue,
          textStyle: GoogleFonts.outfit(
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: backgroundWhite,
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 15),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusPill),
          borderSide: const BorderSide(color: borderSubtle, width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusPill),
          borderSide: const BorderSide(color: borderSubtle, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusPill),
          borderSide: const BorderSide(color: primaryBlue, width: 1.8),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusPill),
          borderSide: const BorderSide(color: errorRed, width: 1),
        ),
        hintStyle: GoogleFonts.outfit(color: textLight, fontSize: 14),
        labelStyle: GoogleFonts.outfit(color: textSecondary, fontSize: 14),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: surfacePaleBlue,
        selectedColor: primaryBlue,
        labelStyle: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusPill),
          side: const BorderSide(color: borderSubtle),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: divider,
        thickness: 1,
        space: 1,
      ),
      tabBarTheme: TabBarThemeData(
        labelColor: primaryBlue,
        unselectedLabelColor: textMuted,
        indicatorColor: primaryBlue,
        dividerColor: borderSubtle,
        labelStyle: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700),
        unselectedLabelStyle: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w500),
      ),
    );
  }
}
