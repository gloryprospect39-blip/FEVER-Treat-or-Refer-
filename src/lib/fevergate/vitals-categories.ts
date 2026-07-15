export type VitalKey =
  | "temperature_c"
  | "heart_rate"
  | "systolic_bp"
  | "spo2_percent"
  | "respiratory_rate";

export interface VitalClinicalOption {
  id: string;
  label: string;
  value: number;
}

export type VitalCategorySelection = Record<VitalKey, string>;

export const EMPTY_VITAL_SELECTIONS = (): VitalCategorySelection => ({
  temperature_c: "",
  heart_rate: "",
  systolic_bp: "",
  spo2_percent: "",
  respiratory_rate: "",
});

function ageBand(ageMonths: number): string {
  if (ageMonths < 2) return "neonate";
  if (ageMonths < 60) return "under5";
  if (ageMonths < 144) return "child_5_12";
  if (ageMonths < 216) return "adolescent";
  if (ageMonths >= 780) return "elderly";
  return "adult";
}

function heartRateThreshold(ageMonths: number): number {
  const map: Record<string, number> = {
    neonate: 160,
    under5: 140,
    child_5_12: 120,
    adolescent: 100,
    adult: 100,
    elderly: 100,
  };
  return map[ageBand(ageMonths)];
}

function respiratoryRateThreshold(ageMonths: number): number {
  const map: Record<string, number> = {
    neonate: 60,
    under5: 40,
    child_5_12: 30,
    adolescent: 20,
    adult: 20,
    elderly: 20,
  };
  return map[ageBand(ageMonths)];
}

/** English clinical bands aligned with engine scoring (NEWS2, qSOFA, composite, hard refer). */
export function vitalOptionsFor(
  key: VitalKey,
  ageMonths: number,
): VitalClinicalOption[] {
  switch (key) {
    case "temperature_c":
      return temperatureOptions();
    case "spo2_percent":
      return spo2Options();
    case "respiratory_rate":
      return ageMonths >= 144
        ? adultRespiratoryOptions()
        : pediatricRespiratoryOptions(ageMonths);
    case "systolic_bp":
      return ageMonths >= 144
        ? adultBloodPressureOptions()
        : pediatricBloodPressureOptions(ageMonths);
    case "heart_rate":
      return ageMonths >= 144
        ? adultHeartRateOptions()
        : pediatricHeartRateOptions(ageMonths);
  }
}

function temperatureOptions(): VitalClinicalOption[] {
  return [
    {
      id: "temp_36_38",
      label: "36.1–38.0 °C — normal (NEWS2 0)",
      value: 37.0,
    },
    {
      id: "temp_35_36",
      label: "35.1–36.0 °C — low temperature (NEWS2 +1)",
      value: 35.5,
    },
    {
      id: "temp_hypothermia",
      label: "≤35.0 °C — hypothermia (NEWS2 +3; composite +2)",
      value: 35.0,
    },
    {
      id: "temp_38_39",
      label: "38.1–39.0 °C — fever (NEWS2 +1)",
      value: 38.5,
    },
    {
      id: "temp_high_fever",
      label: "≥39.1 °C — high fever (NEWS2 +2; composite +1)",
      value: 39.6,
    },
  ];
}

function spo2Options(): VitalClinicalOption[] {
  return [
    { id: "spo2_96_plus", label: "≥96% — normal (NEWS2 0)", value: 98 },
    { id: "spo2_94_95", label: "94–95% — mild hypoxia (NEWS2 +1)", value: 94 },
    { id: "spo2_92_93", label: "92–93% — moderate hypoxia (NEWS2 +2)", value: 92 },
    {
      id: "spo2_91",
      label: "≤91% — severe hypoxia (NEWS2 +3)",
      value: 91,
    },
    {
      id: "spo2_hypoxia_refer",
      label: "<90% — hypoxia (hard refer)",
      value: 88,
    },
  ];
}

function adultRespiratoryOptions(): VitalClinicalOption[] {
  return [
    { id: "rr_12_20", label: "12–20 /min — normal (NEWS2 0)", value: 16 },
    { id: "rr_9_11", label: "9–11 /min — bradypnea (NEWS2 +1)", value: 10 },
    { id: "rr_le_8", label: "≤8 /min — severe bradypnea (NEWS2 +3)", value: 8 },
    {
      id: "rr_21_24",
      label: "21–24 /min — tachypnea (NEWS2 +2; qSOFA +1 if ≥22)",
      value: 22,
    },
    {
      id: "rr_ge_25",
      label: "≥25 /min — severe tachypnea (NEWS2 +3)",
      value: 26,
    },
  ];
}

function pediatricRespiratoryOptions(ageMonths: number): VitalClinicalOption[] {
  const t = respiratoryRateThreshold(ageMonths);
  const band = ageBand(ageMonths);
  return [
    {
      id: "rr_ped_normal",
      label: `≤${t} /min — normal for ${band} (composite 0)`,
      value: Math.max(12, t - 5),
    },
    {
      id: "rr_ped_brady",
      label: `≤${t - 10} /min — very low RR (composite tachypnea rule N/A)`,
      value: Math.max(8, t - 12),
    },
    {
      id: "rr_ped_tachy_mild",
      label: `${t + 1}–${t + 10} /min — above age threshold (composite +1)`,
      value: t + 5,
    },
    {
      id: "rr_ped_tachy_severe",
      label: `>${t + 10} /min — marked tachypnea (composite +1)`,
      value: t + 15,
    },
  ];
}

