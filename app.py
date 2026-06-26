"""Point-of-care febrile triage UI (Streamlit).

Run with: ``streamlit run app.py``
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "src"))

import streamlit as st

from decision_engine import evaluate_febrile_patient
from decision_engine.models import (
    DANGER_SIGN_LABELS,
    ConsciousnessLevel,
    DangerSigns,
    PatientContext,
    ReferralUrgency,
    TriageDecision,
    VitalSigns,
)
from ui.danger_sign_labels import DANGER_SIGN_TILES

AGE_BANDS = {
    "Under 2 months": 1,
    "2 months \u2013 5 years": 24,
    "5\u201315 years": 96,
    "Adult": 480,
}

EXTRA_REASON_LABELS = {
    "neonate_fever": DANGER_SIGN_LABELS["neonate_fever"],
    "hypoxia": "Low oxygen saturation",
    "hypotension_adult": "Low blood pressure",
    "hypotension_pediatric": "Low blood pressure",
    "weak_or_absent_radial_pulse": "Weak or absent pulse",
    "qsofa>=2": "Elevated qSOFA",
    "composite_sepsis_score>=3": "Elevated sepsis screen",
}

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
    margin: 0;
    line-height: 1.4;
}
.triage-card.refer { background: #c0392b; }
.triage-card.monitor { background: #d68910; }
.triage-card.treat { background: #1e8449; }
</style>
"""


def _urgency_phrase(urgency: ReferralUrgency) -> str:
    if urgency == ReferralUrgency.IMMEDIATE:
        return "refer immediately"
    if urgency == ReferralUrgency.SAME_DAY:
        return "refer (same day)"
    return "refer"


def build_refer_reason(referral_reasons: list[str], urgency: ReferralUrgency) -> str:
    named: list[str] = []
    for code in referral_reasons:
        label = DANGER_SIGN_LABELS.get(code) or EXTRA_REASON_LABELS.get(code)
        if label is None and code.startswith("news2>="):
            label = "Elevated NEWS2"
        if label and label not in named:
            named.append(label)

    subject = ", ".join(named) if named else "Elevated severe-illness screen"
    return f"{subject} \u2014 {_urgency_phrase(urgency)}."


def reset_to_form() -> None:
    st.session_state.clear()


def render_form() -> None:
    st.title("\U0001fa7a Febrile triage")
    st.caption("Point-of-care treat / refer decision support \u2014 screening only.")

    band = st.radio("Age band", list(AGE_BANDS.keys()), index=1)

    fever_col, dur_col = st.columns(2)
    with fever_col:
        has_fever = st.toggle("Fever", value=True)
    with dur_col:
        fever_days = st.number_input(
            "Fever duration (days)", min_value=0, max_value=60, value=1, step=1
        )

    st.subheader("Danger signs")
    selected: dict[str, bool] = {}
    columns = st.columns(2)
    for index, tile in enumerate(DANGER_SIGN_TILES):
        with columns[index % 2]:
            selected[tile.trigger_code] = st.toggle(
                f"{tile.icon} {tile.label}", key=f"tile_{tile.trigger_code}"
            )

    if st.button("Assess patient", type="primary", use_container_width=True):
        danger_kwargs: dict[str, bool] = {}
        consciousness = ConsciousnessLevel.ALERT
        for tile in DANGER_SIGN_TILES:
            if not selected.get(tile.trigger_code):
                continue
            if tile.danger_field:
                danger_kwargs[tile.danger_field] = True
            if tile.consciousness == ConsciousnessLevel.UNCONSCIOUS:
                consciousness = ConsciousnessLevel.UNCONSCIOUS
            elif (
                tile.consciousness == ConsciousnessLevel.LETHARGIC
                and consciousness != ConsciousnessLevel.UNCONSCIOUS
            ):
                consciousness = ConsciousnessLevel.LETHARGIC

        ctx = PatientContext(
            age_months=AGE_BANDS[band],
            has_fever=has_fever,
            fever_duration_days=int(fever_days),
            consciousness=consciousness,
            danger_signs=DangerSigns(**danger_kwargs),
            vitals=VitalSigns(),
        )
        st.session_state["assessment"] = evaluate_febrile_patient(ctx)
        st.session_state["show_result"] = True
        st.rerun()


def render_result() -> None:
    assessment = st.session_state["assessment"]
    decision = assessment.decision
    st.markdown(CARD_CSS, unsafe_allow_html=True)

    if decision in {TriageDecision.REFER_IMMEDIATE, TriageDecision.REFER}:
        reason = build_refer_reason(assessment.referral_reasons, assessment.urgency)
        st.markdown(
            f'<div class="triage-card refer">'
            f'<p class="decision">REFER</p>'
            f'<p class="reason">{reason}</p>'
            f"</div>",
            unsafe_allow_html=True,
        )
        st.button("Refer now", type="primary", use_container_width=True)
        st.button("\u2190 New patient", use_container_width=True, on_click=reset_to_form)
        return

    if decision == TriageDecision.TREAT_AND_MONITOR:
        days = assessment.monitoring_days
        st.markdown(
            f'<div class="triage-card monitor">'
            f'<p class="decision">TREAT &amp; MONITOR</p>'
            f'<p class="reason">Treat now and re-check in {days} days.</p>'
            f"</div>",
            unsafe_allow_html=True,
        )
        st.button("\u2190 New patient", use_container_width=True, on_click=reset_to_form)
        return

    st.markdown(
        '<div class="triage-card treat">'
        '<p class="decision">TREAT</p>'
        '<p class="reason">No fever and low-risk screen.</p>'
        "</div>",
        unsafe_allow_html=True,
    )
    st.button("\u2190 New patient", use_container_width=True, on_click=reset_to_form)


def main() -> None:
    st.set_page_config(page_title="Febrile triage", page_icon="\U0001fa7a", layout="centered")
    if st.session_state.get("show_result"):
        render_result()
    else:
        render_form()


if __name__ == "__main__":
    main()
