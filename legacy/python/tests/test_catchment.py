"""Tests for village / catchment validation."""

import pytest

from ui.catchment import normalize_catchment, require_catchment


def test_normalize_catchment_strips_whitespace():
    assert normalize_catchment("  Border   Camp A  ") == "Border Camp A"


def test_require_catchment_rejects_empty():
    with pytest.raises(ValueError, match="required"):
        require_catchment("")
    with pytest.raises(ValueError, match="required"):
        require_catchment("   ")


def test_require_catchment_returns_normalized():
    assert require_catchment("  Hill Village ") == "Hill Village"
