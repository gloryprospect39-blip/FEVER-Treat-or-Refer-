"""Append-only local fever registry — never blocks triage."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from decision_engine.models import FebrileAssessment, PatientContext

from ui.clinic_context import ClinicContext

DEFAULT_LOG_PATH = Path(__file__).resolve().parents[2] / "data" / "encounters.jsonl"


def _serialize_context(ctx: PatientContext) -> dict[str, Any]:
    return ctx.model_dump(mode="json")


def _serialize_assessment(assessment: FebrileAssessment) -> dict[str, Any]:
    return assessment.model_dump(mode="json")


def log_encounter(
    ctx: PatientContext,
    assessment: FebrileAssessment,
    clinic: ClinicContext,
    action_taken: str | None = None,
    log_path: Path | None = None,
) -> Path:
    """Append one encounter row. Returns the log file path."""
    path = log_path or DEFAULT_LOG_PATH
    path.parent.mkdir(parents=True, exist_ok=True)

    row = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "patient": _serialize_context(ctx),
        "clinic": clinic.model_dump(mode="json"),
        "assessment": _serialize_assessment(assessment),
        "action_taken": action_taken,
    }
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(row, ensure_ascii=False) + "\n")
    return path


def count_encounters(log_path: Path | None = None) -> int:
    path = log_path or DEFAULT_LOG_PATH
    if not path.exists():
        return 0
    with path.open(encoding="utf-8") as handle:
        return sum(1 for line in handle if line.strip())
