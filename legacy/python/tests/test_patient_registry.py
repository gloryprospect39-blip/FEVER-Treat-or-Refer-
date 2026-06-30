"""Tests for local patient registration (name, village, revisit)."""

from pathlib import Path

import pytest

from ui.patient_registry import (
    find_patient,
    get_patient,
    list_recent_patients,
    list_villages,
    record_visit,
    register_patient,
    resolve_patient_for_encounter,
)


def test_register_patient_creates_row(tmp_path: Path):
    db = tmp_path / "fevergate.db"
    patient = register_patient("Amina Yusuf", "Border Camp A", db_path=db)

    assert patient.name == "Amina Yusuf"
    assert patient.village == "Border Camp A"
    assert patient.visit_count == 1
    assert get_patient(patient.id, db_path=db) is not None


def test_register_patient_dedupes_name_and_village(tmp_path: Path):
    db = tmp_path / "fevergate.db"
    first = register_patient("Amina Yusuf", "Border Camp A", db_path=db)
    second = register_patient("amina yusuf", "  border camp a ", db_path=db)

    assert first.id == second.id
    assert second.visit_count == 2


def test_list_recent_patients_orders_by_last_seen(tmp_path: Path):
    db = tmp_path / "fevergate.db"
    older = register_patient("Older", "Village", db_path=db)
    newer = register_patient("Newer", "Village", db_path=db)
    record_visit(older.id, db_path=db)

    recent = list_recent_patients(db_path=db)
    assert recent[0].id == older.id
    assert recent[1].id == newer.id


def test_list_recent_patients_filters_by_village(tmp_path: Path):
    db = tmp_path / "fevergate.db"
    camp_a = register_patient("Amina", "Border Camp A", db_path=db)
    register_patient("Kofi", "East Ridge", db_path=db)

    filtered = list_recent_patients(village="Border Camp A", db_path=db)
    assert len(filtered) == 1
    assert filtered[0].id == camp_a.id


def test_list_villages_returns_distinct_sorted(tmp_path: Path):
    db = tmp_path / "fevergate.db"
    register_patient("One", "Zulu Camp", db_path=db)
    register_patient("Two", "Alpha Camp", db_path=db)
    register_patient("Three", "Alpha Camp", db_path=db)

    assert list_villages(db_path=db) == ["Alpha Camp", "Zulu Camp"]


def test_resolve_patient_for_encounter_revisit_by_id(tmp_path: Path):
    db = tmp_path / "fevergate.db"
    patient = register_patient("Sam", "Hill Village", db_path=db)

    resolved = resolve_patient_for_encounter("", "", patient_id=patient.id, db_path=db)
    assert resolved is not None
    assert resolved.visit_count == 2


def test_resolve_patient_for_encounter_skips_when_empty(tmp_path: Path):
    db = tmp_path / "fevergate.db"
    assert resolve_patient_for_encounter("", "", db_path=db) is None
    assert resolve_patient_for_encounter("Only Name", "", db_path=db) is None


def test_register_patient_requires_name_and_village(tmp_path: Path):
    db = tmp_path / "fevergate.db"
    with pytest.raises(ValueError):
        register_patient("Name only", "", db_path=db)


def test_find_patient_case_insensitive(tmp_path: Path):
    db = tmp_path / "fevergate.db"
    register_patient("Kofi", "East Ridge", db_path=db)
    found = find_patient("kofi", "east ridge", db_path=db)
    assert found is not None
    assert found.name == "Kofi"
