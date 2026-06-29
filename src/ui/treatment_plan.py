"""Guideline-linked treatment plans for result cards."""

from __future__ import annotations

from dataclasses import dataclass

from decision_engine.models import FebrileAssessment, PatientContext, TriageDecision

from ui.clinic_context import ClinicContext, MalariaEndemicity


@dataclass(frozen=True)
class TreatmentPlan:
    summary: str
    detail: str
    primary_action_label: str


def _act_dose_band(age_months: int) -> str:
    if age_months < 60:
        return "weight-based ACT (artemether-lumefantrine) per national under-5 protocol"
    if age_months < 144:
        return "weight-based ACT (artemether-lumefantrine) per national child protocol"
    return "adult ACT course (artemether-lumefantrine) per national protocol"


def _presumptive_malaria_plan(
    ctx: PatientContext, clinic: ClinicContext
) -> tuple[str, str] | None:
    if not ctx.has_fever:
        return None
    if clinic.malaria_endemicity != MalariaEndemicity.HIGH:
        return None
    if not clinic.act_in_stock:
        return (
            "Presumptive malaria treatment indicated but ACT not in stock.",
            "Refer for ACT or obtain stock before treating presumptive malaria.",
        )
    dose = _act_dose_band(ctx.age_months)
    fever_support = ""
    if clinic.paracetamol_in_stock:
        fever_support = " Give paracetamol for fever."
    return (
        f"Give presumptive ACT: {dose}.",
        f"Uncomplicated fever in malaria-endemic area — start {dose} now.{fever_support} "
        "No rapid test required per presumptive-treatment guidelines.",
    )


def build_treatment_plan(
    ctx: PatientContext,
    assessment: FebrileAssessment,
    clinic: ClinicContext,
) -> TreatmentPlan:
    decision = assessment.decision

    if decision in {TriageDecision.REFER_IMMEDIATE, TriageDecision.REFER}:
        return TreatmentPlan(
            summary="Do not start outpatient treatment.",
            detail=(
                "Arrange urgent transport to referral facility. "
                "Stabilize per local protocol while awaiting teleconsultation."
            ),
            primary_action_label="Call teleconsultation now",
        )

    malaria = _presumptive_malaria_plan(ctx, clinic)

    if decision == TriageDecision.TREAT_AND_MONITOR:
        days = assessment.monitoring_days
        if malaria:
            summary, detail = malaria
            detail += f" Re-check this patient in {days} days."
        elif ctx.has_fever and clinic.paracetamol_in_stock:
            summary = "Give paracetamol for fever."
            detail = (
                f"Supportive care for uncomplicated fever. "
                f"Re-check in {days} days; return sooner if danger signs appear."
            )
        else:
            summary = "Supportive care and close observation."
            detail = (
                f"Monitor at home. Re-check in {days} days; "
                "return sooner if condition worsens."
            )
        return TreatmentPlan(
            summary=summary,
            detail=detail,
            primary_action_label="Schedule teleconsultation",
        )

    if malaria:
        summary, detail = malaria
    elif not ctx.has_fever:
        summary = "No antimalarial indicated."
        detail = "Low-risk screen without fever — routine care; counsel on return if fever develops."
    elif clinic.paracetamol_in_stock:
        summary = "Give paracetamol for fever."
        detail = "Supportive care for low-risk febrile illness without presumptive malaria indication."
    else:
        summary = "Supportive care."
        detail = "Low-risk screen — rest, fluids, and counsel on return if danger signs appear."

    return TreatmentPlan(
        summary=summary,
        detail=detail,
        primary_action_label="Start treatment",
    )
