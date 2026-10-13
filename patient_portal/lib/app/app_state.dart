import 'package:flutter/material.dart';
import '../models/patient.dart';
import '../models/prescription.dart';
import '../models/medication.dart';
import '../models/diagnostic_test.dart';
import '../models/appointment.dart';
import '../repositories/patient_repository.dart';
import '../repositories/mock_patient_repository.dart';

class AppState extends ChangeNotifier {
  final PatientRepository _repository;

  List<Patient> _patients = [];
  Patient? _selectedPatient;
  int _currentTabIndex = 0;

  // Authentication state (Frontend-only demo)
  bool _isAuthenticated;
  String? _authenticatedEmail;

  // Cached data for current patient
  bool _isLoading = true;
  Prescription? _latestPrescription;
  List<Prescription> _prescriptions = [];
  List<Medication> _medications = [];
  List<DiagnosticTest> _diagnosticTests = [];
  List<Appointment> _appointments = [];

  AppState({PatientRepository? repository, bool initialAuthenticated = false})
    : _repository = repository ?? MockPatientRepository(),
      _isAuthenticated = initialAuthenticated {
    _initialize();
  }

  // Getters
  PatientRepository get repository => _repository;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  String? get authenticatedEmail => _authenticatedEmail;
  List<Patient> get patients => _patients;
  Patient? get selectedPatient => _selectedPatient;
  int get currentTabIndex => _currentTabIndex;

  Prescription? get latestPrescription => _latestPrescription;
  List<Prescription> get prescriptions => _prescriptions;
  List<Medication> get medications => _medications;
  List<DiagnosticTest> get diagnosticTests => _diagnosticTests;
  List<Appointment> get appointments => _appointments;

  /// Simulates frontend-only demo sign in
  void signIn({String? email}) {
    _isAuthenticated = true;
    _authenticatedEmail = email ?? 'patient@curalink.health';
    if (email != null) {
      final trimmed = email.trim().toUpperCase();
      for (final p in _patients) {
        if (p.uniquePatientId.toUpperCase() == trimmed) {
          _selectedPatient = p;
          _loadPatientData(p.id);
          break;
        }
      }
    }
    notifyListeners();
  }

  /// Signs out of the current demo session
  void signOut() {
    _isAuthenticated = false;
    _authenticatedEmail = null;
    _currentTabIndex = 0;
    notifyListeners();
  }

  Future<void> _initialize() async {
    _isLoading = true;
    notifyListeners();

    _patients = await _repository.getPatients();
    if (_patients.isNotEmpty) {
      _selectedPatient = _patients.first;
      await _loadPatientData(_selectedPatient!.id);
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> _loadPatientData(String patientId) async {
    final results = await Future.wait([
      _repository.getLatestPrescription(patientId),
      _repository.getPrescriptionHistory(patientId),
      _repository.getAllMedications(patientId),
      _repository.getAllDiagnosticTests(patientId),
      _repository.getAppointments(patientId),
    ]);

    _latestPrescription = results[0] as Prescription?;
    _prescriptions = results[1] as List<Prescription>;
    _medications = results[2] as List<Medication>;
    _diagnosticTests = results[3] as List<DiagnosticTest>;
    _appointments = results[4] as List<Appointment>;
  }

  /// Changes the active patient and updates all four navigation tabs.
  Future<void> switchPatient(Patient patient) async {
    if (_selectedPatient?.id == patient.id) return;
    _selectedPatient = patient;
    _isLoading = true;
    notifyListeners();

    await _loadPatientData(patient.id);

    _isLoading = false;
    notifyListeners();
  }

  /// Sets the active bottom navigation bar destination index.
  void setTabIndex(int index) {
    if (_currentTabIndex != index) {
      _currentTabIndex = index;
      notifyListeners();
    }
  }

  /// Reloads data for current patient
  Future<void> refreshCurrentPatient() async {
    if (_selectedPatient == null) return;
    _isLoading = true;
    notifyListeners();

    await _loadPatientData(_selectedPatient!.id);

    _isLoading = false;
    notifyListeners();
  }
}

/// InheritedWidget for scoped AppState access across widget hierarchy
class AppStateScope extends InheritedNotifier<AppState> {
  const AppStateScope({
    super.key,
    required AppState appState,
    required super.child,
  }) : super(notifier: appState);

  static AppState of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AppStateScope>();
    assert(scope != null, 'No AppStateScope found in context');
    return scope!.notifier!;
  }
}
