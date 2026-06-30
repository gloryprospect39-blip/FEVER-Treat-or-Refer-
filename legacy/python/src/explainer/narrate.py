"""Plain-language narration of a rule-engine assessment (never overrides decisions)."""

from __future__ import annotations

from decision_engine.models import FebrileAssessment

from .gemini_client import get_client


def narrate_assessment(assessment: FebrileAssessment) -> str:
    """Ask Gemini to explain the deterministic assessment in colleague-friendly prose."""
    client = get_client()
    prompt = (
        "Explain this febrile triage screen result in one short paragraph. "
        f"Decision: {assessment.decision.value}. "
        f"Urgency: {assessment.urgency.value}. "
        f"Reasons: {', '.join(assessment.referral_reasons) or 'none'}. "
        "Do not change or second-guess the decision."
    )
    response = client.generate_content(prompt)
    return response.text
