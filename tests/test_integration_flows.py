"""Integration tests — one happy path per major flow (engineering.md §10)."""

from decision_engine import evaluate_febrile_patient
from decision_engine.models import (
    ConsciousnessLevel,
    DangerSigns,
    PatientContext,
    TriageDecision,
    VitalSigns,
)
from ui.patient_context import build_patient_context

REFER = {TriageDecision.REFER_IMMEDIATE, TriageDecision.REFER}


def test_danger_sign_refer_flow():
    result = evaluate_febrile_patient(
        PatientContext(
            age_months=24,
            has_fever=True,
            danger_signs=DangerSigns(convulsions=True),
        )
    )
    assert result.decision == TriageDecision.REFER_IMMEDIATE
    assert "convulsions" in result.referral_reasons
    assert "imci:convulsions" in result.referral_reasons


def test_neonate_fever_refer_flow():
    result = evaluate_febrile_patient(PatientContext(age_months=1, has_fever=True))
    assert result.decision == TriageDecision.REFER_IMMEDIATE
    assert "neonate_fever" in result.referral_reasons


def test_uncomplicated_fever_monitor_flow():
    result = evaluate_febrile_patient(
        PatientContext(
            age_months=36,
            has_fever=True,
            vitals=VitalSigns(temperature_c=38.2, heart_rate=110, respiratory_rate=28),
        )
    )
    assert result.decision == TriageDecision.TREAT_AND_MONITOR
    assert result.monitoring_days == 3


def test_adult_deterioration_flow():
    result = evaluate_febrile_patient(
        PatientContext(
            age_months=480,
            vitals=VitalSigns(
                temperature_c=39.0,
                respiratory_rate=24,
                systolic_bp=95,
                heart_rate=105,
            ),
            consciousness=ConsciousnessLevel.LETHARGIC,
        )
    )
    assert result.decision in REFER
    assert result.sepsis.qsofa_score is not None
    assert result.sepsis.qsofa_score >= 2


def test_ui_patient_context_builder_convulsions():
    ctx = build_patient_context(
        age_band="2 months \u2013 5 years",
        has_fever=True,
        fever_duration_days=1,
        selected_tiles={"imci:convulsions": True},
    )
    result = evaluate_febrile_patient(ctx)
    assert result.decision in REFER
