enum MealInstruction { afterFood, beforeFood, withFood, asNeeded }

class Medication {
  final String id;
  final String prescriptionId;
  final String name;
  final String strength;
  final String dosage;
  final String frequency;
  final String timing;
  final MealInstruction mealInstruction;
  final String duration;
  final String prescribingDoctor;
  final DateTime prescribedDate;
  final bool isActive;
  final String? clinicalNotes;
  final String?
  stickerColor; // Supplementary visual packaging identifier (e.g. 'Blue', 'Red')

  const Medication({
    required this.id,
    required this.prescriptionId,
    required this.name,
    required this.strength,
    required this.dosage,
    required this.frequency,
    required this.timing,
    required this.mealInstruction,
    required this.duration,
    required this.prescribingDoctor,
    required this.prescribedDate,
    required this.isActive,
    this.clinicalNotes,
    this.stickerColor,
  });

  String get mealInstructionDisplay {
    switch (mealInstruction) {
      case MealInstruction.afterFood:
        return 'After Meals';
      case MealInstruction.beforeFood:
        return 'Before Meals';
      case MealInstruction.withFood:
        return 'With Food';
      case MealInstruction.asNeeded:
        return 'As Needed';
    }
  }

  // Time-of-day schedule indicators for clear visual icons
  bool get isMorning =>
      timing.toLowerCase().contains('morning') ||
      timing.toLowerCase().contains('am');

  bool get isAfternoon =>
      timing.toLowerCase().contains('afternoon') ||
      (timing.toLowerCase().contains('pm') &&
          !timing.toLowerCase().contains('night'));

  bool get isEvening => timing.toLowerCase().contains('evening');

  bool get isNight =>
      timing.toLowerCase().contains('night') ||
      timing.toLowerCase().contains('bedtime');

  String get stickerColorDisplay => stickerColor != null && stickerColor!.isNotEmpty
      ? '${stickerColor![0].toUpperCase()}${stickerColor!.substring(1)} Sticker Packaging'
      : 'Standard Packaging';
}
