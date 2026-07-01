import "server-only";

import fs from "fs";
import path from "path";

import type { FebrileAssessment, PatientContext } from "@/lib/decision-engine/models";
import type { ClinicContext } from "@/lib/fevergate/treatment-plan";
import type { CatchmentZoneSelection } from "@/lib/fevergate/catchment-levels";
import { requireCatchment } from "@/lib/fevergate/treatment-plan";

const DATA_DIR = path.join(process.cwd(), "data");
const LOG_PATH = path.join(DATA_DIR, "encounters.jsonl");

export interface EncounterRow {
  timestamp: string;
  catchment: string;
  catchment_zones?: CatchmentZoneSelection;
  registration: {
    id: string;
    name: string | null;
    village: string | null;
  } | null;
  patient: PatientContext;
  clinic: ClinicContext;
  assessment: FebrileAssessment;
  action_taken: string | null;
}

export function logEncounter(input: {
  ctx: PatientContext;
  assessment: FebrileAssessment;
  clinic: ClinicContext;
  catchment: string;
  actionTaken?: string | null;
  catchmentZones?: CatchmentZoneSelection;
  registeredPatientId?: string | null;
  registeredName?: string | null;
  registeredVillage?: string | null;
}): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const catchmentValue = requireCatchment(input.catchment);

  const registration = input.registeredPatientId
    ? {
        id: input.registeredPatientId,
        name: input.registeredName ?? null,
        village: input.registeredVillage ?? null,
      }
    : null;

  const row: EncounterRow = {
    timestamp: new Date().toISOString(),
    catchment: catchmentValue,
    catchment_zones:
      input.catchmentZones && Object.keys(input.catchmentZones).length
        ? input.catchmentZones
        : undefined,
    registration,
    patient: input.ctx,
    clinic: input.clinic,
    assessment: input.assessment,
    action_taken: input.actionTaken ?? null,
  };

  fs.appendFileSync(LOG_PATH, JSON.stringify(row) + "\n", "utf-8");
}

export function loadEncounters(): EncounterRow[] {
  if (!fs.existsSync(LOG_PATH)) return [];
  return fs
    .readFileSync(LOG_PATH, "utf-8")
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as EncounterRow);
}
