import "server-only";

import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import path from "path";

import { dataDir } from "./data-dir";

export interface RegisteredPatient {
  id: string;
  name: string;
  village: string;
  created_at: string;
  last_seen_at: string;
  visit_count: number;
  display_label: string;
}

// undefined = not yet attempted, null = unavailable (e.g. read-only serverless FS)
let cachedDb: Database.Database | null | undefined;

function getDb(): Database.Database | null {
  if (cachedDb !== undefined) return cachedDb;
  try {
    const db = new Database(path.join(dataDir(), "fevergate.db"));
    db.exec(`
      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        village TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        visit_count INTEGER NOT NULL DEFAULT 1
      );
      CREATE INDEX IF NOT EXISTS idx_patients_last_seen ON patients (last_seen_at DESC);
    `);
    cachedDb = db;
  } catch {
    // Storage unavailable — the patient registry degrades to a no-op so the
    // app keeps serving instead of returning 500s.
    cachedDb = null;
  }
  return cachedDb;
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function rowToPatient(row: {
  id: string;
  name: string;
  village: string;
  created_at: string;
  last_seen_at: string;
  visit_count: number;
}): RegisteredPatient {
  return {
    ...row,
    display_label: `${row.name} · ${row.village}`,
  };
}

export function listVillages(): string[] {
  const db = getDb();
  if (!db) return [];
  const rows = db
    .prepare(
      "SELECT DISTINCT village FROM patients ORDER BY village COLLATE NOCASE",
    )
    .all() as { village: string }[];
  return rows.map((r) => r.village);
}

export function listRecentPatients(
  limit = 30,
  village?: string | null,
): RegisteredPatient[] {
  const db = getDb();
  if (!db) return [];
  const rows = village
    ? (db
        .prepare(
          "SELECT * FROM patients WHERE village = ? ORDER BY last_seen_at DESC LIMIT ?",
        )
        .all(village, limit) as RegisteredPatient[])
    : (db
        .prepare(
          "SELECT * FROM patients ORDER BY last_seen_at DESC LIMIT ?",
        )
        .all(limit) as RegisteredPatient[]);
  return rows.map(rowToPatient);
}

export function findPatient(
  name: string,
  village: string,
): RegisteredPatient | null {
  const nName = normalize(name);
  const nVillage = normalize(village);
  if (!nName || !nVillage) return null;
  const db = getDb();
  if (!db) return null;
  const row = db
    .prepare(
      "SELECT * FROM patients WHERE lower(name) = lower(?) AND lower(village) = lower(?)",
    )
    .get(nName, nVillage) as RegisteredPatient | undefined;
  return row ? rowToPatient(row) : null;
}

export function recordVisit(patientId: string): RegisteredPatient {
  const db = getDb();
  if (!db) throw new Error("patient registry storage is unavailable");
  const now = new Date().toISOString();
  db.prepare(
    "UPDATE patients SET last_seen_at = ?, visit_count = visit_count + 1 WHERE id = ?",
  ).run(now, patientId);
  const row = db
    .prepare("SELECT * FROM patients WHERE id = ?")
    .get(patientId) as RegisteredPatient;
  if (!row) throw new Error(`unknown patient id: ${patientId}`);
  return rowToPatient(row);
}

export function registerPatient(
  name: string,
  village: string,
): RegisteredPatient {
  const nName = normalize(name);
  const nVillage = normalize(village);
  if (!nName || !nVillage) {
    throw new Error("name and village are required to register a patient");
  }
  const existing = findPatient(nName, nVillage);
  if (existing) return recordVisit(existing.id);

  const db = getDb();
  if (!db) throw new Error("patient registry storage is unavailable");
  const now = new Date().toISOString();
  const id = randomUUID();
  db.prepare(
    "INSERT INTO patients (id, name, village, created_at, last_seen_at, visit_count) VALUES (?, ?, ?, ?, ?, 1)",
  ).run(id, nName, nVillage, now, now);
  return rowToPatient({
    id,
    name: nName,
    village: nVillage,
    created_at: now,
    last_seen_at: now,
    visit_count: 1,
  });
}

export function resolvePatientForEncounter(input: {
  name: string;
  village: string;
  patientId?: string | null;
}): RegisteredPatient | null {
  if (!getDb()) return null;
  if (input.patientId) return recordVisit(input.patientId);
  const nName = normalize(input.name);
  const nVillage = normalize(input.village);
  if (nName && nVillage) return registerPatient(nName, nVillage);
  return null;
}
