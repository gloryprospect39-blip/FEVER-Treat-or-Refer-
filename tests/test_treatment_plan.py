"""Tests for guideline-linked treatment plans."""

from decision_engine import evaluate_febrile_patient
from decision_engine.models import DangerSigns, PatientContext, TriageDecision
from ui.clinic_context import ClinicContext, MalariaEndemicity
from ui.treatment_plan import build_treatment_plan


def test_refer_plan_no_outpatient_treatment():
    ctx = PatientContext(
        age_months=24, has_fever=True, danger_signs=DangerSigns(convulsions=True)
    )
    assessment = evaluate_febrile_patient(ctx)
    plan = build_treatment_plan(ctx, assessment, ClinicContext())

    assert assessment.decision == TriageDecision.REFER_IMMEDIATE
    assert "outpatient" in plan.summary.lower()
    assert plan.primary_action_label == "Call teleconsultation now"


def test_monitor_plan_presumptive_act_in_endemic_zone():
    ctx = PatientContext(age_months=36, has_fever=True)
    assessment = evaluate_febrile_patient(ctx)
    clinic = ClinicContext(
        malaria_endemicity=MalariaEndemicity.HIGH,
        act_in_stock=True,
    )
    plan = build_treatment_plan(ctx, assessment, clinic)

    assert assessment.decision == TriageDecision.TREAT_AND_MONITOR
    assert "ACT" in plan.summary
    assert plan.primary_action_label == "Schedule teleconsultation"


def test_treat_plan_no_antimalarial_without_fever():
    ctx = PatientContext(age_months=192, has_fever=False)
    assessment = evaluate_febrile_patient(ctx)
    clinic = ClinicContext(malaria_endemicity=MalariaEndemicity.HIGH, act_in_stock=True)
    plan = build_treatment_plan(ctx, assessment, clinic)

    assert assessment.decision == TriageDecision.TREAT
    assert "antimalarial" in plan.summary.lower()


def test_monitor_plan_no_act_when_out_of_stock():
    ctx = PatientContext(age_months=36, has_fever=True)
    assessment = evaluate_febrile_patient(ctx)
    clinic = ClinicContext(
        malaria_endemicity=MalariaEndemicity.HIGH,
        act_in_stock=False,
    )
    plan = build_treatment_plan(ctx, assessment, clinic)

    assert "not in stock" in plan.summary.lower()
