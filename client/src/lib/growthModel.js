// Growth-page projection math (task-17). Pure, no React, no I/O — unit-tested.
//
// Model: running burns calories; with diet held constant that burn is a pure
// calorie deficit. ~7700 kcal ≈ 1 kg of body fat. Given the user's average run
// (distance + duration → pace → MET) and body profile, project how many days
// of running the same average every day it takes to reach a goal weight.

export const KCAL_PER_KG_FAT = 7700;

// Used when a profile field is blank so the page still renders something.
export const DEFAULT_PROFILE = {
  weight_kg: 70,
  goal_weight_kg: 65,
  height_cm: 170,
  age: 30,
  sex: "male",
};

const PROFILE_KEYS = ["weight_kg", "goal_weight_kg", "height_cm", "age", "sex"];

/**
 * Merge a user record onto DEFAULT_PROFILE, flagging when any field fell back
 * to a default. Returns { profile, usingDefaults }.
 */
export function resolveProfile(user) {
  const profile = { ...DEFAULT_PROFILE };
  let usingDefaults = false;
  for (const key of PROFILE_KEYS) {
    const v = user?.[key];
    if (v === null || v === undefined || v === "") {
      usingDefaults = true;
    } else {
      profile[key] = key === "sex" ? v : Number(v);
    }
  }
  return { profile, usingDefaults };
}

/**
 * Average distance / duration / pace over a user's runs.
 * runs: RunSummary[] — { distance_meters, started_at, ended_at }.
 */
export function runTrend(runs) {
  const valid = (runs || []).filter(
    (r) => r && Number(r.distance_meters) > 0 && r.started_at && r.ended_at
  );
  if (valid.length === 0) {
    return { runCount: 0, avgDistanceKm: 0, avgDurationH: 0, avgPaceKmh: 0 };
  }
  let distKm = 0;
  let durH = 0;
  for (const r of valid) {
    distKm += Number(r.distance_meters) / 1000;
    const h = (new Date(r.ended_at) - new Date(r.started_at)) / 3_600_000;
    durH += h > 0 ? h : 0;
  }
  const avgDistanceKm = distKm / valid.length;
  const avgDurationH = durH / valid.length;
  const avgPaceKmh = avgDurationH > 0 ? avgDistanceKm / avgDurationH : 0;
  return { runCount: valid.length, avgDistanceKm, avgDurationH, avgPaceKmh };
}

/** Running MET from pace (km/h) — ACSM-style buckets. */
export function runningMet(paceKmh) {
  if (paceKmh <= 0) return 0;
  if (paceKmh < 8) return 8.3;
  if (paceKmh < 9.6) return 9.8;
  if (paceKmh < 11.3) return 11.0;
  if (paceKmh < 12.9) return 11.8;
  return 12.8;
}

/** Basal metabolic rate (kcal/day) — Mifflin-St Jeor. Shown as context. */
export function bmr({ weight_kg, height_cm, age, sex }) {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  if (sex === "male") return base + 5;
  if (sex === "female") return base - 161;
  return base + (5 - 161) / 2; // 'other'/unknown → midpoint
}

/** Active calories burned by one day's run (the deficit driver). */
export function dailyBurnKcal(profile, trend) {
  return runningMet(trend.avgPaceKmh) * profile.weight_kg * trend.avgDurationH;
}

/**
 * Project days to reach goal weight.
 * opts.extraDailyKcal — extra daily deficit on top of running (e.g. diet).
 * Returns { ok, reason? , weightToLoseKg, dailyBurnKcal, daysToGoal, totalKcal }.
 */
export function project(profile, trend, opts = {}) {
  if (!(profile.weight_kg > 0) || !(profile.goal_weight_kg > 0)) {
    return { ok: false, reason: "missing_weight" };
  }
  const weightToLoseKg = profile.weight_kg - profile.goal_weight_kg;
  if (weightToLoseKg <= 0) {
    return { ok: false, reason: "goal_not_below_current" };
  }
  if (trend.runCount === 0 || trend.avgDistanceKm <= 0) {
    return { ok: false, reason: "no_runs" };
  }
  const burn = dailyBurnKcal(profile, trend) + (opts.extraDailyKcal || 0);
  if (burn <= 0) {
    return { ok: false, reason: "no_burn" };
  }
  const totalKcal = weightToLoseKg * KCAL_PER_KG_FAT;
  return {
    ok: true,
    weightToLoseKg,
    dailyBurnKcal: burn,
    daysToGoal: Math.ceil(totalKcal / burn),
    totalKcal,
  };
}

/**
 * Computed "do X → reach goal sooner" scenarios, each derived from the user's
 * own numbers. Returns [{ key, label, newDays, daysSaved }]. Empty if the base
 * projection is not viable.
 */
export function scenarios(profile, trend) {
  const base = project(profile, trend);
  if (!base.ok) return [];
  const out = [];

  // a) Run 1 km farther each day (same pace → longer duration → more burn).
  if (trend.avgPaceKmh > 0) {
    const dist = trend.avgDistanceKm + 1;
    const t = { ...trend, avgDistanceKm: dist, avgDurationH: dist / trend.avgPaceKmh };
    const p = project(profile, t);
    if (p.ok) {
      out.push({
        key: "extra_km",
        label: "Run 1 km farther each day",
        newDays: p.daysToGoal,
        daysSaved: base.daysToGoal - p.daysToGoal,
      });
    }
  }

  // b) Run 15 minutes longer each day (more time on feet → more burn).
  {
    const t = { ...trend, avgDurationH: trend.avgDurationH + 0.25 };
    if (trend.avgPaceKmh > 0) t.avgDistanceKm = t.avgDurationH * trend.avgPaceKmh;
    const p = project(profile, t);
    if (p.ok) {
      out.push({
        key: "extra_time",
        label: "Run 15 minutes longer each day",
        newDays: p.daysToGoal,
        daysSaved: base.daysToGoal - p.daysToGoal,
      });
    }
  }

  // c) Add a 300 kcal/day diet deficit on top of running.
  {
    const p = project(profile, trend, { extraDailyKcal: 300 });
    if (p.ok) {
      out.push({
        key: "diet_deficit",
        label: "Add a 300 kcal/day diet deficit",
        newDays: p.daysToGoal,
        daysSaved: base.daysToGoal - p.daysToGoal,
      });
    }
  }

  return out;
}
