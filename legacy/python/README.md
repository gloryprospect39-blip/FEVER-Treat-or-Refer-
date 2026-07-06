# FeverGate — Streamlit (Myanmar)

Point-of-care febrile triage UI in Myanmar (Burmese). No epidemiologic catchment fields.

## Run locally

```bash
cd legacy/python
uv run streamlit run app.py
```

Open [http://localhost:8501](http://localhost:8501).

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
