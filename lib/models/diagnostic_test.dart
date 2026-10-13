enum TestCategory {
  diagnosticScan, // MRI, CT, Ultrasound, X-Ray
  labTest, // Blood test, Lipid profile, HbA1c, CBC
  cardiac, // ECG, 2D Echo, TMT
}

enum TestStatus { completed, scheduled, sampleCollected, pendingResults }

class DiagnosticTest {
  final String id;
  final String prescriptionId;
  final String testName;
  final TestCategory category;
  final DateTime orderedDate;
  final DateTime? scheduledDate;
  final DateTime? completedDate;
  final String orderingDoctor;
  final String diagnosticCenter;
  final TestStatus status;
  final bool hasReport;
  final String? reportSummary;
  final String? reportFileName;
  final Map<String, String>? keyFindings;

  const DiagnosticTest({
    required this.id,
    required this.prescriptionId,
    required this.testName,
    required this.category,
    required this.orderedDate,
    this.scheduledDate,
    this.completedDate,
    required this.orderingDoctor,
    required this.diagnosticCenter,
    required this.status,
    required this.hasReport,
    this.reportSummary,
    this.reportFileName,
    this.keyFindings,
  });

  bool get isCompleted => status == TestStatus.completed;

  DateTime get targetDate => completedDate ?? scheduledDate ?? orderedDate;

  String get categoryDisplay {
    switch (category) {
      case TestCategory.diagnosticScan:
        return 'Scan';
      case TestCategory.labTest:
        return 'Lab Test';
      case TestCategory.cardiac:
        return 'Heart Test';
    }
  }

  String get statusDisplay {
    switch (status) {
      case TestStatus.completed:
        return 'Ready';
      case TestStatus.scheduled:
        return 'Scheduled';
      case TestStatus.sampleCollected:
        return 'Processing';
      case TestStatus.pendingResults:
        return 'Pending';
    }
  }
}
