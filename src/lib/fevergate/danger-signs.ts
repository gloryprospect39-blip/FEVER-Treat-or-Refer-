import type { LucideIcon } from "lucide-react";
import { TriangleAlert } from "lucide-react";

import { mm } from "@/lib/i18n/mm";
import { isPediatricPathway, PATHWAY_ADULT } from "./pathways";

/** Shared icon for every danger-sign tile (unified visual language). */
export const DANGER_SIGN_ICON: LucideIcon = TriangleAlert;

export interface DangerSignTile {
  triggerCode: string;
  icon: LucideIcon;
  label: string;
  dangerField?: keyof import("@/lib/decision-engine/models").DangerSigns;
  consciousness?: "lethargic" | "unconscious";
}

function tile(
  partial: Omit<DangerSignTile, "icon">,
): DangerSignTile {
  return { ...partial, icon: DANGER_SIGN_ICON };
}

/** IMCI danger signs — pediatric pathway (under 15). */
export const PEDIATRIC_DANGER_SIGN_TILES: DangerSignTile[] = [
  tile({
    triggerCode: "imci:convulsions",
    label: mm.dangerSigns.convulsions,
    dangerField: "convulsions",
  }),
  tile({
    triggerCode: "imci:vomits_everything",
    label: mm.dangerSigns.vomitsEverything,
    dangerField: "vomits_everything",
  }),
  tile({
    triggerCode: "imci:unconscious",
    label: mm.dangerSigns.unconscious,
    consciousness: "unconscious",
  }),
  tile({
    triggerCode: "imci:lethargic",
    label: mm.dangerSigns.lethargic,
    consciousness: "lethargic",
  }),
  tile({
    triggerCode: "imci:chest_indrawing",
    label: mm.dangerSigns.chestIndrawing,
    dangerField: "chest_indrawing",
  }),
  tile({
    triggerCode: "imci:stiff_neck",
    label: mm.dangerSigns.stiffNeck,
    dangerField: "stiff_neck",
  }),
  tile({
    triggerCode: "imci:bulging_fontanelle",
    label: mm.dangerSigns.bulgingFontanelle,
    dangerField: "bulging_fontanelle",
  }),
  tile({
    triggerCode: "imci:severe_palmar_pallor",
    label: mm.dangerSigns.severePallor,
    dangerField: "severe_palmar_pallor",
  }),
  tile({
    triggerCode: "imci:unable_to_drink_or_breastfeed",
    label: mm.dangerSigns.unableToDrinkPediatric,
    dangerField: "unable_to_drink_or_breastfeed",
  }),
];

/** Adult pathway — excludes infant-specific signs (fontanelle, chest indrawing). */
export const ADULT_DANGER_SIGN_TILES: DangerSignTile[] = [
  tile({
    triggerCode: "imci:convulsions",
    label: mm.dangerSigns.convulsions,
    dangerField: "convulsions",
  }),
  tile({
    triggerCode: "imci:vomits_everything",
    label: mm.dangerSigns.vomitsEverything,
    dangerField: "vomits_everything",
  }),
  tile({
    triggerCode: "imci:unconscious",
    label: mm.dangerSigns.unconscious,
    consciousness: "unconscious",
  }),
  tile({
    triggerCode: "imci:lethargic",
    label: mm.dangerSigns.lethargic,
    consciousness: "lethargic",
  }),
  tile({
    triggerCode: "imci:stiff_neck",
    label: mm.dangerSigns.stiffNeck,
    dangerField: "stiff_neck",
  }),
  tile({
    triggerCode: "imci:severe_palmar_pallor",
    label: mm.dangerSigns.severePallor,
    dangerField: "severe_palmar_pallor",
  }),
  tile({
    triggerCode: "imci:unable_to_drink_or_breastfeed",
    label: mm.dangerSigns.unableToDrinkAdult,
    dangerField: "unable_to_drink_or_breastfeed",
  }),
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
