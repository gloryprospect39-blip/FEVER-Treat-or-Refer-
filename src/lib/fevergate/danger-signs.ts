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

import { DANGER_SIGN_LABELS } from "@/lib/decision-engine/models";

export interface DangerSignTile {
  triggerCode: string;
  icon: LucideIcon;
  label: string;
  dangerField?: keyof import("@/lib/decision-engine/models").DangerSigns;
  consciousness?: "lethargic" | "unconscious";
}

export const DANGER_SIGN_TILES: DangerSignTile[] = [
  {
    triggerCode: "imci:convulsions",
    icon: Zap,
    label: DANGER_SIGN_LABELS["imci:convulsions"],
    dangerField: "convulsions",
  },
  {
    triggerCode: "imci:unable_to_drink_or_breastfeed",
    icon: Droplets,
    label: DANGER_SIGN_LABELS["imci:unable_to_drink_or_breastfeed"],
    dangerField: "unable_to_drink_or_breastfeed",
  },
  {
    triggerCode: "imci:vomits_everything",
    icon: Waves,
    label: DANGER_SIGN_LABELS["imci:vomits_everything"],
    dangerField: "vomits_everything",
  },
  {
    triggerCode: "imci:lethargic",
    icon: Moon,
    label: DANGER_SIGN_LABELS["imci:lethargic"],
    consciousness: "lethargic",
  },
  {
    triggerCode: "imci:unconscious",
    icon: Skull,
    label: DANGER_SIGN_LABELS["imci:unconscious"],
    consciousness: "unconscious",
  },
  {
    triggerCode: "imci:chest_indrawing",
    icon: Stethoscope,
    label: DANGER_SIGN_LABELS["imci:chest_indrawing"],
    dangerField: "chest_indrawing",
  },
  {
    triggerCode: "imci:stiff_neck",
    icon: Brain,
    label: DANGER_SIGN_LABELS["imci:stiff_neck"],
    dangerField: "stiff_neck",
  },
  {
    triggerCode: "imci:bulging_fontanelle",
    icon: Baby,
    label: DANGER_SIGN_LABELS["imci:bulging_fontanelle"],
    dangerField: "bulging_fontanelle",
  },
  {
    triggerCode: "imci:severe_palmar_pallor",
    icon: Droplets,
    label: DANGER_SIGN_LABELS["imci:severe_palmar_pallor"],
    dangerField: "severe_palmar_pallor",
  },
];
