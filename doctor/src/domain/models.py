"""
CURALINK — Core Domain Layer
Domain Entities, Enums, Value Objects, and Invariants.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional
import datetime
import uuid


class Role(str, Enum):
    DOCTOR = "DOCTOR"
    PATIENT = "PATIENT"
    PHARMACY = "PHARMACY"
    HOSPITAL = "HOSPITAL"
    ADMIN = "ADMIN"


class LiteracyStatus(str, Enum):
    LITERATE = "LITERATE"
    ILLITERATE = "ILLITERATE"


class PreferredLanguage(str, Enum):
    KANNADA = "KANNADA"
    HINDI = "HINDI"
    TAMIL = "TAMIL"
    TELUGU = "TELUGU"
    MARATHI = "MARATHI"
    ENGLISH = "ENGLISH"


class DeviceType(str, Enum):
    SMARTPHONE = "SMARTPHONE"
    FEATURE_PHONE = "FEATURE_PHONE"


class PrescriptionStatus(str, Enum):
    DRAFT = "DRAFT"
    COMMITTED = "COMMITTED"
    SUPERSEDED = "SUPERSEDED"


class ColorSticker(str, Enum):
    PINK = "PINK"
    BLUE = "BLUE"
    YELLOW = "YELLOW"
    GREEN = "GREEN"
    PURPLE = "PURPLE"


class ShapeSymbol(str, Enum):
    CIRCLE = "CIRCLE"
    TRIANGLE = "TRIANGLE"
    STAR = "STAR"
    SQUARE = "SQUARE"
    DIAMOND = "DIAMOND"


class DispenseStatus(str, Enum):
    PENDING = "PENDING"
    DISPENSED = "DISPENSED"
    SUBSTITUTED = "SUBSTITUTED"


class TaskStatus(str, Enum):
    PROPOSED = "PROPOSED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    RESOLVED = "RESOLVED"


class AdherenceStatus(str, Enum):
    TAKEN_REPORTED = "TAKEN_REPORTED"
    HELP_REQUESTED = "HELP_REQUESTED"
    SNOOZED = "SNOOZED"
    NO_ANSWER = "NO_ANSWER"
    PROVIDER_FAILED = "PROVIDER_FAILED"


@dataclass
class User:
    id: str
    role: Role
    full_name: str
    phone_number: str
    medical_license_no: Optional[str] = None
    department: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.datetime.now().isoformat())


@dataclass
class Patient:
    id: str
    patient_uhid: str
    full_name: str
    age: int
    gender: str
    phone_number: str
    literacy_status: LiteracyStatus
    preferred_language: PreferredLanguage
    device_type: DeviceType
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_consent: bool = False
    created_at: str = field(default_factory=lambda: datetime.datetime.now().isoformat())


@dataclass
class PrescriptionMedicine:
    id: str
    prescription_id: str
    medicine_name: str
    dosage: str
    frequency: str
    duration_days: int
    no_of_days: Optional[int] = None
    meal_relation: str = "After Food"  # Before Food | After Food | With Food | Empty Stomach
    instructions: Optional[str] = None
    color_sticker: Optional[ColorSticker] = None
    symbol: Optional[ShapeSymbol] = None
    dispense_status: DispenseStatus = DispenseStatus.PENDING
    dispensed_at: Optional[str] = None


@dataclass
class DiagnosticOrder:
    id: str
    prescription_id: str
    test_type: str = "LAB_TEST"  # SCAN | LAB_TEST
    test_name: str = ""
    instructions: Optional[str] = None
    status: str = "PENDING"      # PENDING | COMPLETED | CANCELLED
    created_at: str = field(default_factory=lambda: datetime.datetime.now().isoformat())


@dataclass
class Prescription:
    id: str
    patient_id: str
    doctor_id: str
    doctor_name: Optional[str] = None
    hospital_id: Optional[str] = None
    prescription_type: str = "COMPREHENSIVE"  # NORMAL | SCAN_TEST | COMPREHENSIVE
    parent_prescription_id: Optional[str] = None
    revision_number: int = 1
    status: PrescriptionStatus = PrescriptionStatus.DRAFT
    diagnosis_notes: str = ""
    symptoms_notes: Optional[str] = None
    word_count: int = 0
    clinical_instructions: Optional[str] = None
    follow_up_date: Optional[str] = None
    follow_up_notes: Optional[str] = None
    telephony_trigger_enabled: bool = True
    telephony_triggered_at: Optional[str] = None
    committed_at: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.datetime.now().isoformat())
    medicines: List[PrescriptionMedicine] = field(default_factory=list)
    diagnostics: List[DiagnosticOrder] = field(default_factory=list)


@dataclass
class CareTask:
    id: str
    patient_id: str
    prescription_id: Optional[str]
    source_type: str  # "AI_CALL_EXTRACT" | "DUAL_ESCALATION" | "PATIENT_REQUEST"
    title: str
    raw_transcript: Optional[str] = None
    ai_extracted_summary: Optional[str] = None
    priority: str = "HIGH"  # LOW | MEDIUM | HIGH | CRITICAL
    status: TaskStatus = TaskStatus.PROPOSED
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.datetime.now().isoformat())


@dataclass
class SubstitutionProposal:
    id: str
    prescription_id: str
    medicine_id: str
    pharmacist_id: str
    original_medicine_name: str
    proposed_medicine_name: str
    reason_for_substitution: str
    status: str = "PENDING"  # PENDING | APPROVED | REJECTED
    doctor_rejection_reason: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.datetime.now().isoformat())


@dataclass
class AdherenceLog:
    id: str
    patient_id: str
    medicine_id: Optional[str]
    scheduled_time: str
    status: AdherenceStatus
    response_mode: str  # DTMF_1, DTMF_2, DTMF_3, STT, NO_ANSWER
    provider_outcome: str  # ANSWERED, BUSY, NETWORK_FAILED
    attempt_count: int = 1
    recorded_at: str = field(default_factory=lambda: datetime.datetime.now().isoformat())
