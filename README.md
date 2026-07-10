# FeverGate — Border clinic febrile triage

Non-laboratory **treat / refer** decision support for febrile patients of **all ages**, with a sepsis screening layer based on age, vitals, danger signs, and comorbidities.

## Stack

- **Next.js 16** + **React 19** + **Tailwind CSS 4**
- **Lucide** icons
- Deterministic TypeScript decision engine (ported from Python)
- Local persistence: SQLite patient registry + JSONL encounter log (`data/`)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm start       # production server
```

## Clinical basis (screening only)

- **Under 5:** WHO IMCI danger signs
- **Neonates (<2 months):** any fever → immediate referral
- **Adolescents / adults:** qSOFA and NEWS2 (when vitals available)
- **All ages:** composite border-clinic score + comorbidity modifiers

This tool **does not diagnose sepsis**; it flags likely severe illness for referral.

## Project layout

```
src/
  app/              Next.js pages + API routes
  components/       Triage UI (form + result cards)
  lib/
    decision-engine/  Triage rules (TypeScript)
    fevergate/        Form adapters, treatment plans
    db/               SQLite registry + JSONL encounters
legacy/python/      Original Streamlit app + pytest suite
data/               Runtime DB + logs (gitignored)
```

## AI assistant (Google AI Studio / Gemini)

An optional in-app chat assistant answers clinical questions (danger signs, IMCI, supportive care, when to refer) with strong guardrails — it never overrides the triage decision and always reinforces referral when danger signs are present.

Enable it by adding a [Google AI Studio](https://aistudio.google.com/app/apikey) key:

```bash
cp .env.example .env.local
# then set GEMINI_API_KEY=... in .env.local
```

The key is used **server-side only** (`/api/assistant`) and is never exposed to the browser. Without a key, the app still works — the assistant simply reports it is not configured.

## API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/patients` | GET | List villages + recent patients |
| `/api/patients/resolve` | POST | Register or record revisit |
| `/api/encounters` | POST | Append encounter log row |
| `/api/assistant` | POST | Gemini-backed clinical Q&A (needs `GEMINI_API_KEY`) |

## Output decisions

- `REFER_IMMEDIATE` — danger sign or critical vitals
- `REFER` — elevated sepsis screen (qSOFA, NEWS2, composite, comorbidity)
- `TREAT_AND_MONITOR` — low-risk; schedule 3-day check-ins
- `TREAT` — no fever and low risk

## Legacy Python app

The original Streamlit implementation lives in `legacy/python/`:

```bash
cd legacy/python
uv sync
uv run streamlit run app.py
uv run pytest tests/ -v
```
