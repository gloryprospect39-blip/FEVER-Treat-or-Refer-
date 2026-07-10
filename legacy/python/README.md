# FeverGate — Streamlit (Myanmar)

Point-of-care febrile triage UI in Myanmar (Burmese). No epidemiologic catchment fields.

## Run locally

```bash
cd legacy/python
uv run streamlit run app.py
```

Open [http://localhost:8501](http://localhost:8501).

## AI assistant (Google AI Studio / Gemini)

An optional in-app assistant answers clinical questions (danger signs, IMCI,
supportive care, when to refer) with guardrails — it never overrides the triage
decision and reinforces referral when danger signs are present.

Enable it with a [Google AI Studio](https://aistudio.google.com/app/apikey) key:

```bash
cp .streamlit/secrets.toml.example .streamlit/secrets.toml
# then set gemini_api_key = "..." in that file
```

Alternatively set the `GEMINI_API_KEY` environment variable. On Streamlit
Community Cloud, paste the key into the app's **Secrets** settings. Without a
key the app still works — the assistant simply reports it is not configured.

## Deploy (free — Streamlit Community Cloud)

1. Push this branch to GitHub.
2. Open [share.streamlit.io](https://share.streamlit.io/) and sign in with GitHub.
3. **Create app** → pick repo `FEVER-Treat-or-Refer-`.
4. Set **Branch** to `MM-version-without-epi-data` (or your target branch).
5. Set **Main file path** to `legacy/python/app.py`.
6. Click **Deploy**.

Cloud settings:

| Field | Value |
|-------|--------|
| Main file | `legacy/python/app.py` |
| Dependencies | `legacy/python/requirements.txt` (auto-detected) |
| Config | `.streamlit/config.toml` at repo root (auto-detected) |

**Note:** Encounter logs on Cloud are ephemeral (reset when the app sleeps). Fine for demos; not for production patient data without external storage.
