export const AGE_BANDS: Record<string, number> = {
  "Under 2 months": 1,
  "2 months – 5 years": 24,
  "5–15 years": 96,
  "15–17 years": 192,
  "18–64 years": 480,
  "65+ years": 840,
};

export const PATHWAY_CHILD = "Child (under 15)";
export const PATHWAY_ADULT = "Adult (15+)";

export const CHILD_AGE_BANDS = [
  "Under 2 months",
  "2 months – 5 years",
  "5–15 years",
] as const;

export const ADULT_AGE_BANDS = [
  "15–17 years",
  "18–64 years",
  "65+ years",
] as const;

export function ageBandsForPathway(pathway: string): readonly string[] {
  return pathway === PATHWAY_ADULT ? ADULT_AGE_BANDS : CHILD_AGE_BANDS;
}

export function defaultAgeBandIndex(pathway: string): number {
  return 1;
}

export function isPediatricPathway(ageBand: string): boolean {
  return (CHILD_AGE_BANDS as readonly string[]).includes(ageBand);
}

export function isAdultPathway(ageBand: string): boolean {
  return (ADULT_AGE_BANDS as readonly string[]).includes(ageBand);
}
