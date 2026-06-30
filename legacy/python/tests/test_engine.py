"""Unit tests for evaluate_febrile_patient orchestration (engineering.md §10)."""

from decision_engine import evaluate_febrile_patient
from decision_engine.models import DangerSigns, PatientContext, TriageDecision, VitalSigns


def test_monitoring_days_only_for_treat_and_monitor():
    monitor = evaluate_febrile_patient(
        PatientContext(
            age_months=36,
            vitals=VitalSigns(temperature_c=38.2, heart_rate=110, respiratory_rate=28),
        )
    )
    assert monitor.decision == TriageDecision.TREAT_AND_MONITOR
    assert monitor.monitoring_days == 3

    refer = evaluate_febrile_patient(
        PatientContext(age_months=24, danger_signs=DangerSigns(convulsions=True))
    )
    assert refer.monitoring_days == 0


def test_referral_reasons_sorted_and_deduplicated():
    result = evaluate_febrile_patient(
        PatientContext(age_months=24, danger_signs=DangerSigns(convulsions=True))
    )
    assert result.referral_reasons == sorted(set(result.referral_reasons))


def test_rationale_populated():
    result = evaluate_febrile_patient(
        PatientContext(age_months=36, vitals=VitalSigns(temperature_c=38.2))
    )
    assert len(result.rationale) >= 1
    assert any("Screening" in line for line in result.rationale)
