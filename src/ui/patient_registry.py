"""Local patient registration — name, village, revisit (SQLite, on-device only)."""

from __future__ import annotations

import sqlite3
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_DB_PATH = Path(__file__).resolve().parents[2] / "data" / "fevergate.db"


@dataclass(frozen=True)
class RegisteredPatient:
    id: str
    name: str
    village: str
    created_at: str
    last_seen_at: str
    visit_count: int

    @property
    def display_label(self) -> str:
        return f"{self.name} · {self.village}"


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _connect(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: Path | None = None) -> Path:
    """Create patients table if missing. Returns the database path."""
    path = db_path or DEFAULT_DB_PATH
    with _connect(path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS patients (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                village TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_seen_at TEXT NOT NULL,
                visit_count INTEGER NOT NULL DEFAULT 1
            )
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_patients_last_seen
            ON patients (last_seen_at DESC)
            """
        )
        conn.commit()
    return path


def _row_to_patient(row: sqlite3.Row) -> RegisteredPatient:
    return RegisteredPatient(
        id=row["id"],
        name=row["name"],
        village=row["village"],
        created_at=row["created_at"],
        last_seen_at=row["last_seen_at"],
        visit_count=row["visit_count"],
    )


def _normalize(value: str) -> str:
    return " ".join(value.strip().split())


def find_patient(
    name: str, village: str, db_path: Path | None = None
) -> RegisteredPatient | None:
    """Case-insensitive match on trimmed name + village."""
    n_name, n_village = _normalize(name), _normalize(village)
    if not n_name or not n_village:
        return None
    init_db(db_path)
    path = db_path or DEFAULT_DB_PATH
    with _connect(path) as conn:
        row = conn.execute(
            """
            SELECT * FROM patients
            WHERE lower(name) = lower(?) AND lower(village) = lower(?)
            """,
            (n_name, n_village),
        ).fetchone()
    return _row_to_patient(row) if row else None


def register_patient(
    name: str, village: str, db_path: Path | None = None
) -> RegisteredPatient:
    """Register a new patient or return an existing match (same name + village)."""
    n_name, n_village = _normalize(name), _normalize(village)
    if not n_name or not n_village:
        raise ValueError("name and village are required to register a patient")

    existing = find_patient(n_name, n_village, db_path=db_path)
    if existing:
        return record_visit(existing.id, db_path=db_path)

    init_db(db_path)
    path = db_path or DEFAULT_DB_PATH
    now = _utc_now()
    patient_id = str(uuid.uuid4())
    with _connect(path) as conn:
        conn.execute(
            """
            INSERT INTO patients (id, name, village, created_at, last_seen_at, visit_count)
            VALUES (?, ?, ?, ?, ?, 1)
            """,
            (patient_id, n_name, n_village, now, now),
        )
        conn.commit()
    return RegisteredPatient(
        id=patient_id,
        name=n_name,
        village=n_village,
        created_at=now,
        last_seen_at=now,
        visit_count=1,
    )


def get_patient(patient_id: str, db_path: Path | None = None) -> RegisteredPatient | None:
    init_db(db_path)
    path = db_path or DEFAULT_DB_PATH
    with _connect(path) as conn:
        row = conn.execute(
            "SELECT * FROM patients WHERE id = ?", (patient_id,)
        ).fetchone()
    return _row_to_patient(row) if row else None


def record_visit(patient_id: str, db_path: Path | None = None) -> RegisteredPatient:
    """Bump visit count and last_seen for a revisit."""
    init_db(db_path)
    path = db_path or DEFAULT_DB_PATH
    now = _utc_now()
    with _connect(path) as conn:
        conn.execute(
            """
            UPDATE patients
            SET last_seen_at = ?, visit_count = visit_count + 1
            WHERE id = ?
            """,
            (now, patient_id),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM patients WHERE id = ?", (patient_id,)
        ).fetchone()
    if row is None:
        raise KeyError(f"unknown patient id: {patient_id}")
    return _row_to_patient(row)


def list_villages(db_path: Path | None = None) -> list[str]:
    """Distinct villages in the registry, alphabetically."""
    init_db(db_path)
    path = db_path or DEFAULT_DB_PATH
    with _connect(path) as conn:
        rows = conn.execute(
            """
            SELECT DISTINCT village FROM patients
            ORDER BY village COLLATE NOCASE
            """
        ).fetchall()
    return [row["village"] for row in rows]


def list_recent_patients(
    limit: int = 30,
    village: str | None = None,
    db_path: Path | None = None,
) -> list[RegisteredPatient]:
    init_db(db_path)
    path = db_path or DEFAULT_DB_PATH
    with _connect(path) as conn:
        if village:
            rows = conn.execute(
                """
                SELECT * FROM patients
                WHERE village = ?
                ORDER BY last_seen_at DESC
                LIMIT ?
                """,
                (village, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT * FROM patients
                ORDER BY last_seen_at DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
    return [_row_to_patient(row) for row in rows]


def resolve_patient_for_encounter(
    name: str,
    village: str,
    patient_id: str | None = None,
    db_path: Path | None = None,
) -> RegisteredPatient | None:
    """Link an encounter to a patient when identity is known; never blocks triage."""
    if patient_id:
        return record_visit(patient_id, db_path=db_path)
    n_name, n_village = _normalize(name), _normalize(village)
    if n_name and n_village:
        return register_patient(n_name, n_village, db_path=db_path)
    return None
