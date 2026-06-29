"""Integration tests — one happy path per major flow (engineering.md §10)."""

from decision_engine import evaluate_febrile_patient
from decision_engine.models import (
    Comorbidity,
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


def test_ui_patient_context_builder_adult_comorbidities():
    ctx = build_patient_context(
        age_band="18\u201364 years",
        has_fever=True,
        fever_duration_days=2,
        selected_tiles={},
        comorbidities=[
            Comorbidity.CHRONIC_LUNG_DISEASE,
            Comorbidity.CHRONIC_HEART_DISEASE,
        ],
    )
    assert ctx.age_months == 480
    assert Comorbidity.CHRONIC_LUNG_DISEASE in ctx.comorbidities
    assert Comorbidity.CHRONIC_HEART_DISEASE in ctx.comorbidities


def test_ui_patient_context_builder_pediatric_comorbidities():
    ctx = build_patient_context(
        age_band="5\u201315 years",
        has_fever=True,
        fever_duration_days=1,
        selected_tiles={},
        comorbidities=[Comorbidity.SICKLE_CELL, Comorbidity.CHRONIC_HEART_DISEASE],
    )
    assert ctx.comorbidities == [Comorbidity.SICKLE_CELL]


def test_ui_patient_context_builder_vitals():
    ctx = build_patient_context(
        age_band="18\u201364 years",
        has_fever=True,
        fever_duration_days=1,
        selected_tiles={},
        systolic_bp=95,
        spo2_percent=88,
        respiratory_rate=24,
    )
    assert ctx.vitals.systolic_bp == 95
    assert ctx.vitals.spo2_percent == 88
    assert ctx.vitals.respiratory_rate == 24
