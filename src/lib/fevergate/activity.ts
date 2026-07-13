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

export function startOfDayMs(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function endOfDayMs(date: Date): number {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function filterActivityBetween(
  rows: ActivityLogRow[],
  fromMs: number | null,
  toMs: number | null,
): ActivityLogRow[] {
  return rows.filter((row) => {
    const t = Date.parse(row.created_at);
    if (Number.isNaN(t)) return false;
    if (fromMs != null && t < fromMs) return false;
    if (toMs != null && t > toMs) return false;
    return true;
  });
}

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateInputValue(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function activityRowsToCsv(
  rows: ActivityLogRow[],
  labels: {
    headers: {
      time: string;
      event: string;
      actor: string;
      village: string;
      patient: string;
      details: string;
    };
    eventLabel: (eventType: ActivityEventType) => string;
    unnamedPatient: string;
    metadataSummary: (row: ActivityLogRow) => string;
  },
): string {
  const header = [
    labels.headers.time,
    labels.headers.event,
    labels.headers.actor,
    labels.headers.village,
    labels.headers.patient,
    labels.headers.details,
  ]
    .map(csvEscape)
    .join(",");

  const lines = rows.map((row) =>
    [
      new Date(row.created_at).toLocaleString("en-GB"),
      labels.eventLabel(row.event_type),
      row.actor ?? "",
      row.village ?? "",
      row.patient_name || labels.unnamedPatient,
      labels.metadataSummary(row),
    ]
      .map((cell) => csvEscape(String(cell)))
      .join(","),
  );

  return [header, ...lines].join("\r\n");
}

export function downloadTextFile(
  contents: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
