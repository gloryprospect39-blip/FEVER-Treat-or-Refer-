"""Tests for temperature / heart-rate capture flowing into the decision engine."""

from decision_engine import evaluate_febrile_patient
from decision_engine.models import Comorbidity, TriageDecision
from ui.i18n.mm import COMORBIDITY_LABELS_MM
from ui.patient_context import build_patient_context


def _adult_ctx(**kwargs):
    return build_patient_context(
        age_band="18\u201364 years",
        has_fever=kwargs.pop("has_fever", True),
        fever_duration_days=1,
        selected_tiles={},
        pathway="Adult (15+)",
        **kwargs,
    )


def test_temperature_is_recorded_on_context():
    ctx = _adult_ctx(temperature_c=39.2)
    assert ctx.vitals.temperature_c == 39.2


def test_heart_rate_is_recorded_on_context():
    ctx = _adult_ctx(heart_rate=130)
    assert ctx.vitals.heart_rate == 130


def test_measured_temperature_overrides_fever_toggle():
    # Toggle says fever, but a measured normal temperature corrects it.
    ctx = _adult_ctx(has_fever=True, temperature_c=37.0)
    assert ctx.has_fever is False


def test_hypothermia_raises_composite_score():
    warm = evaluate_febrile_patient(_adult_ctx(temperature_c=38.5))
    cold = evaluate_febrile_patient(_adult_ctx(temperature_c=35.2))
    assert cold.sepsis.score > warm.sepsis.score


def test_hypothermia_with_comorbidity_triggers_referral():
    ctx = _adult_ctx(temperature_c=35.0, comorbidities=[Comorbidity.HIV])
    assessment = evaluate_febrile_patient(ctx)
    assert assessment.decision in {
        TriageDecision.REFER,
        TriageDecision.REFER_IMMEDIATE,
    }


def test_all_comorbidities_have_myanmar_labels():
    for comorbidity in Comorbidity:
        assert comorbidity.value in COMORBIDITY_LABELS_MM
