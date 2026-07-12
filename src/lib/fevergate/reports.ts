import type { EncounterRow } from "@/lib/db/encounters";
import type { TriageDecision } from "@/lib/decision-engine/models";

/** Age (in months) at/above which a patient is on the adult pathway (15 years). */
const ADULT_AGE_MONTHS = 180;

export function isChildEncounter(row: EncounterRow): boolean {
  return (row.patient?.age_months ?? 0) < ADULT_AGE_MONTHS;
}

export function isReferral(decision: TriageDecision): boolean {
  return decision === "REFER" || decision === "REFER_IMMEDIATE";
}

export interface EncounterSummary {
  total: number;
  referImmediate: number;
  refer: number;
  treatMonitor: number;
  treat: number;
  referrals: number;
  children: number;
  adults: number;
}

export function summarizeEncounters(rows: EncounterRow[]): EncounterSummary {
  const summary: EncounterSummary = {
    total: rows.length,
    referImmediate: 0,
    refer: 0,
    treatMonitor: 0,
    treat: 0,
    referrals: 0,
    children: 0,
    adults: 0,
  };

  for (const row of rows) {
    const decision = row.assessment?.decision;
    switch (decision) {
      case "REFER_IMMEDIATE":
        summary.referImmediate += 1;
        break;
      case "REFER":
        summary.refer += 1;
        break;
      case "TREAT_AND_MONITOR":
        summary.treatMonitor += 1;
        break;
      case "TREAT":
        summary.treat += 1;
        break;
    }
    if (decision && isReferral(decision)) summary.referrals += 1;
    if (isChildEncounter(row)) summary.children += 1;
    else summary.adults += 1;
  }

  return summary;
}

export function filterSince(rows: EncounterRow[], sinceMs: number): EncounterRow[] {
  return rows.filter((row) => {
    const t = Date.parse(row.timestamp);
    return !Number.isNaN(t) && t >= sinceMs;
  });
}

export function startOfToday(now = new Date()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Midnight 6 days ago → covers today + previous 6 days (a rolling 7-day week). */
export function startOfWeek(now = new Date()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 6);
  return d.getTime();
}
