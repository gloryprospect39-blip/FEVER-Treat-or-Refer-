import "server-only";

import type {
  FebrileAssessment,
  PatientContext,
  TriageDecision,
} from "@/lib/decision-engine/models";
import type { ClinicContext } from "@/lib/fevergate/treatment-plan";
import type { PatientDrugDispensing } from "@/lib/fevergate/drug-dispensing";
import { getSql } from "./client";

export interface ActionableRecord {
  clinical_decision: TriageDecision;
  actionable_decision: TriageDecision;
  actionable_reason: "act_stock_out" | null;
}

export interface EncounterRow {
  timestamp: string;
  patient: PatientContext;
  clinic: ClinicContext;
  assessment: FebrileAssessment;
  actionable?: ActionableRecord;
  action_taken: string | null;
  patient_name?: string | null;
  village?: string | null;
  clinician?: string | null;
  patient_id?: string | null;
  drug_dispensing?: PatientDrugDispensing | null;
}

export async function logEncounter(input: {
  ctx: PatientContext;
  assessment: FebrileAssessment;
  clinic: ClinicContext;
  actionable?: ActionableRecord;
  actionTaken?: string | null;
  patientName?: string | null;
  village?: string | null;
  clinician?: string | null;
  patientId?: string | null;
  drugDispensing?: PatientDrugDispensing | null;
}): Promise<void> {
  const row: EncounterRow = {
    timestamp: new Date().toISOString(),
    patient: input.ctx,
    clinic: input.clinic,
    assessment: input.assessment,
    actionable: input.actionable,
    action_taken: input.actionTaken ?? null,
    patient_name: input.patientName ?? null,
    village: input.village ?? null,
    clinician: input.clinician ?? null,
    patient_id: input.patientId ?? null,
    drug_dispensing: input.drugDispensing ?? null,
  };

  // Best-effort: logging must never break the triage flow if the database is
  // unavailable or not yet configured.
  try {
    const sql = await getSql();
    if (!sql) return;
    await sql`
      INSERT INTO encounters
        (created_at, patient_name, village, clinician, action_taken, patient_id, data)
      VALUES (
        ${row.timestamp},
        ${row.patient_name},
        ${row.village},
        ${row.clinician},
        ${row.action_taken},
        ${row.patient_id},
        ${JSON.stringify(row)}::jsonb
      )
    `;
  } catch {
    // Storage unavailable — skip persistence.
  }
}

export async function loadEncounters(): Promise<EncounterRow[]> {
  try {
    const sql = await getSql();
    if (!sql) return [];
    const rows = (await sql`
      SELECT data FROM encounters ORDER BY created_at DESC
    `) as { data: EncounterRow }[];
    return rows.map((r) => r.data);
  } catch {
    return [];
  }
}
