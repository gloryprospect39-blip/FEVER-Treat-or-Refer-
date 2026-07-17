import type {
  FebrileAssessment,
  PatientContext,
  ReferralUrgency,
} from "@/lib/decision-engine/models";
import { dangerSignLabelMm, dangerSignLabelsMm, mm } from "@/lib/i18n/mm";

const EXTRA: Record<string, string> = {
  neonate_fever: dangerSignLabelsMm.neonate_fever,
  hypoxia: mm.referReason.hypoxia,
  hypotension_adult: mm.referReason.hypotension,
  hypotension_pediatric: mm.referReason.hypotension,
  weak_or_absent_radial_pulse: mm.referReason.weakPulse,
  "qsofa>=2": mm.referReason.elevatedQsofa,
  "composite_sepsis_score>=3": mm.referReason.elevatedSepsisScreen,
};

export function urgencyPhrase(urgency: ReferralUrgency): string {
  if (urgency === "immediate") return mm.referReason.referImmediately;
  if (urgency === "same_day") return mm.referReason.referSameDay;
  if (urgency === "routine") return "";
  return mm.referReason.refer;
}

export function buildReferReason(
  referralReasons: string[],
  urgency: ReferralUrgency,
  pathway?: string,
): string {
  const named: string[] = [];
  for (const code of referralReasons) {
    if (code === "convulsions") continue;
    let label = dangerSignLabelMm(code, pathway) ?? EXTRA[code];
    if (!label && code.startsWith("news2>=")) label = mm.referReason.elevatedNews2;
    if (label && !named.includes(label)) named.push(label);
  }
  const subject = named.length
    ? named.join("၊ ")
    : mm.referReason.elevatedSevereIllness;
  return `${subject} — ${urgencyPhrase(urgency)}။`;
}

export type MalariaEndemicity = "high" | "low";

export interface ClinicContext {
  malaria_endemicity: MalariaEndemicity;
  act_in_stock: boolean;
  amoxicillin_in_stock: boolean;
  paracetamol_in_stock: boolean;
}

export interface TreatmentPlan {
  summary: string;
  detail: string;
  primaryActionLabel: string;
}

function actDoseBand(ageMonths: number): string {
  if (ageMonths < 60) return mm.treatment.actDoseUnder5;
  if (ageMonths < 144) return mm.treatment.actDoseChild;
  return mm.treatment.actDoseAdult;
}

function presumptiveMalariaPlan(
  ctx: PatientContext,
  clinic: ClinicContext,
): [string, string] | null {
  if (!ctx.has_fever) return null;
  if (clinic.malaria_endemicity !== "high") return null;
  if (!clinic.act_in_stock) {
    return [mm.treatment.actOutOfStock, mm.treatment.actOutOfStockDetail];
  }
  const dose = actDoseBand(ctx.age_months);
  const feverSupport = clinic.paracetamol_in_stock
    ? mm.treatment.paracetamolForFever
    : "";
  return [
    mm.treatment.giveAct(dose),
    mm.treatment.actDetail(dose, feverSupport),
  ];
}

export function buildTreatmentPlan(
  ctx: PatientContext,
  assessment: FebrileAssessment,
  clinic: ClinicContext,
): TreatmentPlan {
  const decision = assessment.decision;

  if (decision === "REFER_IMMEDIATE" || decision === "REFER") {
    return {
      summary: mm.treatment.noOutpatient,
      detail: mm.treatment.noOutpatientDetail,
      primaryActionLabel: mm.actions.callTeleconsultation,
    };
  }

  const malaria = presumptiveMalariaPlan(ctx, clinic);

  if (decision === "TREAT_AND_MONITOR") {
    const days = assessment.monitoring_days;
    if (malaria) {
      const [summary, detail] = malaria;
      return {
        summary,
        detail: `${detail}${mm.treatment.recheckInDays(days)}`,
        primaryActionLabel: mm.actions.scheduleTeleconsultation,
      };
    }
    if (ctx.has_fever && clinic.paracetamol_in_stock) {
      return {
        summary: mm.treatment.giveParacetamol,
        detail: mm.treatment.supportiveFever(days),
        primaryActionLabel: mm.actions.scheduleTeleconsultation,
      };
    }
    return {
      summary: mm.treatment.supportiveCare,
      detail: mm.treatment.monitorHome(days),
      primaryActionLabel: mm.actions.scheduleTeleconsultation,
    };
  }

  if (malaria) {
    const [summary, detail] = malaria;
    return { summary, detail, primaryActionLabel: mm.actions.startTreatment };
  }
  if (!ctx.has_fever) {
    return {
      summary: mm.treatment.noAntimalarial,
      detail: mm.treatment.noAntimalarialDetail,
      primaryActionLabel: mm.actions.startTreatment,
    };
  }
  if (clinic.paracetamol_in_stock) {
    return {
      summary: mm.treatment.giveParacetamol,
      detail: mm.treatment.supportiveLowRisk,
      primaryActionLabel: mm.actions.startTreatment,
    };
  }
  return {
    summary: mm.treatment.supportiveGeneral,
    detail: mm.treatment.supportiveGeneralDetail,
    primaryActionLabel: mm.actions.startTreatment,
  };
}

export const TELECONSULTATION_NUMBER = "+255800000000";

export function teleconsultationDialUrl(): string {
  return `tel:${TELECONSULTATION_NUMBER.replace(/\s/g, "")}`;
}

export function scheduleTeleconsultationNote(monitoringDays: number): string {
  return mm.treatment.teleconsultScheduled(
    monitoringDays,
    TELECONSULTATION_NUMBER,
  );
}
