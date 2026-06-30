"""FeverGate — point-of-care febrile triage UI (Streamlit).

Run with: ``uv run streamlit run app.py``
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "src"))

import streamlit as st

from decision_engine import evaluate_febrile_patient
from decision_engine.models import Comorbidity, TriageDecision
from ui.catchment import require_catchment
from ui.clinic_context import ClinicContext, MalariaEndemicity
from ui.comorbidity_options import comorbidity_options_for_band, options_by_system
from ui.danger_sign_labels import DANGER_SIGN_TILES
from ui.encounter_log import log_encounter
from ui.patient_context import build_patient_context
from ui.patient_registry import (
    RegisteredPatient,
    list_recent_patients,
    list_villages,
    resolve_patient_for_encounter,
)
from ui.pathways import (
    PATHWAY_ADULT,
    PATHWAY_CHILD,
    age_bands_for_pathway,
    default_age_band_index,
    is_pediatric_pathway,
)
from ui.refer_reason import build_refer_reason
from ui.teleconsultation import schedule_teleconsultation_note, teleconsultation_dial_url
from ui.treatment_plan import build_treatment_plan

NEW_PATIENT_LABEL = "\u2014 New patient \u2014"
ALL_VILLAGES_LABEL = "All villages"
NEW_CATCHMENT_LABEL = "\u2014 Type new village \u2014"

CARD_CSS = """
<style>
.triage-card {
    width: 100%;
    border-radius: 14px;
    padding: 1.6rem 1.4rem;
    margin: 0.5rem 0 1.2rem 0;
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
}
.triage-card .decision {
    font-size: 1.9rem;
    font-weight: 800;
    letter-spacing: 0.5px;
    margin: 0 0 0.4rem 0;
}
.triage-card .reason {
    font-size: 1.25rem;
    font-weight: 500;
    margin: 0 0 0.6rem 0;
    line-height: 1.4;
}
.triage-card .plan {
    font-size: 1.05rem;
    font-weight: 400;
    margin: 0;
    line-height: 1.45;
    opacity: 0.95;
}
.triage-card.refer { background: #c0392b; }
.triage-card.monitor { background: #d68910; }
.triage-card.treat { background: #1e8449; }
</style>
"""


def _clinic_context_from_session() -> ClinicContext:
    return ClinicContext(
        malaria_endemicity=MalariaEndemicity(
            st.session_state.get("malaria_endemicity", MalariaEndemicity.HIGH.value)
        ),
        act_in_stock=st.session_state.get("act_in_stock", True),
        amoxicillin_in_stock=st.session_state.get("amoxicillin_in_stock", False),
        paracetamol_in_stock=st.session_state.get("paracetamol_in_stock", True),
    )


def reset_to_form() -> None:
    st.session_state["show_result"] = False
    st.session_state.pop("assessment", None)
    st.session_state.pop("patient_context", None)
    st.session_state.pop("treatment_plan", None)
    st.session_state.pop("registered_patient", None)
    st.session_state.pop("catchment", None)
    for key in ("revisit_select", "reg_patient_name", "reg_village", "village_filter", "catchment_pick"):
        st.session_state.pop(key, None)


def _render_patient_registration() -> tuple[str, str, str | None]:
    """Catchment (required), optional name, and optional existing patient id for a revisit."""
    st.subheader("Village / catchment")
    st.caption("Required on every encounter for epidemiologic reporting.")

    villages = list_villages()
    village_filter = st.selectbox(
        "Filter by village",
        [ALL_VILLAGES_LABEL, *villages],
        key="village_filter",
    )
    active_village = (
        None if village_filter == ALL_VILLAGES_LABEL else village_filter
    )

    recent = list_recent_patients(village=active_village)
    if active_village:
        labels = [NEW_PATIENT_LABEL, *[patient.name for patient in recent]]
    else:
        labels = [NEW_PATIENT_LABEL, *[patient.display_label for patient in recent]]

    revisit = st.selectbox("Returning patient?", labels, key="revisit_select")
    if revisit != NEW_PATIENT_LABEL:
        patient = recent[labels.index(revisit) - 1]
        st.caption(
            f"Revisit \u2014 {patient.village} \u00b7 visit #{patient.visit_count + 1} "
            f"(last seen {patient.last_seen_at[:10]})"
        )
        return patient.name, patient.village, patient.id

    catchment_options = [NEW_CATCHMENT_LABEL, *villages]
    pick = st.selectbox(
        "Village / catchment",
        catchment_options,
        key="catchment_pick",
    )
    if pick == NEW_CATCHMENT_LABEL:
        catchment = st.text_input(
            "Enter village / catchment",
            key="reg_village",
            placeholder="Required",
        )
    else:
        catchment = pick

    name = st.text_input(
        "Patient name",
        key="reg_patient_name",
        placeholder="Optional",
    )
    return name, catchment, None


def _render_clinic_context() -> None:
    with st.expander("Clinic context (today's stock)", expanded=False):
        endemicity = st.radio(
            "Malaria endemicity",
            [MalariaEndemicity.HIGH.value, MalariaEndemicity.LOW.value],
            index=0,
            horizontal=True,
            key="malaria_endemicity",
        )
        stock_col1, stock_col2, stock_col3 = st.columns(3)
        with stock_col1:
            st.toggle("ACT in stock", value=True, key="act_in_stock")
        with stock_col2:
            st.toggle("Amoxicillin in stock", value=False, key="amoxicillin_in_stock")
        with stock_col3:
            st.toggle("Paracetamol in stock", value=True, key="paracetamol_in_stock")
        st.caption(f"Endemicity: {endemicity} — treatment plans respect stock on hand.")


def _render_comorbidities(age_band: str) -> list[Comorbidity]:
    options = comorbidity_options_for_band(age_band)
    if not options:
        return []

    selected: list[Comorbidity] = []
    if is_pediatric_pathway(age_band):
        st.subheader("High-risk conditions")
        st.caption("Sickle cell or severe malnutrition — tap if present.")
        comorb_cols = st.columns(2)
        for index, option in enumerate(options):
            with comorb_cols[index % 2]:
                if st.toggle(
                    f"{option.icon} {option.label}",
                    key=f"comorb_{option.comorbidity.value}",
                ):
                    selected.append(option.comorbidity)
        return selected

    st.subheader("Underlying diseases")
    st.caption("Tap any that apply — grouped by organ system.")
    for system, system_options in options_by_system(age_band).items():
        st.markdown(f"**{system}**")
        comorb_cols = st.columns(2)
        for index, option in enumerate(system_options):
            with comorb_cols[index % 2]:
                if st.toggle(
                    f"{option.icon} {option.label}",
                    key=f"comorb_{option.comorbidity.value}",
                ):
                    selected.append(option.comorbidity)
    return selected


def _render_age_selector() -> str:
    pathway = st.radio(
        "Age group",
        [PATHWAY_CHILD, PATHWAY_ADULT],
        horizontal=True,
        index=0,
        key="pathway_group",
    )
    bands = age_bands_for_pathway(pathway)
    return st.radio(
        "Age",
        list(bands),
        index=default_age_band_index(pathway),
        key=f"age_band_{pathway}",
    )


def render_form() -> None:
    st.title("FeverGate")
    st.caption("Point-of-care treat / refer \u2014 screening only.")

    _render_clinic_context()

    reg_name, reg_village, revisit_id = _render_patient_registration()

    band = _render_age_selector()

    fever_col, dur_col = st.columns(2)
    with fever_col:
        has_fever = st.toggle("Fever", value=True)
    with dur_col:
        fever_days = st.number_input(
            "Fever duration (days)", min_value=0, max_value=60, value=1, step=1
        )

    with st.expander("Vitals (optional)", expanded=False):
        vit_col1, vit_col2, vit_col3 = st.columns(3)
        with vit_col1:
            systolic_bp = st.number_input(
                "Systolic BP (mmHg)",
                min_value=0,
                max_value=300,
                value=0,
                step=1,
                help="Leave at 0 if not measured.",
            )
        with vit_col2:
            spo2 = st.number_input(
                "SpO\u2082 (%)",
                min_value=0,
                max_value=100,
                value=0,
                step=1,
                help="Leave at 0 if not measured.",
            )
        with vit_col3:
            respiratory_rate = st.number_input(
                "Respiratory rate (/min)",
                min_value=0,
                max_value=80,
                value=0,
                step=1,
                help="Leave at 0 if not measured.",
            )

    st.subheader("Danger signs")
    selected: dict[str, bool] = {}
    columns = st.columns(2)
    for index, tile in enumerate(DANGER_SIGN_TILES):
        with columns[index % 2]:
            selected[tile.trigger_code] = st.toggle(
                f"{tile.icon} {tile.label}", key=f"tile_{tile.trigger_code}"
            )

    selected_comorbidities = _render_comorbidities(band)

    if st.button("Assess patient", type="primary", use_container_width=True):
        try:
            catchment = require_catchment(reg_village)
        except ValueError:
            st.error("Village / catchment is required for every encounter.")
            return
        try:
            clinic = _clinic_context_from_session()
            ctx = build_patient_context(
                age_band=band,
                has_fever=has_fever,
                fever_duration_days=int(fever_days),
                selected_tiles=selected,
                comorbidities=selected_comorbidities,
                systolic_bp=systolic_bp or None,
                spo2_percent=spo2 or None,
                respiratory_rate=respiratory_rate or None,
            )
            assessment = evaluate_febrile_patient(ctx)
            plan = build_treatment_plan(ctx, assessment, clinic)
            registered = resolve_patient_for_encounter(
                reg_name, catchment, patient_id=revisit_id
            )
            st.session_state["patient_context"] = ctx
            st.session_state["clinic_context"] = clinic
            st.session_state["assessment"] = assessment
            st.session_state["treatment_plan"] = plan
            st.session_state["catchment"] = catchment
            if registered:
                st.session_state["registered_patient"] = registered
            else:
                st.session_state.pop("registered_patient", None)
            st.session_state["show_result"] = True
            st.rerun()
        except Exception:
            st.error("Couldn't assess \u2014 check inputs and retry.")


def _render_card_html(
    css_class: str, decision: str, reason: str, plan_detail: str
) -> str:
    return (
        f'<div class="triage-card {css_class}">'
        f'<p class="decision">{decision}</p>'
        f'<p class="reason">{reason}</p>'
        f'<p class="plan">{plan_detail}</p>'
        f"</div>"
    )


def _log_action(action: str) -> None:
    ctx = st.session_state.get("patient_context")
    assessment = st.session_state.get("assessment")
    clinic = st.session_state.get("clinic_context", _clinic_context_from_session())
    registered = st.session_state.get("registered_patient")
    catchment = st.session_state.get("catchment")
    if ctx is not None and assessment is not None and catchment:
        reg_id = reg_name = reg_village = None
        if isinstance(registered, RegisteredPatient):
            reg_id = registered.id
            reg_name = registered.name
            reg_village = registered.village
        log_encounter(
            ctx,
            assessment,
            clinic,
            catchment=catchment,
            action_taken=action,
            registered_patient_id=reg_id,
            registered_name=reg_name,
            registered_village=reg_village,
        )


def _finish_patient(action: str | None = None) -> None:
    _log_action(action or "new_patient")
    reset_to_form()


def render_result() -> None:
    assessment = st.session_state.get("assessment")
    plan = st.session_state.get("treatment_plan")
    if assessment is None or plan is None:
        st.session_state["show_result"] = False
        st.rerun()
        return

    decision = assessment.decision
    st.markdown(CARD_CSS, unsafe_allow_html=True)

    registered = st.session_state.get("registered_patient")
    catchment = st.session_state.get("catchment")
    if isinstance(registered, RegisteredPatient):
        st.caption(
            f"{registered.name} \u00b7 {registered.village} "
            f"(visit #{registered.visit_count})"
        )
    elif catchment:
        st.caption(f"Catchment: {catchment}")

    if decision in {TriageDecision.REFER_IMMEDIATE, TriageDecision.REFER}:
        reason = build_refer_reason(assessment.referral_reasons, assessment.urgency)
        st.markdown(
            _render_card_html("refer", "REFER", reason, plan.detail),
            unsafe_allow_html=True,
        )
        if st.button(
            plan.primary_action_label,
            type="primary",
            use_container_width=True,
            key="refer_call",
        ):
            _log_action("teleconsultation_call")
            st.info(
                f"Dial teleconsultation desk: "
                f"[{teleconsultation_dial_url().replace('tel:', '')}]({teleconsultation_dial_url()})"
            )
        st.button(
            "\u2190 New patient",
            use_container_width=True,
            key="refer_new",
            on_click=_finish_patient,
            kwargs={"action": "refer_new_patient"},
        )
        return

    if decision == TriageDecision.TREAT_AND_MONITOR:
        days = assessment.monitoring_days
        reason = f"Treat now and re-check in {days} days."
        st.markdown(
            _render_card_html("monitor", "TREAT &amp; MONITOR", reason, plan.detail),
            unsafe_allow_html=True,
        )
        if st.button(
            plan.primary_action_label,
            type="primary",
            use_container_width=True,
            key="monitor_schedule",
        ):
            note = schedule_teleconsultation_note(days)
            _log_action(f"schedule_teleconsultation: {note}")
            st.success(note)
        st.button(
            "\u2190 New patient",
            use_container_width=True,
            key="monitor_new",
            on_click=_finish_patient,
            kwargs={"action": "monitor_new_patient"},
        )
        return

    reason = plan.summary
    st.markdown(
        _render_card_html("treat", "TREAT", reason, plan.detail),
        unsafe_allow_html=True,
    )
    if st.button(
        plan.primary_action_label,
        type="primary",
        use_container_width=True,
        key="treat_start",
    ):
        _log_action("start_treatment")
        st.success("Treatment plan acknowledged.")
    st.button(
        "\u2190 New patient",
        use_container_width=True,
        key="treat_new",
        on_click=_finish_patient,
        kwargs={"action": "treat_new_patient"},
    )


def main() -> None:
    st.set_page_config(page_title="FeverGate", page_icon="\U0001fa7a", layout="centered")
    if st.session_state.get("show_result"):
        render_result()
    else:
        render_form()


if __name__ == "__main__":
    main()
