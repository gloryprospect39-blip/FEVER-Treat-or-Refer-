"""Human-readable referral reason lines for the result card."""

from __future__ import annotations

from decision_engine.models import DANGER_SIGN_LABELS, ReferralUrgency

EXTRA_REASON_LABELS: dict[str, str] = {
    "neonate_fever": DANGER_SIGN_LABELS["neonate_fever"],
    "hypoxia": "Low oxygen saturation",
    "hypotension_adult": "Low blood pressure",
    "hypotension_pediatric": "Low blood pressure",
    "weak_or_absent_radial_pulse": "Weak or absent pulse",
    "qsofa>=2": "Elevated qSOFA",
    "composite_sepsis_score>=3": "Elevated sepsis screen",
}


def urgency_phrase(urgency: ReferralUrgency) -> str:
    if urgency == ReferralUrgency.IMMEDIATE:
        return "refer immediately"
    if urgency == ReferralUrgency.SAME_DAY:
        return "refer (same day)"
    return "refer"


def build_refer_reason(referral_reasons: list[str], urgency: ReferralUrgency) -> str:
    named: list[str] = []
    for code in referral_reasons:
        if code == "convulsions":
            continue
        label = DANGER_SIGN_LABELS.get(code) or EXTRA_REASON_LABELS.get(code)
        if label is None and code.startswith("news2>="):
            label = "Elevated NEWS2"
        if label and label not in named:
            named.append(label)

    subject = ", ".join(named) if named else "Elevated severe-illness screen"
    return f"{subject} \u2014 {urgency_phrase(urgency)}."
