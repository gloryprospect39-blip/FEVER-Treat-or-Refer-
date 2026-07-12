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

## Install as an app (PWA — mobile & Windows)

FeverGate is a Progressive Web App, so it installs like a native app on phones and Windows — with an app icon, standalone window, and offline support for the triage flow.

Install requires a production build served over HTTPS (or `localhost`):

```bash
npm run build && npm start
```

- **Android (Chrome):** menu → **Add to Home screen / Install app**
- **iOS (Safari):** Share → **Add to Home Screen**
- **Windows (Edge/Chrome):** click the **Install** icon in the address bar (or menu → **Apps → Install this site as an app**)

The service worker (`public/sw.js`) caches the app shell; the manifest lives at `/manifest.webmanifest` (generated from `src/app/manifest.ts`). Registration only runs in production builds.

## Deploy & share (public link)

To share FeverGate with others you need to host it — `localhost` only works on your own machine. Two good options:

### Option A — Vercel (fastest, free, best for a shareable link)

1. Push this repo to GitHub (already done).
2. Go to [vercel.com](https://vercel.com) → **Add New… → Project** → import this repo.
3. **Deploy** → you get a link like `https://fevergate.vercel.app` (attach a custom domain later if you like).

Because it's a PWA served over HTTPS, users can open the link on a phone and **Add to Home Screen** to install it. Sharing a **QR code** of the link is the easiest way to distribute it in the field — people scan and install.

> **Storage note:** Vercel's filesystem is read-only/ephemeral, so the SQLite patient registry and JSONL encounter log **won't persist** there — the app detects this and degrades gracefully (triage works fully; logging is skipped). If you need those records to persist, use Option B or move storage to a hosted database.

### Option B — Persistent host (Render / Railway / Fly.io)

These run a real Node server with a writable disk, so the local SQLite registry and encounter log persist with **no code changes**:

- Build command: `npm run build`
- Start command: `npm start`
- (Optional) point `FEVERGATE_DATA_DIR` at a mounted persistent volume.

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

## Reports & referral form

- **Individual patient report / referral form** — after each assessment, tap **ပို့ဆောင်ရေး ဖောင် / မှတ်တမ်း** to open a clean, printable document with the patient details, clinical findings (fever, vitals, danger signs, comorbidities), the triage decision, referral reasons, treatment plan, and a signature line. Use the browser's print dialog to print or **Save as PDF**.
- **Daily & weekly reports** — the **အစီရင်ခံစာများ** link (`/reports`) aggregates logged encounters into a today (daily) and rolling 7-day (weekly) summary — totals, referrals, decision breakdown, and child vs. adult counts — plus a recent-patients table. Also printable / exportable to PDF.

Reports read from the encounter log (`data/encounters.jsonl`). Optional patient name, village, and health-worker fields on the triage form flow into both the referral form and the reports.

## API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/patients` | GET | List villages + recent patients |
| `/api/patients/resolve` | POST | Register or record revisit |
| `/api/encounters` | POST | Append encounter log row |

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