function adultBloodPressureOptions(): VitalClinicalOption[] {
  return [
    { id: "sbp_ge_111", label: "≥111 mmHg — normal (NEWS2 0)", value: 120 },
    { id: "sbp_101_110", label: "101–110 mmHg — low-normal (NEWS2 +1)", value: 105 },
    {
      id: "sbp_91_100",
      label: "91–100 mmHg — hypotension (NEWS2 +2; qSOFA +1 if ≤100)",
      value: 95,
    },
    {
      id: "sbp_le_90",
      label: "≤90 mmHg — severe hypotension (NEWS2 +3; qSOFA +1; refer)",
      value: 85,
    },
  ];
}

function pediatricBloodPressureOptions(ageMonths: number): VitalClinicalOption[] {
  if (ageMonths < 12) {
    return [
      { id: "sbp_inf_normal", label: "≥90 mmHg — normal for infant", value: 95 },
      { id: "sbp_inf_80_89", label: "80–89 mmHg — low BP", value: 85 },
      { id: "sbp_inf_70_79", label: "70–79 mmHg — hypotension", value: 75 },
      {
        id: "sbp_inf_lt_70",
        label: "<70 mmHg — severe hypotension (hard refer)",
        value: 65,
      },
    ];
  }
  return [
    { id: "sbp_child_normal", label: "≥100 mmHg — normal for child", value: 105 },
    { id: "sbp_child_90_99", label: "90–99 mmHg — low BP", value: 95 },
    { id: "sbp_child_80_89", label: "80–89 mmHg — hypotension", value: 85 },
    {
      id: "sbp_child_lt_80",
      label: "<80 mmHg — severe hypotension (hard refer)",
      value: 70,
    },
  ];
}

function adultHeartRateOptions(): VitalClinicalOption[] {
  const t = 100;
  return [
    { id: "hr_le_40", label: "≤40 /min — severe bradycardia (NEWS2 +3)", value: 38 },
    {
      id: "hr_41_low",
      label: `41–${t - 20} /min — low HR (NEWS2 +1)`,
      value: 55,
    },
    { id: "hr_normal", label: `${t - 19}–${t} /min — normal (NEWS2 0)`, value: 80 },
    {
      id: "hr_tachy_mild",
      label: `${t + 1}–${t + 20} /min — tachycardia (NEWS2 +1)`,
      value: 105,
    },
    {
      id: "hr_tachy_mod",
      label: `${t + 21}–${t + 40} /min — marked tachycardia (NEWS2 +2)`,
      value: 125,
    },
    {
      id: "hr_tachy_severe",
      label: `>${t + 40} /min — severe tachycardia (NEWS2 +3)`,
      value: 145,
    },
  ];
}

function pediatricHeartRateOptions(ageMonths: number): VitalClinicalOption[] {
  const t = heartRateThreshold(ageMonths);
  const band = ageBand(ageMonths);
  return [
    {
      id: "hr_ped_normal",
      label: `≤${t} /min — normal for ${band}`,
      value: Math.max(60, t - 30),
    },
    {
      id: "hr_ped_tachy",
      label: `>${t} /min — tachycardia (composite +1)`,
      value: t + 15,
    },
    {
      id: "hr_ped_marked_tachy",
      label: `>${t + 20} /min — marked tachycardia (composite +1)`,
      value: t + 30,
    },
  ];
}

export function resolveVitalValue(
  key: VitalKey,
  optionId: string | undefined,
  ageMonths: number,
): number | null {
  if (!optionId) return null;
  return (
    vitalOptionsFor(key, ageMonths).find((opt) => opt.id === optionId)?.value ??
    null
  );
}

export function vitalOptionLabel(
  key: VitalKey,
  optionId: string | undefined,
  ageMonths: number,
): string | null {
  if (!optionId) return null;
  return (
    vitalOptionsFor(key, ageMonths).find((opt) => opt.id === optionId)?.label ??
    null
  );
}

export function sanitizeVitalSelections(
  selections: VitalCategorySelection,
  ageMonths: number,
): VitalCategorySelection {
  const next = { ...selections };
  for (const key of Object.keys(next) as VitalKey[]) {
    const validIds = new Set(
      vitalOptionsFor(key, ageMonths).map((opt) => opt.id),
    );
    if (next[key] && !validIds.has(next[key])) next[key] = "";
  }
  return next;
}

export function resolveVitalsFromCategories(
  selections: VitalCategorySelection,
  ageMonths: number,
) {
  return {
    temperatureC: resolveVitalValue(
      "temperature_c",
      selections.temperature_c,
      ageMonths,
    ),
    heartRate: resolveVitalValue("heart_rate", selections.heart_rate, ageMonths),
    systolicBp: resolveVitalValue(
      "systolic_bp",
      selections.systolic_bp,
      ageMonths,
    ),
    spo2Percent: resolveVitalValue(
      "spo2_percent",
      selections.spo2_percent,
      ageMonths,
    ),
    respiratoryRate: resolveVitalValue(
      "respiratory_rate",
      selections.respiratory_rate,
      ageMonths,
    ),
  };
}

export function vitalSelectionLabels(
  selections: VitalCategorySelection,
  ageMonths: number,
): Partial<Record<VitalKey, string>> {
  const labels: Partial<Record<VitalKey, string>> = {};
  for (const key of Object.keys(selections) as VitalKey[]) {
    const label = vitalOptionLabel(key, selections[key], ageMonths);
    if (label) labels[key] = label;
  }
  return labels;
}
