/** Seven villages (A–G) under clinic care. */
export const CLINIC_VILLAGES = ["A", "B", "C", "D", "E", "F", "G"] as const;

export type VillageCode = (typeof CLINIC_VILLAGES)[number];

export type VillageKey = VillageCode | "Unknown";

export const VILLAGE_KEYS: readonly VillageKey[] = [
  ...CLINIC_VILLAGES,
  "Unknown",
];

export function normalizeVillage(
  value: string | null | undefined,
): VillageKey {
  if (!value?.trim()) return "Unknown";
  const code = value.trim().toUpperCase();
  if ((CLINIC_VILLAGES as readonly string[]).includes(code)) {
    return code as VillageCode;
  }
  return "Unknown";
}
