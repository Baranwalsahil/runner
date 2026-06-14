# Task 14 — Run session: Pause/Resume + Finish + refresh-safe persistence

**Layer:** FE · **Effort:** M · **Prereqs:** task-10 (runs API), existing `RunTracker.jsx`

## Goal

Replace the single combined **"Stop & Submit"** action with an explicit
**Pause / Resume** + **Finish** session model, and make an in-progress run
survive a page refresh (e.g. browser reload after a network blip) so the
runner resumes the *same* session instead of starting over.

## Behaviour spec

Session states: `idle → recording ⇄ paused → finished`.

| State | Buttons shown | GPS watch | Timer |
|-------|---------------|-----------|-------|
| idle | **Start** | off | 00:00 |
| recording | **Pause**, **Finish** | on | counting up |
| paused | **Resume**, **Finish** | off | frozen |
| finished | result + **New Run** | off | final |

- **Start** — begin a fresh session (clears any prior session).
- **Pause** — stop GPS watch, freeze elapsed time and all stats at that
  instant. No points captured while paused.
- **Resume** — restart GPS watch, continue elapsed time from where it froze.
- **Finish** — stop GPS, submit the accumulated trace via `POST /runs`
  (the *only* submit path), show result. Run is NOT submitted until Finish.

## Elapsed-time model (pause-aware)

Raw `now - startedAt` is wrong once pause exists. Track:
- `accumulatedMs` — active time banked from completed recording segments.
- `segmentStartedAt` — wall-clock ms when the current recording segment began
  (`null` when paused/idle).
- Live elapsed while recording = `accumulatedMs + (now - segmentStartedAt)`.
- On Pause: `accumulatedMs += now - segmentStartedAt`, `segmentStartedAt = null`.
- On Resume: `segmentStartedAt = now`.

## Refresh resilience

Persist the active session to `localStorage` under a single key
(`territory_run.active_session`) on every meaningful change:
`{ status, startedAt, accumulatedMs, segmentStartedAt, points }`.

- On mount, hydrate from localStorage if a non-finished session exists.
- If restored state is `recording`, elapsed time keeps counting across the
  dead-page interval (wall-clock continues from `segmentStartedAt`); GPS
  points captured during the dead interval are unavoidably lost but the trace
  continues appending after rehydrate.
- Clear the key on Finish-success and on Start (fresh session).

## Files touched

- `client/src/components/run/RunTracker.jsx` — state model, buttons, handlers, persistence.
- `client/src/hooks/useGeolocation.js` — allow hydrating initial points (seed trace on restore).
- `client/src/lib/runSession.js` *(new)* — localStorage load/save/clear helpers + elapsed calc (pure, unit-testable).
- `client/src/components/run/__tests__/RunTracker.test.jsx` or `lib/__tests__/runSession.test.js` — tests.

## Acceptance criteria

- [ ] Starting a run shows **Pause** + **Finish** (no "Stop & Submit").
- [ ] Pause freezes timer/distance/points; Resume continues without reset.
- [ ] Run is submitted only on Finish; Pause never submits.
- [ ] Reload mid-run restores the same session (points + elapsed), not a new one.
- [ ] Reload while paused restores paused state with frozen elapsed.
- [ ] Finish clears persisted session; reload after finish shows idle.
- [ ] `runSession` helpers covered by unit tests; `npm test` green.

## Out of scope

- Backend changes (runs API unchanged).
- Background GPS while tab/app closed (browser cannot capture points on a dead page).
- Multi-run resume / draft list.
