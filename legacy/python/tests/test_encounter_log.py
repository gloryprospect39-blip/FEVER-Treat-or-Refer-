"""Tests for local fever registry."""

from pathlib import Path

import pytest

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
        catchment="Border Camp A",
        action_taken="start_treatment",
        log_path=log_file,
    )
    assert count_encounters(log_file) == 1

    log_encounter(
        ctx,
        assessment,
        clinic,
        catchment="Border Camp A",
        action_taken="new_patient",
        log_path=log_file,
        registered_patient_id="abc-123",
        registered_name="Amina",
        registered_village="Border Camp A",
    )
    assert count_encounters(log_file) == 2

    text = log_file.read_text(encoding="utf-8")
    assert "start_treatment" in text
    assert "TREAT_AND_MONITOR" in text or "TREAT" in text
    assert '"catchment": "Border Camp A"' in text
    assert '"registration"' in text
    assert "Amina" in text


def test_log_encounter_requires_catchment(tmp_path: Path):
    log_file = tmp_path / "encounters.jsonl"
    ctx = PatientContext(age_months=36, has_fever=True)
    assessment = evaluate_febrile_patient(ctx)
    clinic = ClinicContext()

    with pytest.raises(ValueError, match="required"):
        log_encounter(ctx, assessment, clinic, catchment="", log_path=log_file)


def test_log_encounter_catchment_without_registration(tmp_path: Path):
    log_file = tmp_path / "encounters.jsonl"
    ctx = PatientContext(age_months=96, has_fever=True)
    assessment = evaluate_febrile_patient(ctx)
    clinic = ClinicContext()

    log_encounter(
        ctx,
        assessment,
        clinic,
        catchment="East Ridge",
        action_taken="new_patient",
        log_path=log_file,
    )

    text = log_file.read_text(encoding="utf-8")
    assert '"catchment": "East Ridge"' in text
    assert '"registration": null' in text
