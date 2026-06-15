import { describe, it, expect, beforeEach } from "vitest";
import {
  SESSION_KEY,
  loadSession,
  saveSession,
  clearSession,
  elapsedMs,
  startSession,
  pauseSession,
  resumeSession,
} from "../lib/runSession.js";

beforeEach(() => {
  localStorage.clear();
});

describe("startSession", () => {
  it("creates a recording session anchored at now", () => {
    const s = startSession(1000);
    expect(s.status).toBe("recording");
    expect(s.startedAt).toBe(1000);
    expect(s.accumulatedMs).toBe(0);
    expect(s.segmentStartedAt).toBe(1000);
    expect(s.points).toEqual([]);
  });
});

describe("elapsedMs", () => {
  it("counts wall-clock since segment start while recording", () => {
    const s = startSession(1000);
    expect(elapsedMs(s, 1000)).toBe(0);
    expect(elapsedMs(s, 6000)).toBe(5000);
  });

  it("returns banked time only while paused (frozen)", () => {
    const paused = pauseSession(startSession(1000), 6000);
    expect(paused.status).toBe("paused");
    // frozen regardless of how much later `now` is
    expect(elapsedMs(paused, 6000)).toBe(5000);
    expect(elapsedMs(paused, 999999)).toBe(5000);
  });

  it("returns 0 for null session", () => {
    expect(elapsedMs(null, 1000)).toBe(0);
  });
});

describe("pause then resume accumulates active time across segments", () => {
  it("banks first segment and continues from resume", () => {
    let s = startSession(0); // segment 1 starts at 0
    s = pauseSession(s, 5000); // banked 5s
    expect(s.accumulatedMs).toBe(5000);
    expect(s.segmentStartedAt).toBeNull();

    s = resumeSession(s, 10000); // segment 2 starts at 10s (5s paused gap ignored)
    expect(s.status).toBe("recording");
    expect(s.segmentStartedAt).toBe(10000);

    // at 13s: 5s banked + 3s in segment 2 = 8s active
    expect(elapsedMs(s, 13000)).toBe(8000);
  });

  it("pause is a no-op when not recording", () => {
    const paused = pauseSession(startSession(0), 1000);
    expect(pauseSession(paused, 5000)).toBe(paused);
  });

  it("resume is a no-op when not paused", () => {
    const rec = startSession(0);
    expect(resumeSession(rec, 5000)).toBe(rec);
  });
});

describe("persistence", () => {
  it("round-trips a recording session", () => {
    const s = { ...startSession(0), points: [{ lat: 1, lng: 2 }] };
    saveSession(s);
    expect(JSON.parse(localStorage.getItem(SESSION_KEY)).status).toBe("recording");
    expect(loadSession()).toEqual(s);
  });

  it("loadSession returns null when empty", () => {
    expect(loadSession()).toBeNull();
  });

  it("loadSession ignores finished/garbage status", () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ status: "finished" }));
    expect(loadSession()).toBeNull();
    localStorage.setItem(SESSION_KEY, "not json");
    expect(loadSession()).toBeNull();
  });

  it("loadSession defaults missing points to []", () => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ status: "paused", accumulatedMs: 100 })
    );
    expect(loadSession().points).toEqual([]);
  });

  it("clearSession removes the key", () => {
    saveSession(startSession(0));
    clearSession();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });
});
