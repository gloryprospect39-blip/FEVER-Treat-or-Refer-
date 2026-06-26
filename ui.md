# FeverGate — UX Design Doc

**Designer:** TBD
**Status:** Draft v0.1
**Last updated:** 2026-06-26

---

## 1. The design bet

We are betting the entire product on one screen and one transition. The triage form and the decision card are the same surface, and the magic lives in the *snap* between them: routine, low-stakes tapping that, the instant a danger sign is positive, collapses into a single calm-but-urgent red card with one obvious action. We spend almost all design effort on tap-target size, sunlight legibility, and the timing/feel of that snap — and keep everything else nearly invisible. There is no dashboard, no history, no menu to get lost in.

## 2. The defining interaction

> The worker taps a danger-sign tile — say the lightning bolt for convulsions. The tile fills with a solid state so it's unmistakable it's "on." They tap "Assess patient." The form does not fade or spin; the screen immediately replaces itself with a full-width red card that reads **REFER** in large type, and below it one line: "Convulsions — refer immediately." No animation, no celebration, no sound. The calm is the point: the worker's eyes land on the reason and the single "Refer now" button in under a second. It feels like a decision being *made for you* the moment you give it the fact that matters.

If you can't write this paragraph, you don't have a defining interaction yet.

## 3. Screen inventory

- **Triage form** — tap age band, fever, and danger signs; one button to assess.
- **Result card** — the full-screen REFER / TREAT / TREAT_AND_MONITOR decision with one primary action and a reset.

Two screens, and they are really two states of one surface. There is intentionally no third screen.

## 4. Screen-by-screen specs

### Triage form

**Purpose:** Capture the minimum facts needed for a safe treat-or-refer decision, fast, with one thumb.

**Layout (top to bottom):**
1. Title + one-line caption ("Point-of-care treat / refer — screening only") — sets context and the honest limit.
2. Age band selector (4 options) — single choice, defaults to 2 months–5 years (the most common case).
3. Fever toggle (default on) + fever-duration number input, side by side.
4. "Danger signs" section header.
5. Danger-sign grid — large icon+label tiles in two columns, each an independent on/off toggle.
6. Primary button: "Assess patient", full width, anchored where the thumb rests.

**Key interactions:**
- Tap a tile → it flips to a solid "on" state (not a faint checkmark).
- Tap "Assess patient" → build the patient context, run the engine, switch to the result card.
- Tap age / fever → updates local state only; no decision happens until "Assess patient."

**States:**
- **Default:** All tiles off, age = under-5, fever on. The form is the resting state between patients.
- **Empty / first-time:** Identical to default — there is no data to be missing. The caption is the only onboarding; no tutorial overlay.
- **Loading:** Effectively none. The engine is local and synchronous (sub-millisecond); the result card appears on the same tap with no spinner.
- **Error:** Engine input is fully constrained by the form, so user-facing errors are near-impossible. If the engine raises, show a plain inline message ("Couldn't assess — check inputs and retry") rather than a blank screen.
- **Edge / "too much":** Many tiles on at once is fine and expected (a very sick patient) — the result simply lists every named reason; the grid never scrolls past two thumb-reachable columns.

### Result card

**Purpose:** Deliver one unambiguous decision and one next action, with the clinical reason named.

**Layout (top to bottom):**
1. Full-width color card: red (REFER), amber (TREAT & MONITOR), or green (TREAT).
2. Decision word in large bold type (REFER / TREAT & MONITOR / TREAT).
3. One-line reason: for referrals, the named trigger + urgency ("Convulsions — refer immediately."); for monitor, the re-check window ("Treat now and re-check in 3 days."); for treat, the low-risk note.
4. Primary action button: "Refer now" on a referral (acknowledgment in v1), none required for treat/monitor.
5. Secondary button: "← New patient" — resets to the form.

**Key interactions:**
- Tap "Refer now" → acknowledges the referral (no-op record in v1; hook for logging later).
- Tap "← New patient" → clears all state and returns to the default form.

