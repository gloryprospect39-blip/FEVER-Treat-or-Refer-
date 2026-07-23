import type {
  FebrileAssessment,
  PatientContext,
  TriageDecision,
} from "@/lib/decision-engine/models";
import { mm } from "@/lib/i18n/mm";

import {
  buildTreatmentPlan,
  type ClinicContext,
  type TreatmentPlan,
} from "./treatment-plan";

export type ActionableReason = "act_stock_out" | null;

export interface ActionableOutcome {
  clinicalDecision: TriageDecision;
  actionableDecision: TriageDecision;
  actionableReason: ActionableReason;
  treatmentPlan: TreatmentPlan;
  isReferAction: boolean;
}

function actStockOutEscalation(
  ctx: PatientContext,
  assessment: FebrileAssessment,
  clinic: ClinicContext,
): boolean {
  if (!ctx.has_fever) return false;
  if (clinic.malaria_endemicity !== "high") return false;
  if (clinic.act_in_stock) return false;
  const decision = assessment.decision;
  return decision === "TREAT" || decision === "TREAT_AND_MONITOR";
}

export function evaluateActionableOutcome(
  ctx: PatientContext,
  assessment: FebrileAssessment,
  clinic: ClinicContext,
): ActionableOutcome {
  const clinicalDecision = assessment.decision;

  if (actStockOutEscalation(ctx, assessment, clinic)) {
    return {
      clinicalDecision,
      actionableDecision: "REFER",
      actionableReason: "act_stock_out",
      treatmentPlan: {
        summary: mm.treatment.actOutOfStock,
        detail: mm.treatment.actOutOfStockDetail,
        primaryActionLabel: mm.actions.callTeleconsultation,
      },
      isReferAction: true,
    };
  }

  const treatmentPlan = buildTreatmentPlan(ctx, assessment, clinic);
  const isReferAction =
    clinicalDecision === "REFER" || clinicalDecision === "REFER_IMMEDIATE";

  return {
    clinicalDecision,
    actionableDecision: clinicalDecision,
    actionableReason: null,
    treatmentPlan,
    isReferAction,
  };
}
