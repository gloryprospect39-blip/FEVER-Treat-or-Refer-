"""Triage form — Myanmar UI aligned with Next.js FeverGate."""

from __future__ import annotations

import streamlit as st

from decision_engine import evaluate_febrile_patient
from decision_engine.models import Comorbidity
from ui.clinic_context import MalariaEndemicity
from ui.comorbidity_options import comorbidity_options_for_band, options_by_system
from ui.danger_sign_labels import (
    ADULT_DANGER_SIGN_TILES,
    PEDIATRIC_DANGER_SIGN_TILES,
)
from ui.i18n.mm import COMORBIDITY_LABELS_MM, DANGER_SIGN_LABELS_MM, SYSTEM_LABELS_MM, mm
from ui.i18n.pathways_mm import (
    PATHWAY_ADULT,
    PATHWAY_CHILD,
    age_bands_for_pathway,
    default_age_band,
    is_child_pathway,
    to_engine_band,
)
from ui.pathways import PATHWAY_ADULT as ENGINE_PATHWAY_ADULT
from ui.pathways import PATHWAY_CHILD as ENGINE_PATHWAY_CHILD
from ui.patient_context import build_patient_context
from ui.streamlit_app.components import page_header, section_block
from ui.streamlit_app.session import clinic_context_from_session
from ui.treatment_plan import build_treatment_plan

PEDIATRIC_ENGINE_BANDS = {
    "Under 2 months",
    "2 months \u2013 5 years",
    "5\u201315 years",
}


def _danger_tiles_for_pathway(engine_pathway: str):
    if engine_pathway == ENGINE_PATHWAY_ADULT:
        return ADULT_DANGER_SIGN_TILES
    return PEDIATRIC_DANGER_SIGN_TILES


def _clear_pathway_widgets(pathway: str) -> None:
    other = PATHWAY_ADULT if pathway == PATHWAY_CHILD else PATHWAY_CHILD
    for key in list(st.session_state):
        if key.startswith(f"fg_tile_{other}_") or key.startswith("fg_comorb_"):
            st.session_state.pop(key, None)


def _engine_pathway(pathway: str) -> str:
    return ENGINE_PATHWAY_CHILD if is_child_pathway(pathway) else ENGINE_PATHWAY_ADULT


def _render_clinic_context() -> None:
    show = st.session_state.get("fg_show_clinic", False)
    label = mm.clinic.hide_settings if show else mm.clinic.show_settings
    if st.button(label, key="fg_clinic_toggle"):
        st.session_state["fg_show_clinic"] = not show
        st.rerun()

    if not show:
        return

    with section_block(mm.clinic.title):
        st.markdown("**" + mm.clinic.stock_heading + "**")
        c1, c2, c3 = st.columns(3)
        with c1:
            st.toggle(mm.clinic.act_in_stock, value=True, key="fg_act_in_stock")
        with c2:
            st.toggle(mm.clinic.amoxicillin, value=False, key="fg_amoxicillin_in_stock")
        with c3:
            st.toggle(mm.clinic.paracetamol, value=True, key="fg_paracetamol_in_stock")

        st.markdown("**" + mm.clinic.endemicity_heading + "**")
        st.radio(
            mm.clinic.endemicity_heading,
            [MalariaEndemicity.HIGH.value, MalariaEndemicity.LOW.value],
            index=0,
            horizontal=True,
            key="fg_malaria_endemicity",
            format_func=lambda v: (
                mm.clinic.high_endemicity
                if v == MalariaEndemicity.HIGH.value
                else mm.clinic.low_endemicity
            ),
            label_visibility="collapsed",
        )


def _render_age_selector() -> tuple[str, str, str]:
    with section_block(mm.age.title):
        pathway = st.radio(
            mm.age.title,
            [PATHWAY_CHILD, PATHWAY_ADULT],
            horizontal=True,
            key="fg_pathway",
            label_visibility="collapsed",
        )

        if st.session_state.get("fg_last_pathway") != pathway:
            st.session_state["fg_last_pathway"] = pathway
            st.session_state["fg_age_band"] = default_age_band(pathway)
            _clear_pathway_widgets(pathway)

        bands = age_bands_for_pathway(pathway)
        current = st.session_state.get("fg_age_band", default_age_band(pathway))
        if current not in bands:
            current = default_age_band(pathway)
            st.session_state["fg_age_band"] = current

        age_band = st.radio(
            "Age band",
            list(bands),
            index=list(bands).index(current),
            horizontal=True,
            key=f"fg_age_band_{pathway}",
            label_visibility="collapsed",
        )
        st.session_state["fg_age_band"] = age_band
        engine_band = to_engine_band(age_band)

    return pathway, age_band, engine_band


