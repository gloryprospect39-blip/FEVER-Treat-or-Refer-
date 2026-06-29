"""Teleconsultation handoff stub tests."""

from ui.teleconsultation import (
    TELECONSULTATION_NUMBER,
    schedule_teleconsultation_note,
    teleconsultation_dial_url,
)


def test_teleconsultation_dial_url():
    assert teleconsultation_dial_url() == f"tel:{TELECONSULTATION_NUMBER}"


def test_schedule_note_includes_days_and_number():
    note = schedule_teleconsultation_note(3)
    assert "3 day" in note
    assert TELECONSULTATION_NUMBER in note
