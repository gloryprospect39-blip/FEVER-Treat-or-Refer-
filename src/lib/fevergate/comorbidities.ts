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
import { mm } from "@/lib/i18n/mm";
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
    system: mm.comorbidity.systemBlood,
    icon: Droplets,
    label: mm.comorbidity.sickleCell,
  },
  {
    comorbidity: "severe_malnutrition",
    system: mm.comorbidity.systemNutrition,
    icon: Leaf,
    label: mm.comorbidity.severeMalnutrition,
  },
];

const ADULT: ComorbidityOption[] = [
  {
    comorbidity: "chronic_heart_disease",
    system: mm.comorbidity.systemHeart,
    icon: Heart,
    label: mm.comorbidity.chronicHeart,
  },
  {
    comorbidity: "chronic_lung_disease",
    system: mm.comorbidity.systemLungs,
    icon: Wind,
    label: mm.comorbidity.chronicLung,
  },
  {
    comorbidity: "chronic_kidney_disease",
    system: mm.comorbidity.systemKidneys,
    icon: Activity,
    label: mm.comorbidity.chronicKidney,
  },
  {
    comorbidity: "hiv",
    system: mm.comorbidity.systemImmune,
    icon: Shield,
    label: mm.comorbidity.hiv,
  },
  {
    comorbidity: "immunosuppression",
    system: mm.comorbidity.systemImmune,
    icon: Shield,
    label: mm.comorbidity.immunosuppression,
  },
  {
    comorbidity: "sickle_cell",
    system: mm.comorbidity.systemBlood,
    icon: Droplets,
    label: mm.comorbidity.sickleCell,
  },
  {
    comorbidity: "severe_malnutrition",
    system: mm.comorbidity.systemNutrition,
    icon: Leaf,
    label: mm.comorbidity.severeMalnutrition,
  },
  {
    comorbidity: "pregnancy",
    system: mm.comorbidity.systemOther,
    icon: Baby,
    label: mm.comorbidity.pregnancy,
  },
  {
    comorbidity: "recent_surgery_or_wound",
    system: mm.comorbidity.systemOther,
    icon: Bandage,
    label: mm.comorbidity.recentSurgery,
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