def _render_comorbidities(engine_band: str) -> list[Comorbidity]:
    options = comorbidity_options_for_band(engine_band)
    if not options:
        return []

    selected: list[Comorbidity] = []
    if engine_band in PEDIATRIC_ENGINE_BANDS:
        with section_block(mm.comorbidity.pediatric_title, mm.comorbidity.pediatric_desc):
            cols = st.columns(2)
            for index, option in enumerate(options):
                label = COMORBIDITY_LABELS_MM.get(
                    option.comorbidity.value, option.label
                )
                with cols[index % 2]:
                    if st.toggle(
                        f"{option.icon} {label}",
                        key=f"fg_comorb_{option.comorbidity.value}",
                    ):
                        selected.append(option.comorbidity)
        return selected

    with section_block(mm.comorbidity.adult_title, mm.comorbidity.adult_desc):
        for system, system_options in options_by_system(engine_band).items():
            system_label = SYSTEM_LABELS_MM.get(system, system)
            st.markdown(f"**{system_label}**")
            cols = st.columns(2)
            for index, option in enumerate(system_options):
                label = COMORBIDITY_LABELS_MM.get(
                    option.comorbidity.value, option.label
                )
                with cols[index % 2]:
                    if st.toggle(
                        f"{option.icon} {label}",
                        key=f"fg_comorb_{option.comorbidity.value}",
                    ):
                        selected.append(option.comorbidity)
    return selected


def render_form() -> None:
    page_header(mm.app.title, mm.app.tagline)
    _render_clinic_context()

    pathway, _display_band, engine_band = _render_age_selector()

    with section_block(mm.fever.title):
        f1, f2 = st.columns(2)
        with f1:
            has_fever = st.toggle(mm.fever.has_fever, value=True, key="fg_has_fever")
        with f2:
            fever_days = st.number_input(
                mm.fever.duration_days,
                min_value=0,
                max_value=60,
                value=1,
                step=1,
                key="fg_fever_days",
            )

    show_vitals = st.session_state.get("fg_show_vitals", False)
    vitals_label = mm.vitals.hide if show_vitals else mm.vitals.show
    if st.button(vitals_label, key="fg_vitals_toggle"):
        st.session_state["fg_show_vitals"] = not show_vitals
        st.rerun()

    systolic_bp = spo2 = respiratory_rate = heart_rate = 0
    temperature = 0.0
    if show_vitals:
        with section_block(mm.vitals.title, mm.vitals.not_measured_help):
            t1, t2 = st.columns(2)
            with t1:
                temperature = st.number_input(
                    mm.vitals.temperature,
                    min_value=0.0,
                    max_value=45.0,
                    value=0.0,
                    step=0.1,
                    format="%.1f",
                    key="fg_temp",
                )
            with t2:
                heart_rate = st.number_input(
                    mm.vitals.heart_rate,
                    min_value=0,
                    max_value=300,
                    value=0,
                    key="fg_hr",
                )
            v1, v2, v3 = st.columns(3)
            with v1:
                systolic_bp = st.number_input(
                    mm.vitals.systolic_bp,
                    min_value=0,
                    max_value=300,
                    value=0,
                    key="fg_bp",
                )
            with v2:
                spo2 = st.number_input(
                    mm.vitals.spo2,
                    min_value=0,
                    max_value=100,
                    value=0,
                    key="fg_spo2",
                )
            with v3:
                respiratory_rate = st.number_input(
                    mm.vitals.respiratory_rate,
                    min_value=0,
                    max_value=80,
                    value=0,
                    key="fg_rr",
                )

    danger_title = (
        mm.danger_signs.pediatric_title
        if is_child_pathway(pathway)
        else mm.danger_signs.adult_title
    )
    danger_desc = (
        mm.danger_signs.pediatric_desc
        if is_child_pathway(pathway)
        else mm.danger_signs.adult_desc
    )

    with section_block(danger_title, danger_desc):
        tiles = _danger_tiles_for_pathway(_engine_pathway(pathway))
        selected: dict[str, bool] = {}
        cols = st.columns(2)
        for index, tile in enumerate(tiles):
            label = DANGER_SIGN_LABELS_MM.get(tile.trigger_code, tile.label)
            with cols[index % 2]:
                selected[tile.trigger_code] = st.toggle(
                    f"{tile.icon} {label}",
                    key=f"fg_tile_{pathway}_{tile.trigger_code}",
                )

    selected_comorbidities = _render_comorbidities(engine_band)

    if st.button(mm.actions.assess, type="primary", use_container_width=True):
        try:
            clinic = clinic_context_from_session()
            engine_pathway = _engine_pathway(pathway)
            ctx = build_patient_context(
                age_band=engine_band,
                has_fever=has_fever,
                fever_duration_days=int(fever_days),
                selected_tiles=selected,
                comorbidities=selected_comorbidities,
                systolic_bp=systolic_bp or None,
                spo2_percent=spo2 or None,
                respiratory_rate=respiratory_rate or None,
                temperature_c=temperature or None,
                heart_rate=heart_rate or None,
                pathway=engine_pathway,
            )
            assessment = evaluate_febrile_patient(ctx)
            plan = build_treatment_plan(ctx, assessment, clinic)
            st.session_state["fg_patient_context"] = ctx
            st.session_state["fg_clinic_context"] = clinic
            st.session_state["fg_assessment"] = assessment
            st.session_state["fg_treatment_plan"] = plan
            st.session_state["fg_show_result"] = True
            st.rerun()
        except Exception as exc:  # noqa: BLE001 — surface details for field debugging
            st.error(mm.assess_error)
            with st.expander("Technical details"):
                st.exception(exc)
