import type { LucideIcon } from "lucide-react";
import { CircleAlert } from "lucide-react";

import type { Comorbidity } from "@/lib/decision-engine/models";
import { mm } from "@/lib/i18n/mm";
import { isAdultPathway, isPediatricPathway } from "./pathways";

/** Shared icon for every comorbidity tile (unified visual language). */
export const COMORBIDITY_ICON: LucideIcon = CircleAlert;

export interface ComorbidityOption {
  comorbidity: Comorbidity;
  system: string;
  icon: LucideIcon;
  label: string;
}

function withSharedIcon(
  partial: Omit<ComorbidityOption, "icon">,
): ComorbidityOption {
  return { ...partial, icon: COMORBIDITY_ICON };
}

const PEDIATRIC: ComorbidityOption[] = [
  withSharedIcon({
    comorbidity: "sickle_cell",
    system: mm.comorbidity.systemBlood,
    label: mm.comorbidity.sickleCell,
  }),
  withSharedIcon({
    comorbidity: "severe_malnutrition",
    system: mm.comorbidity.systemNutrition,
    label: mm.comorbidity.severeMalnutrition,
  }),
];

const ADULT: ComorbidityOption[] = [
  withSharedIcon({
    comorbidity: "chronic_heart_disease",
    system: mm.comorbidity.systemHeart,
    label: mm.comorbidity.chronicHeart,
  }),
  withSharedIcon({
    comorbidity: "chronic_lung_disease",
    system: mm.comorbidity.systemLungs,
    label: mm.comorbidity.chronicLung,
  }),
  withSharedIcon({
    comorbidity: "chronic_kidney_disease",
    system: mm.comorbidity.systemKidneys,
    label: mm.comorbidity.chronicKidney,
  }),
  withSharedIcon({
    comorbidity: "hiv",
    system: mm.comorbidity.systemImmune,
    label: mm.comorbidity.hiv,
  }),
  withSharedIcon({
    comorbidity: "immunosuppression",
    system: mm.comorbidity.systemImmune,
    label: mm.comorbidity.immunosuppression,
  }),
  withSharedIcon({
    comorbidity: "sickle_cell",
    system: mm.comorbidity.systemBlood,
    label: mm.comorbidity.sickleCell,
  }),
  withSharedIcon({
    comorbidity: "severe_malnutrition",
    system: mm.comorbidity.systemNutrition,
    label: mm.comorbidity.severeMalnutrition,
  }),
  withSharedIcon({
    comorbidity: "pregnancy",
    system: mm.comorbidity.systemOther,
    label: mm.comorbidity.pregnancy,
  }),
  withSharedIcon({
    comorbidity: "recent_surgery_or_wound",
    system: mm.comorbidity.systemOther,
    label: mm.comorbidity.recentSurgery,
  }),
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
