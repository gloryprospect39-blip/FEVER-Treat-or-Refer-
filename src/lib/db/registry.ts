import "server-only";

import { randomUUID } from "crypto";

import { getSql } from "./client";
import type {
  PatientEncounterSummary,
  RegisteredPatient,
} from "@/lib/fevergate/registry-types";

export type { PatientEncounterSummary, RegisteredPatient } from "@/lib/fevergate/registry-types";

interface PatientRow {
  id: string;
  name: string;
  village: string;
  created_at: string;
  last_seen_at: string;
  visit_count: number;
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function rowToPatient(row: PatientRow): RegisteredPatient {
  return {
    ...row,
    visit_count: Number(row.visit_count),
    display_label: `${row.name} · ${row.village}`,
  };
}

export async function listVillages(): Promise<string[]> {
  const sql = await getSql();
  if (!sql) return [];
  const rows = (await sql`
    SELECT DISTINCT village FROM patients ORDER BY village
  `) as { village: string }[];
  return rows.map((r) => r.village);
}

export async function listRecentPatients(
  limit = 30,
  village?: string | null,
): Promise<RegisteredPatient[]> {
  const sql = await getSql();
  if (!sql) return [];
  const rows = (
    village
      ? await sql`
          SELECT id, name, village, created_at::text, last_seen_at::text, visit_count
          FROM patients WHERE village = ${village}
          ORDER BY last_seen_at DESC LIMIT ${limit}
        `
      : await sql`
          SELECT id, name, village, created_at::text, last_seen_at::text, visit_count
          FROM patients
          ORDER BY last_seen_at DESC LIMIT ${limit}
        `
  ) as PatientRow[];
  return rows.map(rowToPatient);
}

export async function findPatient(
  name: string,
  village: string,
): Promise<RegisteredPatient | null> {
  const nName = normalize(name);
  const nVillage = normalize(village);
  if (!nName || !nVillage) return null;
  const sql = await getSql();
  if (!sql) return null;
  const rows = (await sql`
    SELECT id, name, village, created_at::text, last_seen_at::text, visit_count
    FROM patients
    WHERE lower(name) = lower(${nName}) AND lower(village) = lower(${nVillage})
    LIMIT 1
  `) as PatientRow[];
  return rows[0] ? rowToPatient(rows[0]) : null;
}

export async function recordVisit(patientId: string): Promise<RegisteredPatient> {
  const sql = await getSql();
  if (!sql) throw new Error("patient registry storage is unavailable");
  const rows = (await sql`
    UPDATE patients
    SET last_seen_at = now(), visit_count = visit_count + 1
    WHERE id = ${patientId}
    RETURNING id, name, village, created_at::text, last_seen_at::text, visit_count
  `) as PatientRow[];
  if (!rows[0]) throw new Error(`unknown patient id: ${patientId}`);
  return rowToPatient(rows[0]);
}

export async function registerPatient(
  name: string,
  village: string,
): Promise<RegisteredPatient> {
  const nName = normalize(name);
  const nVillage = normalize(village);
  if (!nName || !nVillage) {
    throw new Error("name and village are required to register a patient");
  }
  const existing = await findPatient(nName, nVillage);
  if (existing) return recordVisit(existing.id);

  const sql = await getSql();
  if (!sql) throw new Error("patient registry storage is unavailable");
  const id = randomUUID();
  const rows = (await sql`
    INSERT INTO patients (id, name, village)
    VALUES (${id}, ${nName}, ${nVillage})
    RETURNING id, name, village, created_at::text, last_seen_at::text, visit_count
  `) as PatientRow[];
  return rowToPatient(rows[0]);
}

export async function resolvePatientForEncounter(input: {
  name: string;
  village: string;
  patientId?: string | null;
}): Promise<RegisteredPatient | null> {
  const sql = await getSql();
  if (!sql) return null;
  if (input.patientId) return recordVisit(input.patientId);
  const nName = normalize(input.name);
  const nVillage = normalize(input.village);
  if (nName && nVillage) return registerPatient(nName, nVillage);
  return null;
}

export async function getPatientById(
  patientId: string,
): Promise<RegisteredPatient | null> {
  const sql = await getSql();
  if (!sql) return null;
  const rows = (await sql`
    SELECT id, name, village, created_at::text, last_seen_at::text, visit_count
    FROM patients WHERE id = ${patientId} LIMIT 1
  `) as PatientRow[];
  return rows[0] ? rowToPatient(rows[0]) : null;
}

export async function listEncountersForPatient(
  patientId: string,
  limit = 8,
): Promise<PatientEncounterSummary[]> {
  const sql = await getSql();
  if (!sql) return [];
  const rows = (await sql`
    SELECT data FROM encounters
    WHERE patient_id = ${patientId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `) as { data: { timestamp?: string; assessment?: { decision?: string }; action_taken?: string | null } }[];
  return rows.map((row) => ({
    timestamp: row.data.timestamp ?? "",
    decision: row.data.assessment?.decision ?? "UNKNOWN",
    action_taken: row.data.action_taken ?? null,
  }));
}
