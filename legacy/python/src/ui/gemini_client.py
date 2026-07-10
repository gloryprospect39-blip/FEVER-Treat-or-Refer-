"""Google AI Studio (Gemini) client for the FeverGate assistant.

Uses the REST ``generateContent`` endpoint via the Python standard library so
no extra runtime dependency is required. The API key is resolved from, in
order:

1. environment variable ``GEMINI_API_KEY``
2. Streamlit secret ``gemini_api_key`` (``.streamlit/secrets.toml``)

The model can be overridden with ``GEMINI_MODEL`` (default ``gemini-2.5-flash``).
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

DEFAULT_MODEL = "gemini-2.5-flash"
_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

SYSTEM_INSTRUCTION = (
    'You are "FeverGate Assistant", a decision-support aid for frontline health '
    "workers in resource-limited border clinics in Myanmar. You support "
    "febrile-patient triage.\n\n"
    "STRICT RULES:\n"
    "- You are a triage AID, not a doctor. Never give a definitive diagnosis.\n"
    "- Never override the app's triage decision (REFER / TREAT & MONITOR / TREAT). "
    "If danger signs are present or the app says REFER, always reinforce urgent "
    "referral / teleconsultation.\n"
    "- When in doubt, advise referral and teleconsultation. Patient safety first.\n"
    "- Base guidance on WHO / IMCI and national Myanmar protocols. Do not invent "
    "specific drug doses; defer exact dosing to protocols and teleconsultation.\n"
    "- Keep answers short, concrete, and practical for a busy clinic.\n"
    "- Reply in the SAME language the health worker used. Default to Burmese "
    "(Myanmar) if unclear. Use clear, simple wording.\n"
    "- Do not collect or ask for patient-identifying information.\n"
    "- Remind the worker to use clinical judgement and escalate if the patient "
    "worsens.\n\n"
    "You may explain danger signs, IMCI concepts, general supportive care, when "
    "to refer, and how to interpret the triage result. Politely refuse "
    "non-medical or out-of-scope requests."
)


class GeminiNotConfigured(RuntimeError):
    """Raised when no API key is available."""


class GeminiError(RuntimeError):
    """Raised when the Gemini request fails."""


def _resolve_key() -> str | None:
    env_key = os.environ.get("GEMINI_API_KEY")
    if env_key and env_key.strip():
        return env_key.strip()
    try:
        import streamlit as st

        secret = st.secrets.get("gemini_api_key")  # type: ignore[union-attr]
        if secret and str(secret).strip():
            return str(secret).strip()
    except Exception:  # pragma: no cover - secrets/streamlit may be absent
        pass
    return None


def _resolve_model() -> str:
    env_model = os.environ.get("GEMINI_MODEL")
    if env_model and env_model.strip():
        return env_model.strip()
    try:
        import streamlit as st

        secret = st.secrets.get("gemini_model")  # type: ignore[union-attr]
        if secret and str(secret).strip():
            return str(secret).strip()
    except Exception:  # pragma: no cover
        pass
    return DEFAULT_MODEL


def is_configured() -> bool:
    return _resolve_key() is not None


def _build_contents(
    history: list[dict[str, str]], patient_summary: str | None
) -> list[dict]:
    contents = [
        {"role": msg["role"], "parts": [{"text": msg["text"]}]} for msg in history
    ]
    if patient_summary and contents:
        last = contents[-1]
        original = last["parts"][0]["text"]
        last["parts"][0]["text"] = (
            "Current triage context (for grounding, do not repeat verbatim):\n"
            f"{patient_summary}\n\nHealth worker question:\n{original}"
        )
    return contents


def generate_reply(
    history: list[dict[str, str]], patient_summary: str | None = None
) -> str:
    """Send the conversation to Gemini and return the model's reply text.

    ``history`` is a list of ``{"role": "user"|"model", "text": str}``.
    """
    key = _resolve_key()
    if key is None:
        raise GeminiNotConfigured

    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
        "contents": _build_contents(history, patient_summary),
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 800},
    }
    request = urllib.request.Request(
        _ENDPOINT.format(model=_resolve_model()),
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-goog-api-key": key},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:  # pragma: no cover - network dependent
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise GeminiError(f"HTTP {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:  # pragma: no cover - network dependent
        raise GeminiError(str(exc.reason)) from exc

    candidates = data.get("candidates") or []
    if not candidates:
        raise GeminiError("No response candidates returned.")
    parts = candidates[0].get("content", {}).get("parts", [])
    reply = "".join(part.get("text", "") for part in parts).strip()
    if not reply:
        raise GeminiError("Empty reply from model.")
    return reply
