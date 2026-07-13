/** Shared activity-log types and helpers (safe for client and server). */

export type ActivityEventType =
  | "assess_completed"
  | "teleconsultation_call"
  | "schedule_teleconsultation"
  | "start_treatment"
  | "open_referral_form"
  | "print_referral"
  | "new_patient"
  | "view_reports"
  | "view_activity";

export interface ActivityLogRow {
  id?: number;
  created_at: string;
  event_type: ActivityEventType;
  actor: string | null;
  village: string | null;
  patient_name: string | null;
  metadata: Record<string, unknown> | null;
}

export interface ActivitySummary {
  total: number;
  assessCompleted: number;
  referrals: number;
  treatments: number;
  prints: number;
  newPatients: number;
  pageViews: number;
}

export function summarizeActivity(rows: ActivityLogRow[]): ActivitySummary {
  const summary: ActivitySummary = {
    total: rows.length,
    assessCompleted: 0,
    referrals: 0,
    treatments: 0,
    prints: 0,
    newPatients: 0,
    pageViews: 0,
  };

  for (const row of rows) {
    switch (row.event_type) {
      case "assess_completed":
        summary.assessCompleted += 1;
        break;
      case "teleconsultation_call":
      case "schedule_teleconsultation":
        summary.referrals += 1;
        break;
      case "start_treatment":
        summary.treatments += 1;
        break;
      case "print_referral":
        summary.prints += 1;
        break;
      case "new_patient":
        summary.newPatients += 1;
        break;
      case "view_reports":
      case "view_activity":
        summary.pageViews += 1;
        break;
    }
  }

  return summary;
}

export function filterActivitySince(
  rows: ActivityLogRow[],
  sinceMs: number,
): ActivityLogRow[] {
  return rows.filter((row) => {
    const t = Date.parse(row.created_at);
    return !Number.isNaN(t) && t >= sinceMs;
  });
}