**States:**
- **Default (REFER):** Red card, named reason, "Refer now" + "New patient". The most safety-critical state — it must be impossible to mistake for anything else.
- **TREAT & MONITOR:** Amber card with the monitoring-days note and "New patient".
- **TREAT:** Green card, low-risk note, "New patient".
- **Loading:** None — already computed.
- **Error:** If somehow no decision is present, fall back to the form rather than render an empty card.
- **Edge / "too much":** Multiple referral reasons are joined into the single reason line, deduped, so the card stays one glance long.

## 5. The user journey

> A worker opens FeverGate to a clean form: age band already on under-5, fever on. A mother's child has been having fits. The worker taps the lightning-bolt convulsions tile — it goes solid red-on — and taps "Assess patient." The screen snaps to a calm full-width red card: **REFER**, "Convulsions — refer immediately." There is no ambiguity and nothing to interpret; the worker reads the reason aloud to the mother, taps "Refer now," and arranges transport.
>
> The next patient is a toddler with a two-day fever and no danger signs. Same form, the worker leaves all tiles off, taps "Assess patient," and gets an amber card: **TREAT & MONITOR**, "Treat now and re-check in 3 days." They give treatment, note the re-check, and tap "← New patient."
>
> By the third patient the worker isn't reading the interface anymore — they're reading the patient and tapping. That's the win: the tool disappears, and the danger-sign decision becomes muscle memory backed by a guarantee that a positive sign always refers.

## 6. Component & visual notes

- **Typography:** Large, high-weight, high-contrast. Decision word oversized; reason line big enough to read at arm's length. System fonts — legibility over personality.
- **Color:** Three decision colors carry nearly all meaning — red = refer, amber = treat-and-monitor, green = treat. Chosen for contrast in direct sunlight, not brand aesthetics. Color is never the *only* signal; the decision word and reason text always accompany it.
- **Motion:** Almost none, on purpose. The form-to-card transition is an immediate replace, not a flourish. Nothing bounces; nothing celebrates a referral.
- **The signature visual:** The danger-sign tile in its "on" state — a large icon + label that fills with a solid, unmistakable state when tapped, so a glance confirms exactly which signs are flagged. The grid of these tiles is the face of the product.
- **Microcopy voice:** Plain, calm, clinical-but-human. "Refer now," not "Initiate referral protocol." "Treat now and re-check in 3 days," not "Schedule follow-up encounter."

## 7. Accessibility & inclusion

- **Low vision / screen reader:** Tiles carry text labels, not icon-only meaning, so screen readers and low-literacy-of-symbols users both get the word. Decision is conveyed by text + color, never color alone.
- **Motor difficulty:** Large, full-width tap targets and a thumb-anchored primary button; no precise gestures, drags, or long-presses anywhere.
- **Low / spotty connectivity:** The decision engine runs locally and synchronously — the core flow needs no network at all. (A true offline-installable PWA is deferred; see below.)
- **Doesn't read English:** v1 ships English labels, but every tile and decision string is a centralized, translatable label — local-language strings are a swap, not a redesign. This is a deliberate v1 limit, not "TBD."

## 8. What we are NOT designing

- **No history / encounter list screen** — one patient, one decision; the log (if any) is a backend concern, not a UI surface in v1.
- **No settings screen** — there is nothing to configure; age/fever/signs live in the flow itself.
- **No onboarding flow** — the form's resting state and one-line caption are the entire teaching.
- **No vitals-entry UI (BP, SpO2, RR)** — v1 triages on danger signs; numeric vitals screens are deferred.
- **No AI-explainer panel** — the named reason line is enough for v1; a plain-language narration is a later layer.

## 9. Open design questions

- [ ] Should lethargic and unconscious be two separate tiles or one tri-state consciousness control?
- [ ] Do we need a "neonate fever" visual treatment distinct from danger-sign referrals, since it refers on fever alone?
- [ ] What is the right "Refer now" acknowledgment — a no-op confirm, or a logged tap that feeds a future encounter record?

## 10. Handoff to engineering

> The whole experience hinges on the form-to-card *snap* feeling instant and unambiguous — because the engine is local, there is no real latency to hide, so engineering's job is to make the state switch atomic (form → correct-color card with the named reason) with no flicker, blank frame, or wrong-color flash on a referral.

Open technical items left on the table: the referral-reason string is assembled from the engine's trigger codes via a shared label map (so UI wording and engine reasons never drift), and "Refer now" needs a defined behavior (no-op vs. logged) before build.
