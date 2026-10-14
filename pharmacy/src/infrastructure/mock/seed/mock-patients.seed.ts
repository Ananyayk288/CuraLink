export interface DoctorSidePatientRecord {
  id: string; // e.g. "AV-000001"
  fullName: string;
  literacyStatus: "LITERATE" | "ILLITERATE";
  preferredLanguage: string;
  deviceType: "SMARTPHONE" | "FEATURE_PHONE";
  phoneNumber: string;
  // Doctor/Clinical profile fields that MUST NEVER leak to pharmacy:
  guardianName: string;
  guardianPhone: string;
  emergencyContact: string;
  bloodGroup: string;
  allergies: string[];
}

export const SEED_PATIENTS: DoctorSidePatientRecord[] = [
  {
    id: "AV-000001",
    fullName: "Suresh Patil",
    literacyStatus: "ILLITERATE",
    preferredLanguage: "hi-IN",
    deviceType: "FEATURE_PHONE",
    phoneNumber: "+919876500001",
    guardianName: "Ramesh Patil (Son)",
    guardianPhone: "+919876500002",
    emergencyContact: "+919876500002",
    bloodGroup: "B+",
    allergies: ["Penicillin"],
  },
  {
    id: "AV-000002",
    fullName: "Ananya Sharma",
    literacyStatus: "LITERATE",
    preferredLanguage: "en-IN",
    deviceType: "SMARTPHONE",
    phoneNumber: "+919876500003",
    guardianName: "Deepak Sharma (Spouse)",
    guardianPhone: "+919876500004",
    emergencyContact: "+919876500004",
    bloodGroup: "O+",
    allergies: [],
  },
  {
    id: "AV-000003",
    fullName: "Vikram Rao",
    literacyStatus: "ILLITERATE",
    preferredLanguage: "kn-IN",
    deviceType: "FEATURE_PHONE",
    phoneNumber: "+919876500005",
    guardianName: "Sunita Rao (Daughter)",
    guardianPhone: "+919876500006",
    emergencyContact: "+919876500006",
    bloodGroup: "A+",
    allergies: ["Sulfa drugs"],
  },
  {
    id: "AV-000005",
    fullName: "Rahul Verma",
    literacyStatus: "LITERATE",
    preferredLanguage: "en-IN",
    deviceType: "SMARTPHONE",
    phoneNumber: "+919876500009",
    guardianName: "Alok Verma (Father)",
    guardianPhone: "+919876500010",
    emergencyContact: "+919876500010",
    bloodGroup: "O+",
    allergies: [],
  },
  {
    id: "PAT10001",
    fullName: "Ramesh Gowda",
    literacyStatus: "ILLITERATE",
    preferredLanguage: "kn-IN",
    deviceType: "FEATURE_PHONE",
    phoneNumber: "+91 98451 23456",
    guardianName: "Suresh Gowda (Son)",
    guardianPhone: "+91 98451 23457",
    emergencyContact: "+91 98451 23457",
    bloodGroup: "B+",
    allergies: [],
  },
  {
    id: "PAT10002",
    fullName: "Kamalamma Devi",
    literacyStatus: "ILLITERATE",
    preferredLanguage: "kn-IN",
    deviceType: "FEATURE_PHONE",
    phoneNumber: "+91 98450 87654",
    guardianName: "Anitha Devi (Daughter)",
    guardianPhone: "+91 98450 87655",
    emergencyContact: "+91 98450 87655",
    bloodGroup: "O+",
    allergies: [],
  },
];
