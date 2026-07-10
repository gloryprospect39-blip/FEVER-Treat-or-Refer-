"""Gemini-backed clinical assistant panel for the Streamlit app."""

from __future__ import annotations

import streamlit as st

from ui.gemini_client import (
    GeminiError,
    GeminiNotConfigured,
    generate_reply,
    is_configured,
)
from ui.i18n.mm import mm

_HISTORY_KEY = "fg_chat_history"


def _patient_summary() -> str | None:
    ctx = st.session_state.get("fg_patient_context")
    assessment = st.session_state.get("fg_assessment")
    if ctx is None or assessment is None:
        return None
    reasons = ", ".join(assessment.referral_reasons) or "none"
    return "; ".join(
        [
            f"Age (months): {ctx.age_months}",
            f"Has fever: {ctx.has_fever}",
            f"Decision: {assessment.decision.value}",
            f"Urgency: {assessment.urgency.value}",
            f"Referral reasons: {reasons}",
            f"Sepsis screen score: {assessment.sepsis.score}",
        ]
    )


def render_assistant() -> None:
    with st.expander(mm.assistant.title, expanded=False):
        st.caption(mm.assistant.subtitle)

        if not is_configured():
            st.info(mm.assistant.unavailable)
            return

        history: list[dict[str, str]] = st.session_state.setdefault(_HISTORY_KEY, [])

        st.chat_message("assistant").write(mm.assistant.greeting)
        for message in history:
            role = "user" if message["role"] == "user" else "assistant"
            st.chat_message(role).write(message["text"])

        summary = _patient_summary()
        use_context = False
        if summary:
            use_context = st.checkbox(
                mm.assistant.use_context, value=True, key="fg_chat_use_context"
            )

        with st.form("fg_chat_form", clear_on_submit=True):
            prompt = st.text_area(
                mm.assistant.placeholder,
                key="fg_chat_input",
                label_visibility="collapsed",
                placeholder=mm.assistant.placeholder,
                height=80,
            )
            submitted = st.form_submit_button(mm.assistant.title, type="primary")

        st.caption(mm.assistant.disclaimer)

        if submitted and prompt and prompt.strip():
            history.append({"role": "user", "text": prompt.strip()})
            try:
                with st.spinner(mm.assistant.thinking):
                    reply = generate_reply(
                        history, summary if use_context else None
                    )
                history.append({"role": "model", "text": reply})
            except GeminiNotConfigured:
                st.info(mm.assistant.unavailable)
                history.pop()
            except GeminiError:
                st.error(mm.assistant.error)
                history.pop()
            st.rerun()
