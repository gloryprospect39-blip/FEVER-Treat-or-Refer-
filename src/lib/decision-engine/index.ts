import type { FebrileAssessment, PatientContext } from "./models";
import { assessSepsisRisk } from "./sepsis-screen";

const MONITORING_DAYS: Record<string, number> = {
  REFER_IMMEDIATE: 0,
  REFER: 0,
  TREAT_AND_MONITOR: 3,
  TREAT: 0,
};

export function evaluateFebrilePatient(ctx: PatientContext): FebrileAssessment {
  const sepsis = assessSepsisRisk(ctx);

  const referralReasons = [...sepsis.hard_referral_triggers];
  if (sepsis.decision === "REFER" || sepsis.decision === "REFER_IMMEDIATE") {
    if (sepsis.qsofa_score != null && sepsis.qsofa_score >= 2) {
      referralReasons.push("qsofa>=2");
    }
    if (sepsis.news2_score != null && sepsis.news2_score >= 5) {
      referralReasons.push(`news2>=${sepsis.news2_score}`);
    }
    if (sepsis.score >= 3) {
      referralReasons.push("composite_sepsis_score>=3");
    }
  }

  const rationale = [
    "Screening for severe illness without laboratory tests.",
    ...sepsis.rationale,
  ];
  if (sepsis.score_components.length) {
    rationale.push(`Score components: ${sepsis.score_components.join(", ")}`);
  }

  return {
    sepsis,
    decision: sepsis.decision,
    urgency: sepsis.urgency,
    monitoring_days: MONITORING_DAYS[sepsis.decision],
    referral_reasons: [...new Set(referralReasons)].sort(),
    rationale,
  };
}

export * from "./models";
export { assessSepsisRisk } from "./sepsis-screen";
