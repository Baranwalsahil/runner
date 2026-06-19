# Task 17 — Growth page: weight-goal projection from run trend

**Layer:** FE + BE · **Effort:** L · **Prereqs:** tasks 09 (auth/users), 10 (runs API), 15 (run history), users `PATCH /users/me` profile flow

## Goal

A new **Growth** page where the user enters their **current weight** and a
**goal weight**, and the app — using the trend of their recorded runs —
projects:

1. **Days to reach the goal** if they run every day at the same average
   distance as their history.
2. **Daily calories burned** from running (personalised via age / sex /
   height / weight).
3. **Computed speed-up scenarios** — concrete "do X → reach goal Y days
   sooner" suggestions derived from the user's own numbers.

## Decisions (locked)

| Question | Choice |
|----------|--------|
| Distance basis for "run every day" | **Average distance of past runs** (mean `distance_meters` over user's run history) |
| Calorie model | **Full** — uses age, sex, height, weight (BMR + pace-based MET) |
| Where weight/goal/profile stored | **New `users` columns** (migration) |
| Speed-up suggestions | **Computed scenarios** from the user's data, not static tips |
| Direction | **Loss only** — if goal ≥ current, show a guard message |
| Units | **Metric** (kg / cm / km); matches existing `distance_meters` |
| Profile completeness | Add all fields; **page works with sensible defaults** when blank, but prompts the user to fill them for accuracy |
| Deficit model | Running burn = **pure calorie deficit** (diet held constant); 7700 kcal ≈ 1 kg fat |

## The math (single source of truth → `client/src/lib/growthModel.js`)

All projection math lives in **one pure, unit-tested frontend module**. The
backend only persists profile fields and returns them; it does **no**
projection. Inputs: the user profile + the list from `runs.list()`.

```
// Constants
KCAL_PER_KG_FAT = 7700

// 1. Run trend (from runs.list() — RunSummary[])
avgDistanceKm   = mean(distance_meters / 1000) over runs with distance_meters > 0
avgDurationH    = mean((ended_at - started_at) in hours) over same runs
avgPaceKmh      = avgDistanceKm / avgDurationH        // guard /0

// 2. BMR — Mifflin-St Jeor (needs sex, weight_kg, height_cm, age)
//    male:   10*kg + 6.25*cm - 5*age + 5
//    female: 10*kg + 6.25*cm - 5*age - 161
//    other/unknown: average of the two
// (BMR shown as context: maintenance calories. NOT part of the running deficit.)

// 3. Calories burned per daily run (active, from running) — MET method
//    MET from pace (running METs, ACSM-ish table):
//      <8 km/h → 8.3 ; 8-9.6 → 9.8 ; 9.6-11.3 → 11.0 ; 11.3-12.9 → 11.8 ; >12.9 → 12.8
//    dailyBurnKcal = MET * weight_kg * avgDurationH
//    (weight_kg ties age/sex/height-derived profile to a personalised burn)

// 4. Projection (loss only)
weightToLoseKg  = currentWeightKg - goalWeightKg          // must be > 0
totalKcal       = weightToLoseKg * KCAL_PER_KG_FAT
daysToGoal      = ceil(totalKcal / dailyBurnKcal)         // guard dailyBurn>0

// 5. Speed-up scenarios (computed, each recomputes daysToGoal)
//   a) "+1 km/day"  → recompute burn at avgDuration scaled to new distance → Δdays
//   b) "+1 run-day intensity / faster pace bucket" → next MET tier → Δdays
//   c) "300 kcal/day diet deficit on top of running" → dailyBurn+300 → Δdays
//   Each scenario returns { label, newDays, daysSaved }.
```

Edge cases the module must handle: no runs / zero avg distance / zero
duration → return `null` projection with a reason code; goal ≥ current →
`reason: "goal_not_below_current"`; missing profile field → use default and
flag `usingDefaults: true`.

## Files touched

### Backend (`server/`)
- `migrations/006_user_growth_profile.sql` — **new**, idempotent:
  ```sql
  ALTER TABLE users ADD COLUMN IF NOT EXISTS weight_kg       DECIMAL(5,2);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS goal_weight_kg  DECIMAL(5,2);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS height_cm       DECIMAL(5,2);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS age             INTEGER;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS sex             VARCHAR(10);  -- 'male'|'female'|'other'
  ```
- `app/db/schema.sql` — add the same columns to the `users` definition (keep in sync).
- `app/schemas/auth.py`
  - `User` gains `weight_kg`, `goal_weight_kg`, `height_cm`, `age`, `sex` (all `| None = None`).
  - `UserUpdate` gains the same optional fields with validators
    (weight/height/goal > 0 and within sane bounds; `age` 1–120;
    `sex` in {`male`,`female`,`other`}).
- `app/services/user_service.py`
  - `_SELECT_COLUMNS` + `_row_to_user`: include the 5 new columns (cast
    `float()` for the DECIMALs when not None).
  - `update_user`: accept + conditionally set the 5 new fields (same
    dynamic-field pattern already used for `first_name`/`last_name`).
- `app/routers/users.py` — pass the new fields from `body` into
  `user_service.update_user(...)`.

### Frontend (`client/`)
- `src/lib/growthModel.js` — **new**. Pure functions implementing the math
  above: `runTrend(runs)`, `bmr(profile)`, `dailyBurnKcal(profile, trend)`,
  `project(profile, trend)`, `scenarios(profile, trend)`. No React, no I/O.
- `src/routes/Growth.jsx` — **new** route. Two sections:
  1. **Profile form** (weight, goal weight, height, age, sex) — reuses the
     `PATCH /users/me` flow via `useAuth().updateProfile`; prefills from
     `user`. Mirrors `Profile.jsx` styling (HUD panel).
  2. **Projection panel** — pulls `runs.list()`, runs `growthModel`, renders:
     days-to-goal (hero number), daily calorie burn, BMR/maintenance context,
     and the computed speed-up scenario cards. Guard/empty states for
     no-runs, goal-not-below-current, and using-defaults.
- `src/App.jsx` — add a protected `/growth` route (mirror `/profile`).
- `src/components/TopNavBar.jsx` — add `{ to: "/growth", label: "GROWTH" }`
  to `NAV_LINKS`.
- `src/lib/api.js` — no change expected (`runs.list()` + `auth`/`users`
  adapters already pass full objects); verify profile PATCH carries the new
  fields.

## Acceptance criteria

- [ ] `PATCH /users/me` accepts `weight_kg`, `goal_weight_kg`, `height_cm`,
      `age`, `sex`; `GET /auth/me` returns them; invalid values 422.
- [ ] Migration `006` is idempotent (re-run is a no-op / prints skip).
- [ ] `/growth` route is reachable (protected) and linked in the top nav.
- [ ] With profile filled + ≥1 run, the page shows a finite **days-to-goal**,
      a **daily calorie burn**, and ≥2 **computed speed-up scenarios** each
      with a `daysSaved` value.
- [ ] Goal ≥ current weight → friendly guard message, no projection.
- [ ] No runs (or zero avg distance) → empty state explaining a run is needed.
- [ ] Blank profile → page still renders using defaults, flagged to the user.
- [ ] New vitest suite covers `growthModel`: trend mean, BMR per sex,
      MET tiers, days-to-goal, each scenario's `daysSaved`, and every edge
      case (no runs, goal≥current, defaults). Existing pytest + vitest stay green.
- [ ] Chrome verify: log in as demo, open `/growth`, fill profile, confirm
      projection + scenarios render against seeded runs.

## Out of scope

- Imperial units / unit toggle.
- Weight-gain (bulking) projections.
- Logging a weight history / weight-over-time chart (single current + goal only).
- External elevation/diet/nutrition APIs; calorie intake tracking.
- Storing computed projections server-side (all derived client-side, live).
- Metabolic-adaptation / TDEE-activity-multiplier modelling (flat 7700 kcal/kg).
