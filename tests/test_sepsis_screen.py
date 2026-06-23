import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from decision_engine import evaluate_febrile_patient
from decision_engine.models import (
    Comorbidity,
    ConsciousnessLevel,
    DangerSigns,
    PatientContext,
    TriageDecision,
    VitalSigns,
)


def test_neonate_fever_refers_immediately():
    result = evaluate_febrile_patient(
        PatientContext(age_months=1, has_fever=True, vitals=VitalSigns(temperature_c=38.2))
    )
    assert result.decision == TriageDecision.REFER_IMMEDIATE
    assert "neonate_fever" in result.referral_reasons


def test_under5_convulsions_refers_immediately():
    result = evaluate_febrile_patient(
        PatientContext(
            age_months=24,
            danger_signs=DangerSigns(convulsions=True),
            vitals=VitalSigns(temperature_c=39.0, heart_rate=130, respiratory_rate=32),
        )
    )
    assert result.decision == TriageDecision.REFER_IMMEDIATE
    assert "convulsions" in result.referral_reasons


def test_adult_qsofa_refer():
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
    assert result.decision in {TriageDecision.REFER, TriageDecision.REFER_IMMEDIATE}
    assert result.sepsis.qsofa_score is not None
    assert result.sepsis.qsofa_score >= 2


def test_adult_news2_high_refers_immediately():
    result = evaluate_febrile_patient(
        PatientContext(
            age_months=600,
            vitals=VitalSigns(
                temperature_c=35.2,
                respiratory_rate=28,
                systolic_bp=85,
                heart_rate=125,
                spo2_percent=89,
            ),
            consciousness=ConsciousnessLevel.UNCONSCIOUS,
        )
    )
    assert result.decision == TriageDecision.REFER_IMMEDIATE


def test_child_borderline_with_comorbidity_refers():
    result = evaluate_febrile_patient(
        PatientContext(
            age_months=96,
            comorbidities=[Comorbidity.HIV],
            vitals=VitalSigns(temperature_c=38.8, heart_rate=125, respiratory_rate=28),
        )
    )
    assert result.decision == TriageDecision.REFER


def test_uncomplicated_fever_treat_and_monitor():
    result = evaluate_febrile_patient(
        PatientContext(
            age_months=36,
            vitals=VitalSigns(temperature_c=38.2, heart_rate=110, respiratory_rate=28),
        )
    )
    assert result.decision == TriageDecision.TREAT_AND_MONITOR
    assert result.monitoring_days == 3


def test_elderly_high_fever_elevates_score():
    result = evaluate_febrile_patient(
        PatientContext(
            age_months=840,
            vitals=VitalSigns(temperature_c=39.8, heart_rate=102, respiratory_rate=21),
        )
    )
    assert result.sepsis.score >= 3
    assert result.decision in {TriageDecision.REFER, TriageDecision.REFER_IMMEDIATE}


if __name__ == "__main__":
    pytest.main([__file__])
