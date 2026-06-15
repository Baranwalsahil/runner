import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useGeolocation from "../../hooks/useGeolocation.js";
import { apiJson } from "../../lib/auth.js";
import {
  loadSession,
  saveSession,
  clearSession,
  elapsedMs as calcElapsedMs,
  startSession,
  pauseSession,
  resumeSession,
} from "../../lib/runSession.js";

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function haversineKm(a, b) {
  const R = 6371.0;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function totalKm(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineKm(points[i - 1], points[i]);
  }
  return total;
}

export default function RunTracker() {
  const { points, error: geoError, start, stop, clear, hydrate } = useGeolocation();
  const navigate = useNavigate();
  // session === null  -> idle (or finished, when `result` is set).
  // Lazy-init from localStorage so a refresh restores the same run.
  const [session, setSession] = useState(() => loadSession());
  const [now, setNow] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null);

  const status = session?.status ?? "idle";
  const recording = status === "recording";
  const paused = status === "paused";

  // After restoring a session, re-sync external systems (GPS trace + watch).
  // Runs once on mount; no direct setState here (hydrate/start own their state).
  useEffect(() => {
    const saved = loadSession();
    if (!saved) return;
    hydrate(saved.points);
    if (saved.status === "recording") {
      start(); // re-open the GPS watch; trace keeps appending
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tick the clock while recording.
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [recording]);

  // Persist the active session (status + timing + trace) on every change.
  useEffect(() => {
    if (!session) return;
    saveSession({ ...session, points });
  }, [session, points]);

  const elapsedMs = calcElapsedMs(session, now);
  const distanceKm = totalKm(points);
  const estimatedCells = new Set(
    points.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`)
  ).size;

  function handleStart() {
    setResult(null);
    setSubmitError(null);
    clear();
    clearSession();
    const next = startSession(Date.now());
    setSession(next);
    setNow(Date.now());
    start();
  }

  function handlePause() {
    stop();
    setSession((s) => pauseSession(s, Date.now()));
  }

  function handleResume() {
    setSession((s) => resumeSession(s, Date.now()));
    setNow(Date.now());
    start();
  }

  async function handleFinish() {
    stop();
    const endedAt = new Date().toISOString();
    const startedAt = new Date(session?.startedAt || Date.now()).toISOString();
    if (points.length < 2) {
      setSubmitError("Need at least 2 GPS points to submit");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const data = await apiJson("/runs", {
        method: "POST",
        body: JSON.stringify({
          gps_trace: points,
          started_at: startedAt,
          ended_at: endedAt,
        }),
      });
      setResult(data);
      clearSession();
      setSession(null);
    } catch (err) {
      setSubmitError(err.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div data-testid="run-tracker" className="mx-auto max-w-md p-lg space-y-md">
      <p className="font-hud-mono text-xs uppercase tracking-widest text-primary-fixed">
        <span aria-hidden="true">[ FIELD.OPS ]</span>
      </p>
      <h1 className="font-hud-mono font-bold text-2xl uppercase tracking-widest text-primary-fixed [text-shadow:0_0_12px_rgba(195,244,0,0.35)]">
        Session Tracker
      </h1>

      {paused && (
        <p
          data-testid="paused-badge"
          className="text-center text-xs font-hud-mono uppercase tracking-widest text-amber-400"
        >
          ▮▮ Paused
        </p>
      )}

      <div className="grid grid-cols-3 gap-md text-center">
        <Stat label="Time" value={formatDuration(elapsedMs)} />
        <Stat label="Distance" value={`${distanceKm.toFixed(2)} km`} />
        <Stat label="Points" value={String(points.length)} />
      </div>

      <div className="text-center text-xs font-hud-mono uppercase tracking-widest text-on-surface-variant">
        Est. cells: {estimatedCells}
      </div>

      {geoError && (
        <p role="alert" className="text-sm text-red-400">
          GPS: {geoError}
        </p>
      )}
      {submitError && (
        <p role="alert" className="text-sm text-red-400">
          {submitError}
        </p>
      )}
      {result && (
        <div
          data-testid="run-result"
          className="hud-panel hud-corners p-md text-sm font-hud-mono"
        >
          <div>cells claimed: {result.cells_claimed}</div>
          <div>new total: {result.new_total}</div>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-md w-full bg-primary-fixed font-hud-mono px-md py-sm uppercase tracking-wider text-on-primary-fixed"
          >
            View dashboard
          </button>
        </div>
      )}

      {status === "idle" && !result && (
        <button
          type="button"
          onClick={handleStart}
          disabled={submitting}
          className="w-full bg-primary-fixed px-md py-md text-lg font-hud-mono font-bold uppercase tracking-widest text-on-primary-fixed disabled:opacity-50"
        >
          Start
        </button>
      )}

      {(recording || paused) && (
        <div className="grid grid-cols-2 gap-md">
          {recording ? (
            <button
              type="button"
              onClick={handlePause}
              disabled={submitting}
              className="w-full bg-amber-500 px-md py-md text-lg font-hud-mono font-bold uppercase tracking-widest text-black disabled:opacity-50"
            >
              Pause
            </button>
          ) : (
            <button
              type="button"
              onClick={handleResume}
              disabled={submitting}
              className="w-full bg-primary-fixed px-md py-md text-lg font-hud-mono font-bold uppercase tracking-widest text-on-primary-fixed disabled:opacity-50"
            >
              Resume
            </button>
          )}
          <button
            type="button"
            onClick={handleFinish}
            disabled={submitting}
            className="w-full bg-red-500 px-md py-md text-lg font-hud-mono font-bold uppercase tracking-widest text-white disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Finish"}
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="hud-panel p-sm">
      <div className="text-xs font-hud-mono uppercase tracking-widest text-on-surface-variant">
        {label}
      </div>
      <div className="font-hud-mono text-lg text-on-surface">{value}</div>
    </div>
  );
}
