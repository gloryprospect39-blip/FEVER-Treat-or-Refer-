"""Shared pytest configuration — src/ is on PYTHONPATH via pyproject.toml."""

from __future__ import annotations

from typing import Any
from unittest.mock import MagicMock

import pytest


@pytest.fixture
def gemini_stub() -> MagicMock:
    """Deterministic Gemini stub for future explainer tests (not used in v1 decision path).

    engineering.md §10: no LLM in the decision path today. When an explainer layer
    is added, patch ``explainer.gemini_client.get_client`` with this fixture.
    """
    stub = MagicMock()
    stub.generate_content.return_value = MagicMock(
        text="This patient has fever with no danger signs. Treat and re-check in 3 days."
    )
    return stub
