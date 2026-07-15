export interface RegisteredPatient {
  id: string;
  name: string;
  village: string;
  created_at: string;
  last_seen_at: string;
  visit_count: number;
  display_label: string;
}

export interface PatientEncounterSummary {
  timestamp: string;
  decision: string;
  action_taken: string | null;
}
