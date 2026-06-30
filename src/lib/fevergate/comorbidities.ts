import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Baby,
  Bandage,
  Droplets,
  Heart,
  Leaf,
  Shield,
  Wind,
} from "lucide-react";

import type { Comorbidity } from "@/lib/decision-engine/models";
import { isAdultPathway, isPediatricPathway } from "./pathways";

export interface ComorbidityOption {
  comorbidity: Comorbidity;
  system: string;
  icon: LucideIcon;
  label: string;
}

const PEDIATRIC: ComorbidityOption[] = [
  {
    comorbidity: "sickle_cell",
    system: "Blood",
    icon: Droplets,
    label: "Sickle cell disease",
  },
  {
    comorbidity: "severe_malnutrition",
    system: "Nutrition",
    icon: Leaf,
    label: "Severe malnutrition",
  },
];

const ADULT: ComorbidityOption[] = [
  {
    comorbidity: "chronic_heart_disease",
    system: "Heart",
    icon: Heart,
    label: "Chronic heart disease",
  },
  {
    comorbidity: "chronic_lung_disease",
    system: "Lungs",
    icon: Wind,
    label: "Chronic lung disease",
  },
  {
    comorbidity: "chronic_kidney_disease",
    system: "Kidneys",
    icon: Activity,
    label: "Chronic kidney disease",
  },
  {
    comorbidity: "hiv",
    system: "Immune",
    icon: Shield,
    label: "HIV",
  },
  {
    comorbidity: "immunosuppression",
    system: "Immune",
    icon: Shield,
    label: "Immunosuppression",
  },
  {
    comorbidity: "sickle_cell",
    system: "Blood",
    icon: Droplets,
    label: "Sickle cell disease",
  },
  {
    comorbidity: "severe_malnutrition",
    system: "Nutrition",
    icon: Leaf,
    label: "Severe malnutrition",
  },
  {
    comorbidity: "pregnancy",
    system: "Other",
    icon: Baby,
    label: "Pregnancy",
  },
  {
    comorbidity: "recent_surgery_or_wound",
    system: "Other",
    icon: Bandage,
    label: "Recent surgery or wound",
  },
];

export function comorbidityOptionsForBand(ageBand: string): ComorbidityOption[] {
  if (isAdultPathway(ageBand)) return ADULT;
  if (isPediatricPathway(ageBand)) return PEDIATRIC;
  return [];
}

export function filterComorbiditiesForBand(
  ageBand: string,
  comorbidities: Comorbidity[],
): Comorbidity[] {
  const allowed = new Set(
    comorbidityOptionsForBand(ageBand).map((o) => o.comorbidity),
  );
  return comorbidities.filter((c) => allowed.has(c));
}

export function optionsBySystem(ageBand: string): Record<string, ComorbidityOption[]> {
  const grouped: Record<string, ComorbidityOption[]> = {};
  for (const option of comorbidityOptionsForBand(ageBand)) {
    grouped[option.system] ??= [];
    grouped[option.system].push(option);
  }
  return grouped;
}
