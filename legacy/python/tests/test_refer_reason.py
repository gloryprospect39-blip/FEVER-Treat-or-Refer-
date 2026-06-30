"""Unit tests for build_refer_reason (engineering.md §10)."""

from decision_engine.models import ReferralUrgency
from ui.refer_reason import build_refer_reason, urgency_phrase


def test_convulsions_immediate_reason():
    result = build_refer_reason(["imci:convulsions"], ReferralUrgency.IMMEDIATE)
    assert result == "Convulsions \u2014 refer immediately."


def test_same_day_phrasing():
    result = build_refer_reason(["imci:stiff_neck"], ReferralUrgency.SAME_DAY)
    assert result == "Stiff neck \u2014 refer (same day)."


def test_multiple_codes_dedupe_labels():
    result = build_refer_reason(
        ["imci:convulsions", "imci:convulsions", "convulsions"],
        ReferralUrgency.IMMEDIATE,
    )
    assert result == "Convulsions \u2014 refer immediately."


def test_unknown_codes_fallback():
    result = build_refer_reason(["unknown_code"], ReferralUrgency.IMMEDIATE)
    assert result == "Elevated severe-illness screen \u2014 refer immediately."


def test_news2_prefix_label():
    result = build_refer_reason(["news2>=7"], ReferralUrgency.SAME_DAY)
    assert "Elevated NEWS2" in result
    assert "refer (same day)" in result


def test_urgency_phrase_routine():
    assert urgency_phrase(ReferralUrgency.ROUTINE) == "refer"
