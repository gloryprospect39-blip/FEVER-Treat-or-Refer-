"""Gemini client accessor — patch in tests via ``get_client``."""

from __future__ import annotations

from typing import Any, Protocol


class GenerativeClient(Protocol):
    def generate_content(self, prompt: str) -> Any: ...


def get_client() -> GenerativeClient:
    """Return the live Gemini client. Requires API key in production."""
    raise NotImplementedError(
        "Gemini client not configured — patch get_client() in tests or set API key for pilot."
    )
