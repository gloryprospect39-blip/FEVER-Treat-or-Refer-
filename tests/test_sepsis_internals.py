"""Unit tests for sepsis_screen internals (engineering.md §10)."""

import pytest

from decision_engine.models import (
    Comorbidity,
    ConsciousnessLevel,
    DANGER_SIGN_LABELS,
    DangerSigns,
    PatientContext,
    VitalSigns,
)
from decision_engine.sepsis_screen import (
    _age_band,
    _composite_score,
    _compute_news2,
    _compute_qsofa,
    _hard_referral_triggers,
    _imci_danger_signs,
)

DANGER_SIGN_FIELDS = [
    ("unable_to_drink_or_breastfeed", "imci:unable_to_drink_or_breastfeed"),
    ("vomits_everything", "imci:vomits_everything"),
    ("convulsions", "imci:convulsions"),
    ("chest_indrawing", "imci:chest_indrawing"),
    ("stiff_neck", "imci:stiff_neck"),
    ("bulging_fontanelle", "imci:bulging_fontanelle"),
    ("severe_palmar_pallor", "imci:severe_palmar_pallor"),
]


@pytest.mark.parametrize(
    "age_months,expected",
    [
        (1, "neonate"),
        (2, "under5"),
        (59, "under5"),
        (60, "child_5_12"),
        (144, "adolescent"),
        (216, "adult"),
        (780, "elderly"),
    ],
)
def test_age_band_boundaries(age_months, expected):
    assert _age_band(age_months) == expected


@pytest.mark.parametrize("field,trigger", DANGER_SIGN_FIELDS)
def test_imci_danger_sign_maps_boolean_field(field, trigger):
    ctx = PatientContext(
        age_months=24,
        danger_signs=DangerSigns(**{field: True}),
    )
    assert trigger in _imci_danger_signs(ctx)


def test_imci_danger_sign_lethargic():
    ctx = PatientContext(age_months=24, consciousness=ConsciousnessLevel.LETHARGIC)
    assert "imci:lethargic" in _imci_danger_signs(ctx)


def test_imci_danger_sign_unconscious():
    ctx = PatientContext(age_months=24, consciousness=ConsciousnessLevel.UNCONSCIOUS)
    assert "imci:unconscious" in _imci_danger_signs(ctx)


def test_imci_danger_sign_empty_when_none_set():
    ctx = PatientContext(age_months=24)
    assert _imci_danger_signs(ctx) == []


@pytest.mark.parametrize("age_months", [24, 96])
@pytest.mark.parametrize("field,trigger", DANGER_SIGN_FIELDS)
def test_hard_referral_triggers_imci_at_all_ages(age_months, field, trigger):
    ctx = PatientContext(
        age_months=age_months,
        danger_signs=DangerSigns(**{field: True}),
    )
    triggers = _hard_referral_triggers(ctx)
    assert trigger in triggers


def test_hard_referral_convulsions_emits_bare_reason():
    ctx = PatientContext(age_months=24, danger_signs=DangerSigns(convulsions=True))
    triggers = _hard_referral_triggers(ctx)
    assert "convulsions" in triggers
    assert "imci:convulsions" in triggers


def test_compute_qsofa_none_under_12_years():
    ctx = PatientContext(age_months=120, vitals=VitalSigns(systolic_bp=90, respiratory_rate=24))
    assert _compute_qsofa(ctx) is None


def test_compute_qsofa_adult_score_at_least_two():
    ctx = PatientContext(
        age_months=480,
        consciousness=ConsciousnessLevel.LETHARGIC,
        vitals=VitalSigns(systolic_bp=95, respiratory_rate=24),
    )
    assert _compute_qsofa(ctx) is not None
    assert _compute_qsofa(ctx) >= 2


def test_compute_news2_none_without_respiratory_rate():
    ctx = PatientContext(age_months=480, vitals=VitalSigns())
    assert _compute_news2(ctx) is None


def test_compute_news2_none_under_12_years():
    ctx = PatientContext(age_months=120, vitals=VitalSigns(respiratory_rate=30))
    assert _compute_news2(ctx) is None


def test_compute_news2_high_derangement_at_least_seven():
    ctx = PatientContext(
        age_months=600,
        consciousness=ConsciousnessLevel.UNCONSCIOUS,
        vitals=VitalSigns(
            temperature_c=35.2,
            respiratory_rate=28,
            systolic_bp=85,
            heart_rate=125,
            spo2_percent=89,
        ),
    )
    score = _compute_news2(ctx)
    assert score is not None
    assert score >= 7


def test_composite_score_neonate_age_points():
    ctx = PatientContext(age_months=1, vitals=VitalSigns())
    score, components = _composite_score(ctx)
    assert score >= 3
    assert any("age:neonate" in c for c in components)


def test_composite_score_hypothermia():
    ctx = PatientContext(age_months=480, vitals=VitalSigns(temperature_c=35.5))
    _, components = _composite_score(ctx)
    assert "hypothermia(+2)" in components


def test_composite_score_lethargy():
    ctx = PatientContext(age_months=480, consciousness=ConsciousnessLevel.LETHARGIC)
    _, components = _composite_score(ctx)
    assert "lethargy(+2)" in components


def test_composite_score_comorbidities():
    ctx = PatientContext(
        age_months=480,
        comorbidities=[Comorbidity.HIV, Comorbidity.PREGNANCY],
    )
    _, components = _composite_score(ctx)
    assert any("comorbidities" in c for c in components)


def test_composite_score_prolonged_fever():
    ctx = PatientContext(age_months=480, fever_duration_days=5)
    _, components = _composite_score(ctx)
    assert "prolonged_fever(+1)" in components


def test_composite_score_toxic_appearance():
    ctx = PatientContext(age_months=480, toxic_appearance=True)
    _, components = _composite_score(ctx)
    assert "toxic_appearance(+2)" in components


def test_danger_sign_labels_cover_all_imci_triggers():
    for _, trigger in DANGER_SIGN_FIELDS:
        assert trigger in DANGER_SIGN_LABELS
    assert "imci:lethargic" in DANGER_SIGN_LABELS
    assert "imci:unconscious" in DANGER_SIGN_LABELS
