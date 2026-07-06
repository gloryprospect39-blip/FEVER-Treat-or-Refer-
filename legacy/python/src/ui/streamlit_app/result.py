"""Triage result card — REFER / TREAT / TREAT & MONITOR."""

from __future__ import annotations

import streamlit as st

from decision_engine.models import TriageDecision
from ui.encounter_log import log_encounter
from ui.i18n.mm import mm
from ui.refer_reason import build_refer_reason
from ui.streamlit_app.session import clinic_context_from_session, reset_to_form
from ui.streamlit_app.styles import GLOBAL_CSS
from ui.teleconsultation import schedule_teleconsultation_note, teleconsultation_dial_url


def _render_card_html(css_class: str, decision: str, reason: str, plan_detail: str) -> str:
    return (
        f'<div class="triage-card {css_class}">'
        f'<p class="decision">{decision}</p>'
        f'<p class="reason">{reason}</p>'
        f'<p class="plan">{plan_detail}</p>'
        f"</div>"
    )


def _log_action(action: str) -> None:
    ctx = st.session_state.get("fg_patient_context")
    assessment = st.session_state.get("fg_assessment")
    clinic = st.session_state.get("fg_clinic_context", clinic_context_from_session())
    if ctx is not None and assessment is not None:
        log_encounter(ctx, assessment, clinic, action_taken=action)


def _finish_patient(action: str | None = None) -> None:
    _log_action(action or "new_patient")
    reset_to_form()


def render_result() -> None:
    assessment = st.session_state.get("fg_assessment")
    plan = st.session_state.get("fg_treatment_plan")
    if assessment is None or plan is None:
        st.session_state["fg_show_result"] = False
        st.rerun()
        return

    st.markdown(GLOBAL_CSS, unsafe_allow_html=True)
    st.markdown(f"### {mm.result.triage_decision}")

    decision = assessment.decision

    if decision in {TriageDecision.REFER_IMMEDIATE, TriageDecision.REFER}:
        reason = build_refer_reason(assessment.referral_reasons, assessment.urgency)
        st.markdown(
            _render_card_html("refer", mm.result.refer, reason, plan.detail),
            unsafe_allow_html=True,
        )
        if st.button(
            mm.actions.call_teleconsultation,
            type="primary",
            use_container_width=True,
            key="fg_refer_call",
        ):
            _log_action("teleconsultation_call")
            phone = teleconsultation_dial_url().replace("tel:", "")
            st.info(f"{mm.actions.call_teleconsultation}: [{phone}]({teleconsultation_dial_url()})")
        st.button(
            mm.actions.new_patient,
            use_container_width=True,
            key="fg_refer_new",
            on_click=_finish_patient,
            kwargs={"action": "refer_new_patient"},
        )
        return

    if decision == TriageDecision.TREAT_AND_MONITOR:
        days = assessment.monitoring_days
        reason = mm.result.monitor_reason(days)
        st.markdown(
            _render_card_html(
                "monitor",
                mm.result.treat_and_monitor,
                reason,
                plan.detail,
            ),
            unsafe_allow_html=True,
        )
        if st.button(
            mm.actions.schedule_teleconsultation,
            type="primary",
            use_container_width=True,
            key="fg_monitor_schedule",
        ):
            note = schedule_teleconsultation_note(days)
            _log_action(f"schedule_teleconsultation: {note}")
            st.success(note)
        st.button(
            mm.actions.new_patient,
            use_container_width=True,
            key="fg_monitor_new",
            on_click=_finish_patient,
            kwargs={"action": "monitor_new_patient"},
        )
        return

    st.markdown(
        _render_card_html("treat", mm.result.treat, plan.summary, plan.detail),
        unsafe_allow_html=True,
    )
    if st.button(
        mm.actions.start_treatment,
        type="primary",
        use_container_width=True,
        key="fg_treat_start",
    ):
        _log_action("start_treatment")
        st.success(mm.actions.treatment_acknowledged)
    st.button(
        mm.actions.new_patient,
        use_container_width=True,
        key="fg_treat_new",
        on_click=_finish_patient,
        kwargs={"action": "treat_new_patient"},
    )
