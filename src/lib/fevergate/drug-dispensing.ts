import type { EncounterRow } from "@/lib/db/encounters";
import type {
  FebrileAssessment,
  PatientContext,
} from "@/lib/decision-engine/models";

import {
  stockDrugsNeeded,
  type StockDrug,
} from "./stock-prompts";
import type { MalariaEndemicity } from "./treatment-plan";

export type DrugDispensingStatus = "given" | "out_of_stock" | "not_indicated";

export type PatientDrugDispensing = Partial<
  Record<StockDrug, DrugDispensingStatus>
>;

export interface DrugStatusCounts {
  given: number;
  out_of_stock: number;
  not_indicated: number;
}

export interface DrugDispensingSummary {
  act: DrugStatusCounts;
  paracetamol: DrugStatusCounts;
  logged: number;
}

const EMPTY_COUNTS = (): DrugStatusCounts => ({
  given: 0,
  out_of_stock: 0,
  not_indicated: 0,
});

export function emptyDrugDispensingSummary(): DrugDispensingSummary {
  return {
    act: EMPTY_COUNTS(),
    paracetamol: EMPTY_COUNTS(),
    logged: 0,
  };
}

export function drugsToLogForPatient(
  ctx: PatientContext,
  assessment: FebrileAssessment,
  endemicity: MalariaEndemicity,
): StockDrug[] {
  return stockDrugsNeeded(ctx, assessment, endemicity);
}

export function dispensingComplete(
  needed: StockDrug[],
  answers: PatientDrugDispensing,
): boolean {
  return needed.every((drug) => answers[drug] !== undefined);
}

export function summarizeDrugDispensing(
  rows: EncounterRow[],
): DrugDispensingSummary {
  const summary = emptyDrugDispensingSummary();

  for (const row of rows) {
    const dispensing = row.drug_dispensing;
    if (!dispensing) continue;

    summary.logged += 1;
    for (const drug of ["act", "paracetamol"] as const) {
      const status = dispensing[drug];
      if (status) summary[drug][status] += 1;
    }
  }

  return summary;
}

export function isTreatAction(action: string | null | undefined): boolean {
  if (!action) return false;
  return (
    action === "start_treatment" || action.startsWith("schedule_teleconsultation")
  );
}
