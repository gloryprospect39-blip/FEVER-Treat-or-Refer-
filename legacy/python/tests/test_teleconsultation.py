"""Teleconsultation handoff tests."""

import importlib

import ui.teleconsultation as teleconsultation
from ui.teleconsultation import (
    DEFAULT_TELECONSULTATION_NUMBER,
    schedule_teleconsultation_note,
    teleconsultation_dial_url,
    teleconsultation_number,
)


def test_dial_url_uses_default_when_unset(monkeypatch):
    monkeypatch.delenv("FEVERGATE_TELECONSULT_NUMBER", raising=False)
    assert teleconsultation_dial_url() == f"tel:{DEFAULT_TELECONSULTATION_NUMBER}"


def test_env_var_overrides_number(monkeypatch):
    monkeypatch.setenv("FEVERGATE_TELECONSULT_NUMBER", "+95-1-234567")
    assert teleconsultation_number() == "+95-1-234567"
    assert teleconsultation_dial_url() == "tel:+95-1-234567"


def test_schedule_note_includes_days_and_number(monkeypatch):
    monkeypatch.setenv("FEVERGATE_TELECONSULT_NUMBER", "+95-1-234567")
    note = schedule_teleconsultation_note(3)
    assert "3 day" in note
    assert "+95-1-234567" in note


def test_module_reimports_cleanly():
    importlib.reload(teleconsultation)
