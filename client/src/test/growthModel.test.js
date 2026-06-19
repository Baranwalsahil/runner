import { describe, it, expect } from "vitest";
import {
  KCAL_PER_KG_FAT,
  DEFAULT_PROFILE,
  resolveProfile,
  runTrend,
  runningMet,
  bmr,
  dailyBurnKcal,
  project,
  scenarios,
} from "../lib/growthModel.js";

// Two runs: 5 km in 30 min, 7 km in 42 min → both 10 km/h pace.
const RUNS = [
  {
    distance_meters: 5000,
    started_at: "2026-06-01T08:00:00Z",
    ended_at: "2026-06-01T08:30:00Z",
  },
  {
    distance_meters: 7000,
    started_at: "2026-06-02T08:00:00Z",
    ended_at: "2026-06-02T08:42:00Z",
  },
];

const PROFILE = {
  weight_kg: 80,
  goal_weight_kg: 75,
  height_cm: 178,
  age: 30,
  sex: "male",
};

describe("runTrend", () => {
  it("averages distance, duration, and pace", () => {
    const t = runTrend(RUNS);
    expect(t.runCount).toBe(2);
    expect(t.avgDistanceKm).toBeCloseTo(6, 5); // (5+7)/2
    expect(t.avgDurationH).toBeCloseTo(0.6, 5); // (0.5+0.7)/2
    expect(t.avgPaceKmh).toBeCloseTo(10, 5);
  });

  it("ignores runs without distance or timestamps", () => {
    const t = runTrend([
      { distance_meters: 0, started_at: "x", ended_at: "y" },
      { distance_meters: 5000, started_at: null, ended_at: null },
    ]);
    expect(t.runCount).toBe(0);
    expect(t.avgDistanceKm).toBe(0);
  });

  it("returns zeros for empty input", () => {
    expect(runTrend([]).runCount).toBe(0);
    expect(runTrend(undefined).avgPaceKmh).toBe(0);
  });
});

describe("runningMet", () => {
  it("maps pace to MET tiers", () => {
    expect(runningMet(0)).toBe(0);
    expect(runningMet(7)).toBe(8.3);
    expect(runningMet(9)).toBe(9.8);
    expect(runningMet(10)).toBe(11.0);
    expect(runningMet(12)).toBe(11.8);
    expect(runningMet(15)).toBe(12.8);
  });
});

describe("bmr (Mifflin-St Jeor)", () => {
  it("computes male BMR", () => {
    // 10*80 + 6.25*178 - 5*30 + 5 = 800 + 1112.5 - 150 + 5 = 1767.5
    expect(bmr(PROFILE)).toBeCloseTo(1767.5, 4);
  });
  it("female is 166 below male", () => {
    const male = bmr({ ...PROFILE, sex: "male" });
    const female = bmr({ ...PROFILE, sex: "female" });
    expect(male - female).toBeCloseTo(166, 4);
  });
  it("other is midpoint of male/female", () => {
    const male = bmr({ ...PROFILE, sex: "male" });
    const female = bmr({ ...PROFILE, sex: "female" });
    expect(bmr({ ...PROFILE, sex: "other" })).toBeCloseTo((male + female) / 2, 4);
  });
});

describe("dailyBurnKcal", () => {
  it("MET * weight * duration", () => {
    const t = runTrend(RUNS); // MET=11, weight 80, dur 0.6
    expect(dailyBurnKcal(PROFILE, t)).toBeCloseTo(11.0 * 80 * 0.6, 4);
  });
});

describe("project", () => {
  it("computes days to goal", () => {
    const t = runTrend(RUNS);
    const burn = dailyBurnKcal(PROFILE, t); // 528 kcal
    const r = project(PROFILE, t);
    expect(r.ok).toBe(true);
    expect(r.weightToLoseKg).toBe(5);
    expect(r.totalKcal).toBe(5 * KCAL_PER_KG_FAT);
    expect(r.daysToGoal).toBe(Math.ceil((5 * KCAL_PER_KG_FAT) / burn));
  });

  it("rejects goal not below current", () => {
    const r = project({ ...PROFILE, goal_weight_kg: 85 }, runTrend(RUNS));
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("goal_not_below_current");
  });

  it("rejects when no runs", () => {
    const r = project(PROFILE, runTrend([]));
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("no_runs");
  });

  it("rejects missing weight", () => {
    const r = project({ ...PROFILE, weight_kg: 0 }, runTrend(RUNS));
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("missing_weight");
  });

  it("extra daily deficit shortens timeline", () => {
    const t = runTrend(RUNS);
    const base = project(PROFILE, t);
    const faster = project(PROFILE, t, { extraDailyKcal: 300 });
    expect(faster.daysToGoal).toBeLessThan(base.daysToGoal);
  });
});

describe("scenarios", () => {
  it("returns viable speed-up scenarios that save days", () => {
    const t = runTrend(RUNS);
    const list = scenarios(PROFILE, t);
    expect(list.length).toBe(3);
    for (const s of list) {
      expect(s.daysSaved).toBeGreaterThan(0);
      expect(s.newDays).toBeGreaterThan(0);
    }
    expect(list.map((s) => s.key)).toEqual(["extra_km", "extra_time", "diet_deficit"]);
  });

  it("is empty when projection is not viable", () => {
    expect(scenarios(PROFILE, runTrend([]))).toEqual([]);
  });
});

describe("resolveProfile", () => {
  it("flags defaults for blank fields", () => {
    const { profile, usingDefaults } = resolveProfile({ weight_kg: 90 });
    expect(usingDefaults).toBe(true);
    expect(profile.weight_kg).toBe(90);
    expect(profile.height_cm).toBe(DEFAULT_PROFILE.height_cm);
  });

  it("no defaults when all fields present", () => {
    const { usingDefaults } = resolveProfile(PROFILE);
    expect(usingDefaults).toBe(false);
  });
});
