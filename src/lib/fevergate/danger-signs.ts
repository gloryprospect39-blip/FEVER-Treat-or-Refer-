import type { LucideIcon } from "lucide-react";
import {
  Baby,
  Brain,
  Droplets,
  Moon,
  Skull,
  Stethoscope,
  Waves,
  Zap,
} from "lucide-react";

import { mm } from "@/lib/i18n/mm";
import { isPediatricPathway, PATHWAY_ADULT } from "./pathways";

export interface DangerSignTile {
  triggerCode: string;
  icon: LucideIcon;
  label: string;
  dangerField?: keyof import("@/lib/decision-engine/models").DangerSigns;
  consciousness?: "lethargic" | "unconscious";
}

/** IMCI danger signs — pediatric pathway (under 15). */
export const PEDIATRIC_DANGER_SIGN_TILES: DangerSignTile[] = [
  {
    triggerCode: "imci:convulsions",
    icon: Zap,
    label: mm.dangerSigns.convulsions,
    dangerField: "convulsions",
  },
  {
    triggerCode: "imci:vomits_everything",
    icon: Waves,
    label: mm.dangerSigns.vomitsEverything,
    dangerField: "vomits_everything",
  },
  {
    triggerCode: "imci:unconscious",
    icon: Skull,
    label: mm.dangerSigns.unconscious,
    consciousness: "unconscious",
  },
  {
    triggerCode: "imci:lethargic",
    icon: Moon,
    label: mm.dangerSigns.lethargic,
    consciousness: "lethargic",
  },
  {
    triggerCode: "imci:chest_indrawing",
    icon: Stethoscope,
    label: mm.dangerSigns.chestIndrawing,
    dangerField: "chest_indrawing",
  },
  {
    triggerCode: "imci:stiff_neck",
    icon: Brain,
    label: mm.dangerSigns.stiffNeck,
    dangerField: "stiff_neck",
  },
  {
    triggerCode: "imci:bulging_fontanelle",
    icon: Baby,
    label: mm.dangerSigns.bulgingFontanelle,
    dangerField: "bulging_fontanelle",
  },
  {
    triggerCode: "imci:severe_palmar_pallor",
    icon: Droplets,
    label: mm.dangerSigns.severePallor,
    dangerField: "severe_palmar_pallor",
  },
  {
    triggerCode: "imci:unable_to_drink_or_breastfeed",
    icon: Droplets,
    label: mm.dangerSigns.unableToDrinkPediatric,
    dangerField: "unable_to_drink_or_breastfeed",
  },
];

/** Adult pathway — excludes infant-specific signs (fontanelle, chest indrawing). */
export const ADULT_DANGER_SIGN_TILES: DangerSignTile[] = [
  {
    triggerCode: "imci:convulsions",
    icon: Zap,
    label: mm.dangerSigns.convulsions,
    dangerField: "convulsions",
  },
  {
    triggerCode: "imci:vomits_everything",
    icon: Waves,
    label: mm.dangerSigns.vomitsEverything,
    dangerField: "vomits_everything",
  },
  {
    triggerCode: "imci:unconscious",
    icon: Skull,
    label: mm.dangerSigns.unconscious,
    consciousness: "unconscious",
  },
  {
    triggerCode: "imci:lethargic",
    icon: Moon,
    label: mm.dangerSigns.lethargic,
    consciousness: "lethargic",
  },
  {
    triggerCode: "imci:stiff_neck",
    icon: Brain,
    label: mm.dangerSigns.stiffNeck,
    dangerField: "stiff_neck",
  },
  {
    triggerCode: "imci:severe_palmar_pallor",
    icon: Droplets,
    label: mm.dangerSigns.severePallor,
    dangerField: "severe_palmar_pallor",
  },
  {
    triggerCode: "imci:unable_to_drink_or_breastfeed",
    icon: Droplets,
    label: mm.dangerSigns.unableToDrinkAdult,
    dangerField: "unable_to_drink_or_breastfeed",
  },
];

export function dangerSignTilesForPathway(pathway: string): DangerSignTile[] {
  return pathway === PATHWAY_ADULT
    ? ADULT_DANGER_SIGN_TILES
    : PEDIATRIC_DANGER_SIGN_TILES;
}

export function dangerSignTilesForBand(ageBand: string): DangerSignTile[] {
  return isPediatricPathway(ageBand)
    ? PEDIATRIC_DANGER_SIGN_TILES
    : ADULT_DANGER_SIGN_TILES;
}

/** @deprecated Use dangerSignTilesForBand — kept for tests importing a single list. */
export const DANGER_SIGN_TILES = PEDIATRIC_DANGER_SIGN_TILES;
