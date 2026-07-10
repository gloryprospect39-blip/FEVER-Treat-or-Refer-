"""Teleconsultation handoff for the result card.

The desk number is configurable so each clinic can point at its own referral
line without code changes:

- Environment variable ``FEVERGATE_TELECONSULT_NUMBER``, or
- Streamlit secret ``teleconsult_number`` (``.streamlit/secrets.toml``).

Falls back to a clearly-fake placeholder when unset.
"""

from __future__ import annotations

import os

# Placeholder — replace via env var or Streamlit secret for a field pilot.
DEFAULT_TELECONSULTATION_NUMBER = "+95-000-000-000"


def _resolve_number() -> str:
    env_value = os.environ.get("FEVERGATE_TELECONSULT_NUMBER")
    if env_value and env_value.strip():
        return env_value.strip()

    try:  # Streamlit is optional at import time (keeps engine pure/testable).
        import streamlit as st

        secret = st.secrets.get("teleconsult_number")  # type: ignore[union-attr]
        if secret and str(secret).strip():
            return str(secret).strip()
    except Exception:  # pragma: no cover - secrets file/streamlit may be absent
        pass

    return DEFAULT_TELECONSULTATION_NUMBER


def teleconsultation_number() -> str:
    return _resolve_number()


def teleconsultation_dial_url() -> str:
    return f"tel:{_resolve_number()}"


def schedule_teleconsultation_note(monitoring_days: int) -> str:
    return (
        f"Teleconsultation scheduled for re-check in {monitoring_days} day(s). "
        f"Desk number: {_resolve_number()}"
    )
