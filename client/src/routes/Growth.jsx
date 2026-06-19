import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth.js";
import { runs as runsApi } from "../lib/api.js";
import {
  resolveProfile,
  runTrend,
  project,
  scenarios,
  dailyBurnKcal,
  bmr,
} from "../lib/growthModel.js";

const REASON_MESSAGE = {
  missing_weight: "Enter your current and goal weight to see a projection.",
  goal_not_below_current:
    "Your goal weight is not below your current weight — this projection only covers weight loss.",
  no_runs: "Record at least one run with distance to project a timeline.",
  no_burn: "Not enough run data to estimate calories burned.",
};

function field(label, value, onChange, props = {}) {
  return (
    <label className="block">
      <span className="font-hud-mono text-xs uppercase tracking-widest text-on-surface-variant">
        ▣ {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label.toLowerCase()}
        className="mt-1 w-full bg-surface-container px-md py-sm border border-primary-fixed/40 text-white"
        {...props}
      />
    </label>
  );
}

export default function Growth() {
  const { user, updateProfile } = useAuth();
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("male");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [runList, setRunList] = useState([]);

  useEffect(() => {
    if (!user) return;
    setWeight(user.weight_kg ?? "");
    setGoal(user.goal_weight_kg ?? "");
    setHeight(user.height_cm ?? "");
    setAge(user.age ?? "");
    setSex(user.sex ?? "male");
  }, [user]);

  useEffect(() => {
    let alive = true;
    runsApi
      .list()
      .then((rows) => alive && setRunList(rows || []))
      .catch(() => alive && setRunList([]));
    return () => {
      alive = false;
    };
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    const patch = {};
    const num = (v) => (v === "" || v === null ? null : Number(v));
    if (num(weight) !== (user?.weight_kg ?? null)) patch.weight_kg = num(weight);
    if (num(goal) !== (user?.goal_weight_kg ?? null)) patch.goal_weight_kg = num(goal);
    if (num(height) !== (user?.height_cm ?? null)) patch.height_cm = num(height);
    if (num(age) !== (user?.age ?? null)) patch.age = num(age);
    if (sex !== (user?.sex ?? "")) patch.sex = sex;
    // Drop nulls — PATCH only carries provided fields.
    Object.keys(patch).forEach((k) => patch[k] == null && delete patch[k]);
    if (Object.keys(patch).length === 0) {
      setStatus("idle");
      return;
    }
    try {
      await updateProfile(patch);
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Update failed");
    }
  }

  const { profile, usingDefaults } = resolveProfile(user);
  const trend = runTrend(runList);
  const result = project(profile, trend);
  const burn = dailyBurnKcal(profile, trend);
  const maintenance = bmr(profile);
  const tips = scenarios(profile, trend);

  return (
    <div className="px-margin-safe max-w-2xl mx-auto w-full">
      <p className="font-hud-mono text-xs uppercase tracking-widest text-primary-fixed mb-2">
        <span aria-hidden="true">[ TRAJECTORY.PLAN ]</span>
      </p>
      <h1 className="font-hud-mono font-bold text-2xl tracking-widest text-primary-fixed mb-lg [text-shadow:0_0_12px_rgba(195,244,0,0.35)]">
        GROWTH
      </h1>

      {/* Profile form */}
      <form
        data-testid="growth-form"
        onSubmit={onSubmit}
        className="hud-panel hud-corners p-lg space-y-md mb-lg"
      >
        <div className="grid grid-cols-2 gap-md">
          {field("CURRENT WEIGHT (KG)", weight, setWeight, { type: "number", min: "1", step: "0.1" })}
          {field("GOAL WEIGHT (KG)", goal, setGoal, { type: "number", min: "1", step: "0.1" })}
          {field("HEIGHT (CM)", height, setHeight, { type: "number", min: "1", step: "0.1" })}
          {field("AGE", age, setAge, { type: "number", min: "1", max: "120", step: "1" })}
          <label className="block">
            <span className="font-hud-mono text-xs uppercase tracking-widest text-on-surface-variant">
              ▣ SEX
            </span>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              aria-label="sex"
              className="mt-1 w-full bg-surface-container px-md py-sm border border-primary-fixed/40 text-white"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>
        {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}
        {status === "saved" && (
          <p className="text-primary-fixed text-sm">Profile saved.</p>
        )}
        <button
          type="submit"
          disabled={status === "saving"}
          className="bg-primary-fixed text-on-primary-fixed font-hud-mono font-bold uppercase tracking-widest px-lg py-sm disabled:opacity-60"
        >
          {status === "saving" ? "SAVING…" : "SAVE & PROJECT"}
        </button>
      </form>

      {usingDefaults && (
        <p
          data-testid="growth-defaults"
          className="font-hud-mono text-xs text-on-surface-variant mb-md"
        >
          ⚠ Using default body metrics for blank fields — fill them in above for an accurate projection.
        </p>
      )}

      {/* Projection panel */}
      {result.ok ? (
        <div data-testid="growth-projection" className="space-y-lg">
          <div className="hud-panel hud-corners p-lg text-center">
            <p className="font-hud-mono text-xs uppercase tracking-widest text-on-surface-variant">
              DAYS TO GOAL ({result.weightToLoseKg.toFixed(1)} KG TO LOSE)
            </p>
            <p className="font-hud-mono font-bold text-5xl text-primary-fixed [text-shadow:0_0_16px_rgba(195,244,0,0.4)] mt-2">
              {result.daysToGoal}
            </p>
            <p className="font-hud-mono text-xs text-on-surface-variant mt-1">
              running your {trend.avgDistanceKm.toFixed(1)} km average every day
            </p>
          </div>

          <div className="grid grid-cols-2 gap-md">
            <div className="hud-panel hud-corners p-md">
              <p className="font-hud-mono text-xs uppercase tracking-widest text-on-surface-variant">
                DAILY BURN
              </p>
              <p className="font-hud-mono font-bold text-xl text-white mt-1">
                {Math.round(burn)} <span className="text-xs text-on-surface-variant">KCAL/RUN</span>
              </p>
            </div>
            <div className="hud-panel hud-corners p-md">
              <p className="font-hud-mono text-xs uppercase tracking-widest text-on-surface-variant">
                BMR (MAINTENANCE)
              </p>
              <p className="font-hud-mono font-bold text-xl text-white mt-1">
                {Math.round(maintenance)} <span className="text-xs text-on-surface-variant">KCAL/DAY</span>
              </p>
            </div>
          </div>

          {tips.length > 0 && (
            <div>
              <p className="font-hud-mono text-xs uppercase tracking-widest text-primary-fixed mb-md">
                ▣ REACH IT FASTER
              </p>
              <div className="space-y-sm">
                {tips.map((t) => (
                  <div
                    key={t.key}
                    data-testid={`scenario-${t.key}`}
                    className="hud-panel p-md flex items-center justify-between gap-md"
                  >
                    <span className="font-hud-mono text-sm text-white">{t.label}</span>
                    <span className="font-hud-mono text-sm text-primary-fixed whitespace-nowrap">
                      {t.daysSaved > 0 ? `−${t.daysSaved} days` : "no change"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          data-testid="growth-guard"
          className="hud-panel hud-corners p-lg font-hud-mono text-sm text-on-surface-variant"
        >
          {REASON_MESSAGE[result.reason] || "Projection unavailable."}
        </div>
      )}
    </div>
  );
}
