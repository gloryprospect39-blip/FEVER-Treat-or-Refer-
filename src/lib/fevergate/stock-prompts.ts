import type {
  FebrileAssessment,
  PatientContext,
} from "@/lib/decision-engine/models";

import type { ClinicContext, MalariaEndemicity } from "./treatment-plan";

export type StockDrug = "act" | "paracetamol";

export interface SessionStock {
  act: boolean;
  paracetamol: boolean;
}

export function stockDrugsNeeded(
  ctx: PatientContext,
  assessment: FebrileAssessment,
  endemicity: MalariaEndemicity,
): StockDrug[] {
  const decision = assessment.decision;
  if (decision !== "TREAT" && decision !== "TREAT_AND_MONITOR") return [];
  if (!ctx.has_fever) return [];

  const drugs: StockDrug[] = [];
  if (endemicity === "high") drugs.push("act");
  drugs.push("paracetamol");
  return drugs;
}

export function needsStockPrompt(
  ctx: PatientContext,
  assessment: FebrileAssessment,
  endemicity: MalariaEndemicity,
): boolean {
  return stockDrugsNeeded(ctx, assessment, endemicity).length > 0;
}

export function buildClinicWithStock(
  endemicity: MalariaEndemicity,
  stock: SessionStock,
): ClinicContext {
  return {
    malaria_endemicity: endemicity,
    act_in_stock: stock.act,
    paracetamol_in_stock: stock.paracetamol,
    amoxicillin_in_stock: false,
  };
}

export function sessionStockForDrugs(
  session: SessionStock,
  needed: StockDrug[],
): SessionStock {
  return {
    act: needed.includes("act") ? session.act : true,
    paracetamol: needed.includes("paracetamol")
      ? session.paracetamol
      : true,
  };
}

export function stockAnswersComplete(
  needed: StockDrug[],
  answers: Partial<SessionStock>,
): answers is SessionStock {
  if (needed.includes("act") && answers.act === undefined) return false;
  if (needed.includes("paracetamol") && answers.paracetamol === undefined) {
    return false;
  }
  return true;
}
