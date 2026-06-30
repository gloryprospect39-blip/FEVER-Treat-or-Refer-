export type ConsciousnessLevel = "alert" | "irritable" | "lethargic" | "unconscious";

export type TriageDecision =
  | "REFER_IMMEDIATE"
  | "REFER"
  | "TREAT_AND_MONITOR"
  | "TREAT";

export type ReferralUrgency = "immediate" | "same_day" | "routine";

export type Comorbidity =
  | "hiv"
  | "immunosuppression"
  | "severe_malnutrition"
  | "sickle_cell"
  | "chronic_heart_disease"
  | "chronic_lung_disease"
  | "chronic_kidney_disease"
  | "pregnancy"
  | "recent_surgery_or_wound";

export const DANGER_SIGN_LABELS: Record<string, string> = {
  "imci:unable_to_drink_or_breastfeed": "Unable to drink or breastfeed",
  "imci:vomits_everything": "Vomits everything",
  "imci:convulsions": "Convulsions",
  "imci:lethargic": "Lethargic",
  "imci:unconscious": "Unconscious",
  "imci:chest_indrawing": "Chest indrawing",
  "imci:stiff_neck": "Stiff neck",
  "imci:bulging_fontanelle": "Bulging fontanelle",
  "imci:severe_palmar_pallor": "Severe palmar pallor",
  neonate_fever: "Neonate with fever",
};

export interface VitalSigns {
  temperature_c?: number | null;
  heart_rate?: number | null;
  respiratory_rate?: number | null;
  systolic_bp?: number | null;
  spo2_percent?: number | null;
  weak_or_absent_radial_pulse?: boolean;
}

export interface DangerSigns {
  unable_to_drink_or_breastfeed?: boolean;
  vomits_everything?: boolean;
  convulsions?: boolean;
  chest_indrawing?: boolean;
  stiff_neck?: boolean;
  bulging_fontanelle?: boolean;
  severe_palmar_pallor?: boolean;
}

export interface PatientContext {
  age_months: number;
  has_fever: boolean;
  fever_duration_days: number;
  consciousness: ConsciousnessLevel;
  toxic_appearance?: boolean;
  comorbidities: Comorbidity[];
  vitals: VitalSigns;
  danger_signs: DangerSigns;
}

export interface SepsisScreenResult {
  score: number;
  qsofa_score: number | null;
  news2_score: number | null;
  hard_referral_triggers: string[];
  score_components: string[];
  decision: TriageDecision;
  urgency: ReferralUrgency;
  rationale: string[];
}

export interface FebrileAssessment {
  sepsis: SepsisScreenResult;
  decision: TriageDecision;
  urgency: ReferralUrgency;
  monitoring_days: number;
  referral_reasons: string[];
  rationale: string[];
}

export const defaultVitals = (): VitalSigns => ({
  weak_or_absent_radial_pulse: false,
});

export const defaultDangerSigns = (): DangerSigns => ({});
