"""Session state helpers for the Streamlit triage flow."""

from __future__ import annotations

import streamlit as st

from ui.clinic_context import ClinicContext, MalariaEndemicity


def reset_to_form() -> None:
    st.session_state["fg_show_result"] = False
    for key in (
        "fg_assessment",
        "fg_patient_context",
        "fg_treatment_plan",
        "fg_clinic_context",
    ):
        st.session_state.pop(key, None)


def clinic_context_from_session() -> ClinicContext:
    return ClinicContext(
        malaria_endemicity=MalariaEndemicity(
            st.session_state.get("fg_malaria_endemicity", MalariaEndemicity.HIGH.value)
        ),
        act_in_stock=st.session_state.get("fg_act_in_stock", True),
        amoxicillin_in_stock=st.session_state.get("fg_amoxicillin_in_stock", False),
        paracetamol_in_stock=st.session_state.get("fg_paracetamol_in_stock", True),
    )
