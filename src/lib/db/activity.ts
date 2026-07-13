import "server-only";

import type { ActivityEventType, ActivityLogRow } from "@/lib/fevergate/activity";
import { getSql } from "./client";

export async function logActivity(input: {
  eventType: ActivityEventType;
  actor?: string | null;
  village?: string | null;
  patientName?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  const createdAt = new Date().toISOString();

  // Best-effort: logging must never break the triage flow.
  try {
    const sql = await getSql();
    if (!sql) return;
    await sql`
      INSERT INTO activity_logs
        (created_at, event_type, actor, village, patient_name, metadata)
      VALUES (
        ${createdAt},
        ${input.eventType},
        ${input.actor ?? null},
        ${input.village ?? null},
        ${input.patientName ?? null},
        ${input.metadata ? JSON.stringify(input.metadata) : null}::jsonb
      )
    `;
  } catch {
    // Storage unavailable — skip persistence.
  }
}

export async function loadActivityLogs(): Promise<ActivityLogRow[]> {
  try {
    const sql = await getSql();
    if (!sql) return [];
    const rows = (await sql`
      SELECT id, created_at, event_type, actor, village, patient_name, metadata
      FROM activity_logs
      ORDER BY created_at DESC
    `) as Array<
      Omit<ActivityLogRow, "created_at"> & { created_at: string | Date }
    >;
    return rows.map((row) => ({
      ...row,
      created_at:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : String(row.created_at),
      metadata:
        row.metadata && typeof row.metadata === "object"
          ? (row.metadata as Record<string, unknown>)
          : null,
    }));
  } catch {
    return [];
  }
}
