"""Explainer layer tests — Gemini is always mocked (deterministic, no API key)."""

from unittest.mock import patch

from decision_engine import evaluate_febrile_patient
from decision_engine.models import PatientContext
from explainer.narrate import narrate_assessment


def test_narrate_assessment_uses_gemini_stub(gemini_stub):
    assessment = evaluate_febrile_patient(PatientContext(age_months=36, has_fever=True))

    with patch("explainer.narrate.get_client", return_value=gemini_stub):
        text = narrate_assessment(assessment)

    assert "Treat and re-check in 3 days" in text
    gemini_stub.generate_content.assert_called_once()
    prompt = gemini_stub.generate_content.call_args[0][0]
    assert assessment.decision.value in prompt
