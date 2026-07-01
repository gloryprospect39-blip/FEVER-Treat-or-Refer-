import { mm } from "@/lib/i18n/mm";

export const AGE_BANDS: Record<string, number> = {
  [mm.age.under2Months]: 1,
  [mm.age.months2to5]: 24,
  [mm.age.years5to15]: 96,
  [mm.age.years15to17]: 192,
  [mm.age.years18to64]: 480,
  [mm.age.years65plus]: 840,
};

export const PATHWAY_CHILD = mm.age.pathwayChild;
export const PATHWAY_ADULT = mm.age.pathwayAdult;

export const CHILD_AGE_BANDS = [
  mm.age.under2Months,
  mm.age.months2to5,
  mm.age.years5to15,
] as const;

export const ADULT_AGE_BANDS = [
  mm.age.years15to17,
  mm.age.years18to64,
  mm.age.years65plus,
] as const;

export function ageBandsForPathway(pathway: string): readonly string[] {
  return pathway === PATHWAY_ADULT ? ADULT_AGE_BANDS : CHILD_AGE_BANDS;
}

export function defaultAgeBandIndex(_pathway: string): number {
  return 1;
}

export function isPediatricPathway(ageBand: string): boolean {
  return (CHILD_AGE_BANDS as readonly string[]).includes(ageBand);
}

export function isAdultPathway(ageBand: string): boolean {
  return (ADULT_AGE_BANDS as readonly string[]).includes(ageBand);
}
