"""Teleconsultation handoff stubs for the result card."""

from __future__ import annotations

# Placeholder district teleconsultation desk — replace for field pilot.
TELECONSULTATION_NUMBER = "+255800000000"


def teleconsultation_dial_url() -> str:
    return f"tel:{TELECONSULTATION_NUMBER}"


def schedule_teleconsultation_note(monitoring_days: int) -> str:
    return (
        f"Teleconsultation scheduled for re-check in {monitoring_days} day(s). "
        f"Desk number: {TELECONSULTATION_NUMBER}"
    )
