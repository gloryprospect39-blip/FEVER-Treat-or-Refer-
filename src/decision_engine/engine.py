"""Febrile patient triage orchestrator (all ages)."""

from __future__ import annotations

from .models import FebrileAssessment, PatientContext, TriageDecision
from .sepsis_screen import assess_sepsis_risk

MONITORING_DAYS = {
    TriageDecision.REFER_IMMEDIATE: 0,
    TriageDecision.REFER: 0,
    TriageDecision.TREAT_AND_MONITOR: 3,
    TriageDecision.TREAT: 0,
}


def evaluate_febrile_patient(ctx: PatientContext) -> FebrileAssessment:
    sepsis = assess_sepsis_risk(ctx)

    referral_reasons = list(sepsis.hard_referral_triggers)
    if sepsis.decision in {TriageDecision.REFER, TriageDecision.REFER_IMMEDIATE}:
        if sepsis.qsofa_score is not None and sepsis.qsofa_score >= 2:
            referral_reasons.append("qsofa>=2")
        if sepsis.news2_score is not None and sepsis.news2_score >= 5:
            referral_reasons.append(f"news2>={sepsis.news2_score}")
        if sepsis.score >= 3:
            referral_reasons.append("composite_sepsis_score>=3")

    rationale = [
        "Screening for severe illness without laboratory tests.",
        *sepsis.rationale,
    ]
    if sepsis.score_components:
        rationale.append(f"Score components: {', '.join(sepsis.score_components)}")

    return FebrileAssessment(
        sepsis=sepsis,
        decision=sepsis.decision,
        urgency=sepsis.urgency,
        monitoring_days=MONITORING_DAYS[sepsis.decision],
        referral_reasons=sorted(set(referral_reasons)),
        rationale=rationale,
    )
