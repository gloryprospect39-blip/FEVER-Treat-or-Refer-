"""Weekly epidemiologic report — aggregate local encounter logs."""

import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import streamlit as st

from ui.encounter_log import DEFAULT_LOG_PATH, count_encounters
from ui.weekly_report import build_weekly_report, default_report_range

st.set_page_config(page_title="Weekly report", page_icon="\U0001f4ca", layout="wide")

st.title("Weekly epidemiologic report")
st.caption(
    "Screening counts from local encounter logs — not confirmed diagnoses. "
    "Aggregate before sharing externally."
)

default_start, default_end = default_report_range()

with st.form("report_range"):
    col1, col2, col3 = st.columns(3)
    with col1:
        week_start = st.date_input(
            "Week start",
            value=default_start,
            min_value=date(2020, 1, 1),
        )
    with col2:
        week_end = st.date_input(
            "Week end",
            value=default_end,
            min_value=date(2020, 1, 1),
        )
    with col3:
        clinic_name = st.text_input("Clinic name", value="Border clinic")
    prepared_by = st.text_input(
        "Prepared by",
        value="Community health worker team",
    )
    submitted = st.form_submit_button("Generate report", type="primary")

if week_end < week_start:
    st.error("Week end must be on or after week start.")
    st.stop()

if submitted:
    report = build_weekly_report(
        week_start=week_start,
        week_end=week_end,
        clinic_name=clinic_name,
        prepared_by=prepared_by,
    )
    st.session_state["weekly_report"] = report

if report := st.session_state.get("weekly_report"):
    st.download_button(
        "Download Markdown",
        data=report,
        file_name=(
            f"fevergate-week-{week_start.isocalendar()[1]}-"
            f"{week_start.year}.md"
        ),
        mime="text/markdown",
    )
    st.markdown(report)

st.divider()
st.caption(
    f"Data source: `{DEFAULT_LOG_PATH}` · "
    f"{count_encounters()} encounter(s) on device"
)
