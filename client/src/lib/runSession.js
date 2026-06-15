// Pure helpers for the active run session: localStorage persistence +
// pause-aware elapsed-time math. Kept side-effect-light so it is unit-testable.

export const SESSION_KEY = "territory_run.active_session";

// Session shape:
//   {
//     status: "recording" | "paused",
//     startedAt: number,         // wall-clock ms of original session start
//     accumulatedMs: number,     // active time banked from finished segments
//     segmentStartedAt: number|null, // ms when current segment began (null when paused)
//     points: Array<{lat,lng,accuracy,timestamp}>,
//   }
// Only non-finished sessions are persisted. idle/finished => key removed.

function hasStorage() {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

export function loadSession() {
  if (!hasStorage()) return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || (s.status !== "recording" && s.status !== "paused")) return null;
    if (!Array.isArray(s.points)) s.points = [];
    return s;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  if (!hasStorage()) return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // quota / serialization failure — ignore, session stays in-memory
  }
}

export function clearSession() {
  if (!hasStorage()) return;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * Active elapsed time in ms, pause-aware.
 * While recording: banked time + time since current segment started.
 * While paused/idle: just banked time.
 */
export function elapsedMs(session, nowMs) {
  if (!session) return 0;
  const banked = session.accumulatedMs || 0;
  if (session.status === "recording" && session.segmentStartedAt != null) {
    return banked + Math.max(0, nowMs - session.segmentStartedAt);
  }
  return banked;
}

/** Begin a brand-new recording session at nowMs. */
export function startSession(nowMs) {
  return {
    status: "recording",
    startedAt: nowMs,
    accumulatedMs: 0,
    segmentStartedAt: nowMs,
    points: [],
  };
}

/** Pause: bank the current segment, drop the segment marker, freeze elapsed. */
export function pauseSession(session, nowMs) {
  if (!session || session.status !== "recording") return session;
  const banked =
    (session.accumulatedMs || 0) +
    (session.segmentStartedAt != null
      ? Math.max(0, nowMs - session.segmentStartedAt)
      : 0);
  return {
    ...session,
    status: "paused",
    accumulatedMs: banked,
    segmentStartedAt: null,
  };
}

/** Resume: open a fresh recording segment at nowMs. */
export function resumeSession(session, nowMs) {
  if (!session || session.status !== "paused") return session;
  return {
    ...session,
    status: "recording",
    segmentStartedAt: nowMs,
  };
}
