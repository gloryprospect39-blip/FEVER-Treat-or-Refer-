import pytest

from decision_engine import evaluate_febrile_patient
from decision_engine.models import (
    DANGER_SIGN_LABELS,
    ConsciousnessLevel,
    DangerSigns,
    PatientContext,
    TriageDecision,
    VitalSigns,
)

# Each entry: (kind, name, expected_trigger_code)
# kind "danger_sign" -> boolean field on DangerSigns
# kind "consciousness" -> value for PatientContext.consciousness
DANGER_SIGN_CASES = [
    ("danger_sign", "unable_to_drink_or_breastfeed", "imci:unable_to_drink_or_breastfeed"),
    ("danger_sign", "vomits_everything", "imci:vomits_everything"),
    ("danger_sign", "convulsions", "imci:convulsions"),
    ("danger_sign", "chest_indrawing", "imci:chest_indrawing"),
    ("danger_sign", "stiff_neck", "imci:stiff_neck"),
    ("danger_sign", "bulging_fontanelle", "imci:bulging_fontanelle"),
    ("danger_sign", "severe_palmar_pallor", "imci:severe_palmar_pallor"),
    ("consciousness", ConsciousnessLevel.LETHARGIC, "imci:lethargic"),
    ("consciousness", ConsciousnessLevel.UNCONSCIOUS, "imci:unconscious"),
]

AGE_BANDS = [24, 96]  # under-5 child, school-age child

REFER_DECISIONS = {TriageDecision.REFER_IMMEDIATE, TriageDecision.REFER}


def _build_context(kind: str, value, age_months: int) -> PatientContext:
    kwargs = {"age_months": age_months, "has_fever": True}
    if kind == "danger_sign":
        kwargs["danger_signs"] = DangerSigns(**{value: True})
    elif kind == "consciousness":
        kwargs["consciousness"] = value
    else:  # pragma: no cover - guards against typos in the parametrization
        raise ValueError(f"unknown kind: {kind}")
    return PatientContext(**kwargs)


@pytest.mark.parametrize("age_months", AGE_BANDS)
@pytest.mark.parametrize(
    "kind,value,expected_trigger",
    DANGER_SIGN_CASES,
    ids=[case[2] for case in DANGER_SIGN_CASES],
)
def test_any_danger_sign_forces_referral(kind, value, expected_trigger, age_months):
    ctx = _build_context(kind, value, age_months)
    result = evaluate_febrile_patient(ctx)

    assert result.decision in REFER_DECISIONS
    assert expected_trigger in result.referral_reasons
    assert expected_trigger in DANGER_SIGN_LABELS


def test_uncomplicated_under5_fever_does_not_refer():
    """Baseline guard against over-referral: plain under-5 fever stays local."""
    result = evaluate_febrile_patient(
        PatientContext(
            age_months=36,
            has_fever=True,
            vitals=VitalSigns(temperature_c=38.2, heart_rate=110, respiratory_rate=28),
        )
    )
    assert result.decision == TriageDecision.TREAT_AND_MONITOR
    assert result.referral_reasons == []


if __name__ == "__main__":
    pytest.main([__file__])
