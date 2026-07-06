import "server-only";

import fs from "fs";
import path from "path";

import type { FebrileAssessment, PatientContext } from "@/lib/decision-engine/models";
import type { ClinicContext } from "@/lib/fevergate/treatment-plan";

const DATA_DIR = path.join(process.cwd(), "data");
const LOG_PATH = path.join(DATA_DIR, "encounters.jsonl");

export interface EncounterRow {
  timestamp: string;
  patient: PatientContext;
  clinic: ClinicContext;
  assessment: FebrileAssessment;
  action_taken: string | null;
}

export function logEncounter(input: {
  ctx: PatientContext;
  assessment: FebrileAssessment;
  clinic: ClinicContext;
  actionTaken?: string | null;
}): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const row: EncounterRow = {
    timestamp: new Date().toISOString(),
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
