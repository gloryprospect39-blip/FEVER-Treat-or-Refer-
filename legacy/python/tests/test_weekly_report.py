"""Tests for weekly epidemiologic report aggregation."""

from datetime import date
from pathlib import Path

import json

from ui.patient_registry import register_patient
from ui.weekly_report import (
    build_weekly_report,
    compute_week_metrics,
    filter_encounters_by_range,
    format_weekly_report_markdown,
)


def _row(
    *,
    day: str,
    catchment: str = "Hill Settlement",
    decision: str = "TREAT_AND_MONITOR",
    age_months: int = 36,
    convulsions: bool = False,
    registration: dict | None = None,
    endemicity: str = "high",
    act_in_stock: bool = True,
    catchment_zones: dict | None = None,
) -> dict:
    row = {
        "timestamp": f"2026-06-{day}T10:00:00+00:00",
        "catchment": catchment,
        "registration": registration,
        "patient": {
            "age_months": age_months,
            "has_fever": True,
            "consciousness": "alert",
            "danger_signs": {"convulsions": convulsions},
        },
        "clinic": {
            "malaria_endemicity": endemicity,
            "act_in_stock": act_in_stock,
        },
        "assessment": {
            "decision": decision,
            "referral_reasons": ["imci:convulsions"] if convulsions else [],
        },
        "action_taken": "assess",
    }
    if catchment_zones is not None:
        row["catchment_zones"] = catchment_zones
    return row


def test_filter_encounters_by_range():
    rows = [
        _row(day="23"),
        _row(day="30"),
    ]
    filtered = filter_encounters_by_range(
        rows, date(2026, 6, 23), date(2026, 6, 29)
    )
    assert len(filtered) == 1
    assert filtered[0]["timestamp"].startswith("2026-06-23")


def test_compute_week_metrics(tmp_path: Path):
    rows = [
        _row(day="24", catchment="Hill Settlement", decision="REFER_IMMEDIATE", convulsions=True),
        _row(day="25", catchment="River Crossing", decision="TREAT"),
        _row(
            day="26",
            catchment="East Ridge",
            registration={"id": "p1", "name": "Amina", "village": "Hill Settlement"},
        ),
    ]
    metrics = compute_week_metrics(rows)
    assert metrics.total == 3
    assert metrics.catchments["Hill Settlement"] == 1
    assert metrics.catchments["River Crossing"] == 1
    assert metrics.decisions["REFER_IMMEDIATE"] == 1
    assert metrics.decisions["TREAT"] == 1
    assert metrics.linked_registry == 1
    assert metrics.named_registration == 1
    assert metrics.danger_sign_encounters == 1
    assert metrics.danger_signs["imci:convulsions"] == 1


def test_build_weekly_report_from_jsonl(tmp_path: Path):
    log_file = tmp_path / "encounters.jsonl"
    rows = [
        _row(day="24", catchment="Hill Settlement", decision="REFER", convulsions=True),
        _row(day="25", catchment="Hill Settlement", decision="TREAT_AND_MONITOR"),
        _row(day="17", catchment="Old Week", decision="TREAT"),
    ]
    with log_file.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row) + "\n")

    report = build_weekly_report(
        week_start=date(2026, 6, 23),
        week_end=date(2026, 6, 29),
        log_path=log_file,
        db_path=tmp_path / "empty.db",
    )
    assert "FeverGate — Weekly Epidemiologic Report" in report
    assert "Hill Settlement" in report
    assert "Total febrile encounters | **2**" in report
    assert "Old Week" not in report.split("## 2.")[1].split("## 3.")[0]


def test_compute_week_metrics_catchment_zones():
    rows = [
        _row(
            day="24",
            decision="REFER",
            catchment_zones={"A": "A1 — Hill corridor", "B": "B1 — North ridge"},
        ),
        _row(
            day="25",
            catchment_zones={"A": "A1 — Hill corridor", "C": "C2 — Lower settlement"},
        ),
        _row(day="26"),
    ]
    metrics = compute_week_metrics(rows)
    assert metrics.zone_encounters_with_zones == 2
    assert metrics.zones_by_level["A"]["A1 — Hill corridor"] == 2
    assert metrics.zones_by_level["B"]["B1 — North ridge"] == 1
    assert metrics.zones_by_level["C"]["C2 — Lower settlement"] == 1
    assert metrics.referrals_by_zone_level["A"]["A1 — Hill corridor"] == 1


def test_weekly_report_includes_zone_sections(tmp_path: Path):
    log_file = tmp_path / "encounters.jsonl"
    rows = [
        _row(
            day="24",
            catchment_zones={"A": "A1 — Hill corridor", "B": "B2 — East fields"},
        ),
    ]
    with log_file.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row) + "\n")

    report = build_weekly_report(
        week_start=date(2026, 6, 23),
        week_end=date(2026, 6, 29),
        log_path=log_file,
        db_path=tmp_path / "empty.db",
    )
    assert "## 3. Encounters by catchment zone (A / B / C)" in report
    assert "### Level A" in report
    assert "### Level B" in report
    assert "### Level C" in report
    assert "A1 — Hill corridor" in report
    assert "Encounters with zone A/B/C | **1**" in report


def test_format_includes_registry_count(tmp_path: Path):
    db = tmp_path / "fevergate.db"
    patient = register_patient("Sam", "Valley Hamlet", db_path=db)
    created = date.fromisoformat(patient.created_at[:10])

    report = format_weekly_report_markdown(
        week_start=created,
        week_end=created,
        current=compute_week_metrics([_row(day=f"{created.day:02d}")]),
        prior=None,
        db_path=db,
    )
    assert "New registry patients | **1**" in report


def test_act_plan_proxy():
    rows = [
        _row(day="24", decision="TREAT", endemicity="high", act_in_stock=True),
        _row(day="25", decision="TREAT", endemicity="low", act_in_stock=True),
    ]
    metrics = compute_week_metrics(rows)
    assert metrics.act_plan_proxy == 1
