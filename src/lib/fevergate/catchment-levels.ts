export const CATCHMENT_LEVELS = ["A", "B", "C"] as const;

export type CatchmentLevel = (typeof CATCHMENT_LEVELS)[number];

export type CatchmentZoneSelection = Partial<Record<CatchmentLevel, string>>;

/** Demo options per level — replace with live registry data when available. */
export const CATCHMENT_LEVEL_OPTIONS: Record<CatchmentLevel, string[]> = {
  A: ["A1 — Hill corridor", "A2 — River valley", "A3 — Border camp"],
  B: ["B1 — North ridge", "B2 — East fields", "B3 — Valley hamlet"],
  C: ["C1 — Upper settlement", "C2 — Lower settlement", "C3 — Transit point"],
};

export function formatCatchmentZones(zones: CatchmentZoneSelection): string {
  return CATCHMENT_LEVELS.filter((level) => zones[level])
    .map((level) => `${level}: ${zones[level]}`)
    .join(" · ");
}
