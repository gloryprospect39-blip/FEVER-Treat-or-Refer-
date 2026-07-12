import "server-only";

import fs from "fs";
import path from "path";

import type { FebrileAssessment, PatientContext } from "@/lib/decision-engine/models";
import type { ClinicContext } from "@/lib/fevergate/treatment-plan";
import { dataDir } from "./data-dir";

const logPath = () => path.join(dataDir(), "encounters.jsonl");

export interface EncounterRow {
  timestamp: string;
  patient: PatientContext;
  clinic: ClinicContext;
  assessment: FebrileAssessment;
  action_taken: string | null;
  patient_name?: string | null;
  village?: string | null;
  clinician?: string | null;
}

export function logEncounter(input: {
  ctx: PatientContext;
  assessment: FebrileAssessment;
  clinic: ClinicContext;
  actionTaken?: string | null;
  patientName?: string | null;
  village?: string | null;
  clinician?: string | null;
}): void {
  const row: EncounterRow = {
    timestamp: new Date().toISOString(),
    patient: input.ctx,
    clinic: input.clinic,
    assessment: input.assessment,
    action_taken: input.actionTaken ?? null,
    patient_name: input.patientName ?? null,
    village: input.village ?? null,
    clinician: input.clinician ?? null,
  };

  // Best-effort: logging must never break the triage flow, even on a
  // read-only serverless filesystem.
  try {
    fs.appendFileSync(logPath(), JSON.stringify(row) + "\n", "utf-8");
  } catch {
    // Storage unavailable — skip persistence.
  }
}

export function loadEncounters(): EncounterRow[] {
  try {
    const file = logPath();
    if (!fs.existsSync(file)) return [];
    return fs
      .readFileSync(file, "utf-8")
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line) as EncounterRow);
  } catch {
    return [];
  }
}
