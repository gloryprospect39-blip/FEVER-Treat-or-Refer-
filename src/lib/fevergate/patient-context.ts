import type {
  Comorbidity,
  ConsciousnessLevel,
  DangerSigns,
  PatientContext,
} from "@/lib/decision-engine/models";
import { dangerSignTilesForPathway } from "./danger-signs";
import { filterComorbiditiesForBand } from "./comorbidities";
import { AGE_BANDS } from "./pathways";

export function buildPatientContext(input: {
  pathway: string;
  ageBand: string;
  hasFever: boolean;
  feverDurationDays: number;
  selectedTiles: Record<string, boolean>;
  comorbidities?: Comorbidity[];
  temperatureC?: number | null;
  heartRate?: number | null;
  systolicBp?: number | null;
  spo2Percent?: number | null;
  respiratoryRate?: number | null;
}): PatientContext {
  const dangerSigns: DangerSigns = {};
  let consciousness: ConsciousnessLevel = "alert";

  for (const tile of dangerSignTilesForPathway(input.pathway)) {
    if (!input.selectedTiles[tile.triggerCode]) continue;
    if (tile.dangerField) {
      dangerSigns[tile.dangerField] = true;
    }
    if (tile.consciousness === "unconscious") {
      consciousness = "unconscious";
    } else if (
      tile.consciousness === "lethargic" &&
      consciousness !== "unconscious"
    ) {
      consciousness = "lethargic";
    }
  }

  const temperatureC = input.temperatureC ?? null;
  let hasFever = input.hasFever;
  if (temperatureC != null) {
    hasFever = temperatureC >= 38.0;
  }

  return {
    age_months: AGE_BANDS[input.ageBand] ?? 24,
    has_fever: hasFever,
    fever_duration_days: input.feverDurationDays,
    consciousness,
    toxic_appearance: false,
    comorbidities: filterComorbiditiesForBand(
      input.ageBand,
      input.comorbidities ?? [],
    ),
    danger_signs: dangerSigns,
    vitals: {
      temperature_c: temperatureC,
      heart_rate: input.heartRate ?? null,
      systolic_bp: input.systolicBp ?? null,
      spo2_percent: input.spo2Percent ?? null,
      respiratory_rate: input.respiratoryRate ?? null,
      weak_or_absent_radial_pulse: false,
    },
  };
}
