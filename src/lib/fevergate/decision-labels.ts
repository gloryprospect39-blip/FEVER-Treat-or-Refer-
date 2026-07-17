import type { TriageDecision } from "@/lib/decision-engine/models";
import { mm } from "@/lib/i18n/mm";

/** Shared 4-category decision labels for cards, reports, and supervisor charts. */
export function decisionLabel(decision: TriageDecision | string): string {
  switch (decision) {
    case "REFER_IMMEDIATE":
      return mm.result.referImmediate;
    case "REFER":
      return mm.result.refer;
    case "TREAT_AND_MONITOR":
      return mm.result.treatAndMonitor;
    case "TREAT":
      return mm.result.treat;
    default:
      return String(decision);
  }
}
