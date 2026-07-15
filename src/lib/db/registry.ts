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

function patientKey(name: string, village: string): string {
  return `${normalize(name).toLowerCase()}|${normalize(village).toLowerCase()}`;
}

/** Stable id for patients known from encounters but not yet in the registry. */
export function stablePatientId(name: string, village: string): string {
  return `stable:${patientKey(name, village)}`;
}

export function parseStablePatientId(
  patientId: string,
): { name: string; village: string } | null {
  if (!patientId.startsWith("stable:")) return null;
  const key = patientId.slice(7);
  const sep = key.indexOf("|");
  if (sep <= 0) return null;
  return {
    name: key.slice(0, sep),
    village: key.slice(sep + 1),
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
          FROM patients WHERE lower(village) = lower(${village})
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

/** Registry rows plus named patients from prior encounters in the same village. */
export async function listReturningPatientsForVillage(
  village: string,
  limit = 30,
): Promise<RegisteredPatient[]> {
  const nVillage = normalize(village);
  if (!nVillage) return [];

  const registered = await listRecentPatients(limit, nVillage);
  const byKey = new Map<string, RegisteredPatient>();
  for (const patient of registered) {
    byKey.set(patientKey(patient.name, patient.village), patient);
  }

  const sql = await getSql();
  if (!sql) return Array.from(byKey.values());

  const encounterRows = (await sql`
    SELECT
      patient_name AS name,
      village,
      COUNT(*)::int AS visit_count,
      MAX(created_at)::text AS last_seen_at,
      MIN(created_at)::text AS created_at
    FROM encounters
    WHERE lower(village) = lower(${nVillage})
      AND patient_name IS NOT NULL
      AND trim(patient_name) <> ''
    GROUP BY patient_name, village
    ORDER BY MAX(created_at) DESC
    LIMIT ${limit}
  `) as {
    name: string;
    village: string;
    visit_count: number;
    last_seen_at: string;
    created_at: string;
  }[];

  for (const row of encounterRows) {
    const name = normalize(row.name);
    const rowVillage = normalize(row.village);
    const key = patientKey(name, rowVillage);
    if (byKey.has(key)) continue;

    const existing = await findPatient(name, rowVillage);
    if (existing) {
      byKey.set(key, existing);
      continue;
    }

    byKey.set(key, {
      id: stablePatientId(name, rowVillage),
      name,
      village: rowVillage,
      created_at: row.created_at,
      last_seen_at: row.last_seen_at,
      visit_count: Number(row.visit_count),
      display_label: `${name} · ${rowVillage}`,
    });
  }

  return Array.from(byKey.values())
    .sort((a, b) => Date.parse(b.last_seen_at) - Date.parse(a.last_seen_at))
    .slice(0, limit);
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
  if (input.patientId) {
    const stable = parseStablePatientId(input.patientId);
    if (stable) {
      return registerPatient(stable.name, stable.village);
    }
    return recordVisit(input.patientId);
  }
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
  fallback?: { name: string; village: string } | null,
): Promise<PatientEncounterSummary[]> {
  const sql = await getSql();
  if (!sql) return [];

  const stable = parseStablePatientId(patientId);
  const name = fallback?.name ?? stable?.name ?? null;
  const village = fallback?.village ?? stable?.village ?? null;

  const rows =
    name && village
      ? ((await sql`
          SELECT data FROM encounters
          WHERE lower(patient_name) = lower(${name})
            AND lower(village) = lower(${village})
          ORDER BY created_at DESC
          LIMIT ${limit}
        `) as {
          data: {
            timestamp?: string;
            assessment?: { decision?: string };
            action_taken?: string | null;
          };
        }[])
      : patientId
        ? ((await sql`
            SELECT data FROM encounters
            WHERE patient_id = ${patientId}
            ORDER BY created_at DESC
            LIMIT ${limit}
          `) as {
            data: {
              timestamp?: string;
              assessment?: { decision?: string };
              action_taken?: string | null;
            };
          }[])
        : [];

  return rows.map((row) => ({
    timestamp: row.data.timestamp ?? "",
    decision: row.data.assessment?.decision ?? "UNKNOWN",
    action_taken: row.data.action_taken ?? null,
  }));
}
