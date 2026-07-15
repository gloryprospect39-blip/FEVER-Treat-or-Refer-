export type VitalKey =
  | "temperature_c"
  | "heart_rate"
  | "systolic_bp"
  | "spo2_percent"
  | "respiratory_rate";

export type VitalCategory = "normal" | "mild" | "moderate" | "severe";

export const VITAL_KEYS: VitalKey[] = [
  "temperature_c",
  "heart_rate",
  "systolic_bp",
  "spo2_percent",
  "respiratory_rate",
];

export const VITAL_CATEGORIES: VitalCategory[] = [
  "normal",
  "mild",
  "moderate",
  "severe",
];

export type VitalCategorySelection = Record<VitalKey, VitalCategory | "">;

export const EMPTY_VITAL_SELECTIONS = (): VitalCategorySelection => ({
  temperature_c: "",
  heart_rate: "",
  systolic_bp: "",
  spo2_percent: "",
  respiratory_rate: "",
});

function heartRateThreshold(ageMonths: number): number {
  if (ageMonths < 2) return 160;
  if (ageMonths < 60) return 140;
  if (ageMonths < 144) return 120;
  return 100;
}

function respiratoryRateThreshold(ageMonths: number): number {
  if (ageMonths < 2) return 60;
  if (ageMonths < 60) return 40;
  if (ageMonths < 144) return 30;
  return 20;
}

/** Map a severity category to a representative numeric value for the engine. */
export function resolveVitalValue(
  key: VitalKey,
  category: VitalCategory | "" | undefined,
  ageMonths: number,
): number | null {
  if (!category) return null;

  switch (key) {
    case "temperature_c":
      switch (category) {
        case "normal":
          return 37.0;
        case "mild":
          return 38.2;
        case "moderate":
          return 39.6;
        case "severe":
          return 40.0;
      }
      break;
    case "heart_rate": {
      const threshold = heartRateThreshold(ageMonths);
      switch (category) {
        case "normal":
          return Math.max(60, threshold - 40);
        case "mild":
          return threshold + 5;
        case "moderate":
          return threshold + 25;
        case "severe":
          return threshold + 45;
      }
      break;
    }
    case "systolic_bp":
      if (ageMonths >= 144) {
        switch (category) {
          case "normal":
            return 120;
          case "mild":
            return 105;
          case "moderate":
            return 95;
          case "severe":
            return 85;
        }
      }
      if (ageMonths < 12) {
        switch (category) {
          case "normal":
            return 90;
          case "mild":
            return 82;
          case "moderate":
            return 75;
          case "severe":
            return 65;
        }
      }
      switch (category) {
        case "normal":
          return 100;
        case "mild":
          return 88;
        case "moderate":
          return 78;
        case "severe":
          return 68;
      }
      break;
    case "spo2_percent":
      switch (category) {
        case "normal":
          return 98;
        case "mild":
          return 94;
        case "moderate":
          return 92;
        case "severe":
          return 88;
      }
      break;
    case "respiratory_rate": {
      const threshold = respiratoryRateThreshold(ageMonths);
      switch (category) {
        case "normal":
          return Math.max(12, threshold - 10);
        case "mild":
          return threshold + 5;
        case "moderate":
          return threshold + 15;
        case "severe":
          return threshold + 25;
      }
      break;
    }
  }

  return null;
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
