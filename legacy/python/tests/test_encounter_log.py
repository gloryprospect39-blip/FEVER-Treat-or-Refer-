"""Tests for local fever registry."""

from pathlib import Path

from decision_engine import evaluate_febrile_patient
from decision_engine.models import PatientContext
from ui.clinic_context import ClinicContext
from ui.encounter_log import count_encounters, log_encounter


def test_log_encounter_appends_jsonl(tmp_path: Path):
    log_file = tmp_path / "encounters.jsonl"
    ctx = PatientContext(age_months=36, has_fever=True)
    assessment = evaluate_febrile_patient(ctx)
    clinic = ClinicContext()

    assert count_encounters(log_file) == 0
    log_encounter(
        ctx,
        assessment,
        clinic,
        action_taken="start_treatment",
        log_path=log_file,
    )
    assert count_encounters(log_file) == 1

    log_encounter(
        ctx,
        assessment,
        clinic,
        action_taken="new_patient",
        log_path=log_file,
    )
    assert count_encounters(log_file) == 2

    text = log_file.read_text(encoding="utf-8")
    assert "start_treatment" in text
    assert "TREAT_AND_MONITOR" in text or "TREAT" in text
    assert "catchment" not in text
    assert "registration" not in text


def test_log_encounter_minimal_row(tmp_path: Path):
    log_file = tmp_path / "encounters.jsonl"
    ctx = PatientContext(age_months=36, has_fever=True)
    assessment = evaluate_febrile_patient(ctx)
    clinic = ClinicContext()

    log_encounter(ctx, assessment, clinic, action_taken="new_patient", log_path=log_file)
    text = log_file.read_text(encoding="utf-8")
    assert "catchment" not in text
    assert "new_patient" in text
    assert '"patient"' in text
    assert '"assessment"' in text
