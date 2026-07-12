import "server-only";

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

type Sql = NeonQueryFunction<false, false>;

// undefined = not resolved yet, null = no DATABASE_URL configured (degrade gracefully)
let cachedSql: Sql | null | undefined;
let schemaReady: Promise<void> | null = null;

function resolveSql(): Sql | null {
  if (cachedSql !== undefined) return cachedSql;
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    "";
  cachedSql = url ? neon(url) : null;
  return cachedSql;
}

async function ensureSchema(sql: Sql): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS encounters (
          id BIGSERIAL PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          patient_name TEXT,
          village TEXT,
          clinician TEXT,
          action_taken TEXT,
          data JSONB NOT NULL
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS patients (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          village TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          visit_count INTEGER NOT NULL DEFAULT 1
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_patients_last_seen
          ON patients (last_seen_at DESC)
      `;
    })().catch((err) => {
      // Allow a later call to retry schema creation.
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

/**
 * Returns a ready-to-use Neon SQL client (with tables created), or `null` when
 * no database is configured so callers can degrade gracefully instead of
 * crashing (e.g. local dev or a preview without DATABASE_URL).
 */
export async function getSql(): Promise<Sql | null> {
  const sql = resolveSql();
  if (!sql) return null;
  await ensureSchema(sql);
  return sql;
}
