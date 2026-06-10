import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useGeolocation from "../../hooks/useGeolocation.js";
import { apiJson } from "../../lib/auth.js";

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
  const { points, isRecording, error: geoError, start, stop, clear } = useGeolocation();
  const navigate = useNavigate();
  const startedAtRef = useRef(null);
  const [now, setNow] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  const elapsedMs =
    startedAtRef.current ? now - startedAtRef.current : 0;
  const distanceKm = totalKm(points);
  const estimatedCells = new Set(
    points.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`)
  ).size;

  function handleStart() {
    setResult(null);
    setSubmitError(null);
    clear();
    startedAtRef.current = Date.now();
    setNow(Date.now());
    start();
  }

  async function handleStop() {
    stop();
    const endedAt = new Date().toISOString();
    const startedAt = new Date(startedAtRef.current || Date.now()).toISOString();
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
    } catch (err) {
      setSubmitError(err.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div data-testid="run-tracker" className="mx-auto max-w-md p-lg space-y-md">
      <h1 className="font-scifi font-light text-3xl uppercase tracking-tight text-on-surface">
        Session Tracker
      </h1>

      <div className="grid grid-cols-3 gap-md text-center">
        <Stat label="Time" value={formatDuration(elapsedMs)} />
        <Stat label="Distance" value={`${distanceKm.toFixed(2)} km`} />
        <Stat label="Points" value={String(points.length)} />
      </div>

      <div className="text-center text-xs font-scifi uppercase tracking-[0.2em] text-on-surface-variant">
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
          className="scifi-panel rounded-2xl p-md text-sm font-scifi"
        >
          <div>cells claimed: {result.cells_claimed}</div>
          <div>new total: {result.new_total}</div>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-md w-full rounded-full bg-secondary-container px-md py-sm font-scifi font-medium uppercase tracking-[0.15em] text-on-secondary shadow-[0_0_20px_rgba(0,219,233,0.3)]"
          >
            View dashboard
          </button>
        </div>
      )}

      {!isRecording && !result && (
        <button
          type="button"
          onClick={handleStart}
          disabled={submitting}
          className="w-full rounded-full bg-secondary-container px-md py-md text-lg font-scifi font-medium uppercase tracking-[0.15em] text-on-secondary shadow-[0_0_25px_rgba(0,219,233,0.4)] disabled:opacity-50"
        >
          Start
        </button>
      )}
      {isRecording && (
        <button
          type="button"
          onClick={handleStop}
          disabled={submitting}
          className="w-full rounded-full bg-red-500 px-md py-md text-lg font-scifi font-medium uppercase tracking-[0.15em] text-white shadow-[0_0_25px_rgba(239,68,68,0.4)] disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Stop & Submit"}
        </button>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="scifi-panel rounded-xl p-sm">
      <div className="text-xs font-scifi uppercase tracking-[0.2em] text-on-surface-variant">
        {label}
      </div>
      <div className="font-scifi font-light text-xl text-secondary-fixed">{value}</div>
    </div>
  );
}
