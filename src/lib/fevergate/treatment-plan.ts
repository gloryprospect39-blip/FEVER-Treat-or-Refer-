import type {
  FebrileAssessment,
  PatientContext,
  ReferralUrgency,
} from "@/lib/decision-engine/models";
import { DANGER_SIGN_LABELS } from "@/lib/decision-engine/models";

const EXTRA: Record<string, string> = {
  neonate_fever: DANGER_SIGN_LABELS.neonate_fever,
  hypoxia: "Low oxygen saturation",
  hypotension_adult: "Low blood pressure",
  hypotension_pediatric: "Low blood pressure",
  weak_or_absent_radial_pulse: "Weak or absent pulse",
  "qsofa>=2": "Elevated qSOFA",
  "composite_sepsis_score>=3": "Elevated sepsis screen",
};

export function urgencyPhrase(urgency: ReferralUrgency): string {
  if (urgency === "immediate") return "refer immediately";
  if (urgency === "same_day") return "refer (same day)";
  return "refer";
}

export function buildReferReason(
  referralReasons: string[],
  urgency: ReferralUrgency,
): string {
  const named: string[] = [];
  for (const code of referralReasons) {
    if (code === "convulsions") continue;
    let label = DANGER_SIGN_LABELS[code] ?? EXTRA[code];
    if (!label && code.startsWith("news2>=")) label = "Elevated NEWS2";
    if (label && !named.includes(label)) named.push(label);
  }
  const subject = named.length
    ? named.join(", ")
    : "Elevated severe-illness screen";
  return `${subject} — ${urgencyPhrase(urgency)}.`;
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
  if (ageMonths < 60) {
    return "weight-based ACT (artemether-lumefantrine) per national under-5 protocol";
  }
  if (ageMonths < 144) {
    return "weight-based ACT (artemether-lumefantrine) per national child protocol";
  }
  return "adult ACT course (artemether-lumefantrine) per national protocol";
}

function presumptiveMalariaPlan(
  ctx: PatientContext,
  clinic: ClinicContext,
): [string, string] | null {
  if (!ctx.has_fever) return null;
  if (clinic.malaria_endemicity !== "high") return null;
  if (!clinic.act_in_stock) {
    return [
      "Presumptive malaria treatment indicated but ACT not in stock.",
      "Refer for ACT or obtain stock before treating presumptive malaria.",
    ];
  }
  const dose = actDoseBand(ctx.age_months);
  const feverSupport = clinic.paracetamol_in_stock
    ? " Give paracetamol for fever."
    : "";
  return [
    `Give presumptive ACT: ${dose}.`,
    `Uncomplicated fever in malaria-endemic area — start ${dose} now.${feverSupport} No rapid test required per presumptive-treatment guidelines.`,
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
      summary: "Do not start outpatient treatment.",
      detail:
        "Arrange urgent transport to referral facility. Stabilize per local protocol while awaiting teleconsultation.",
      primaryActionLabel: "Call teleconsultation now",
    };
  }

  const malaria = presumptiveMalariaPlan(ctx, clinic);

  if (decision === "TREAT_AND_MONITOR") {
    const days = assessment.monitoring_days;
    if (malaria) {
      const [summary, detail] = malaria;
      return {
        summary,
        detail: `${detail} Re-check this patient in ${days} days.`,
        primaryActionLabel: "Schedule teleconsultation",
      };
    }
    if (ctx.has_fever && clinic.paracetamol_in_stock) {
      return {
        summary: "Give paracetamol for fever.",
        detail: `Supportive care for uncomplicated fever. Re-check in ${days} days; return sooner if danger signs appear.`,
        primaryActionLabel: "Schedule teleconsultation",
      };
    }
    return {
      summary: "Supportive care and close observation.",
      detail: `Monitor at home. Re-check in ${days} days; return sooner if condition worsens.`,
      primaryActionLabel: "Schedule teleconsultation",
    };
  }

  if (malaria) {
    const [summary, detail] = malaria;
    return { summary, detail, primaryActionLabel: "Start treatment" };
  }
  if (!ctx.has_fever) {
    return {
      summary: "No antimalarial indicated.",
      detail:
        "Low-risk screen without fever — routine care; counsel on return if fever develops.",
      primaryActionLabel: "Start treatment",
    };
  }
  if (clinic.paracetamol_in_stock) {
    return {
      summary: "Give paracetamol for fever.",
      detail:
        "Supportive care for low-risk febrile illness without presumptive malaria indication.",
      primaryActionLabel: "Start treatment",
    };
  }
  return {
    summary: "Supportive care.",
    detail:
      "Low-risk screen — rest, fluids, and counsel on return if danger signs appear.",
    primaryActionLabel: "Start treatment",
  };
}

export const TELECONSULTATION_NUMBER = "+255800000000";

export function teleconsultationDialUrl(): string {
  return `tel:${TELECONSULTATION_NUMBER.replace(/\s/g, "")}`;
}

export function scheduleTeleconsultationNote(monitoringDays: number): string {
  return `Teleconsultation scheduled for day ${monitoringDays} follow-up. Call ${TELECONSULTATION_NUMBER} if condition worsens sooner.`;
}

export function requireCatchment(value: string): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) throw new Error("catchment is required");
  return normalized;
}
