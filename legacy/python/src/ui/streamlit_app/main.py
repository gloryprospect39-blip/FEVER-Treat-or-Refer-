"""FeverGate Streamlit application entry."""

from __future__ import annotations

import streamlit as st

from ui.encounter_log import count_encounters
from ui.i18n.mm import mm
from ui.streamlit_app.form import render_form
from ui.streamlit_app.result import render_result
from ui.streamlit_app.styles import GLOBAL_CSS


def run() -> None:
    st.set_page_config(
        page_title=mm.app.title,
        page_icon="\U0001fa7a",
        layout="centered",
        initial_sidebar_state="expanded",
    )
    st.markdown(GLOBAL_CSS, unsafe_allow_html=True)

    with st.sidebar:
        st.markdown(f"### {mm.app.title}")
        st.caption(mm.app.tagline)
        st.divider()
        st.metric(mm.encounters_logged, count_encounters())

    if st.session_state.get("fg_show_result"):
        render_result()
    else:
        render_form()
