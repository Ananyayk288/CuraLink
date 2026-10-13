export interface PatientSummary {
  id: string;
  displayName: string;
  requiresStickers: boolean; // Derived from literacyStatus === 'ILLITERATE'
  preferredLanguage: string; // e.g. 'hi-IN', 'kn-IN', 'ta-IN', 'en-IN'
  deviceType: "SMARTPHONE" | "FEATURE_PHONE";
}
