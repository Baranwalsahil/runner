import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import useGeolocation from "../hooks/useGeolocation.js";

function makeMockGeolocation() {
  let nextId = 1;
  const watchers = new Map();
  return {
    watchPosition: vi.fn((onSuccess, onError) => {
      const id = nextId++;
      watchers.set(id, { onSuccess, onError });
      return id;
    }),
    clearWatch: vi.fn((id) => {
      watchers.delete(id);
    }),
    _emit(id, coords) {
      const w = watchers.get(id);
      if (w) {
        w.onSuccess({
          coords,
          timestamp: Date.parse("2026-05-19T12:00:00Z"),
        });
      }
    },
    _emitError(id, message) {
      const w = watchers.get(id);
      if (w) w.onError({ message });
    },
    _watchersSize: () => watchers.size,
  };
}

describe("useGeolocation", () => {
  let mock;

  beforeEach(() => {
    mock = makeMockGeolocation();
    Object.defineProperty(global.navigator, "geolocation", {
      configurable: true,
      value: mock,
    });
  });

  afterEach(() => {
    // restore
    Object.defineProperty(global.navigator, "geolocation", {
      configurable: true,
      value: undefined,
    });
  });

  it("start() registers a watch and isRecording flips true", () => {
    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.start());
    expect(mock.watchPosition).toHaveBeenCalledOnce();
    expect(result.current.isRecording).toBe(true);
  });

  it("position emission appends to points", () => {
    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.start());
    act(() => mock._emit(1, { latitude: 47.6062, longitude: -122.3321, accuracy: 8 }));
    expect(result.current.points).toHaveLength(1);
    expect(result.current.points[0].lat).toBe(47.6062);
    expect(result.current.points[0].lng).toBe(-122.3321);
    expect(result.current.points[0].accuracy).toBe(8);
    expect(result.current.points[0].timestamp).toBe("2026-05-19T12:00:00.000Z");
  });

  it("stop() clears the watch and flips isRecording false", () => {
    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.start());
    act(() => result.current.stop());
    expect(mock.clearWatch).toHaveBeenCalledOnce();
    expect(result.current.isRecording).toBe(false);
  });

  it("clear() empties points", () => {
    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.start());
    act(() => mock._emit(1, { latitude: 47.6, longitude: -122.3, accuracy: 10 }));
    act(() => result.current.clear());
    expect(result.current.points).toHaveLength(0);
  });

  it("error callback surfaces message", () => {
    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.start());
    act(() => mock._emitError(1, "User denied"));
    expect(result.current.error).toBe("User denied");
  });

  it("unmount clears any active watch", () => {
    const { result, unmount } = renderHook(() => useGeolocation());
    act(() => result.current.start());
    expect(mock._watchersSize()).toBe(1);
    unmount();
    expect(mock._watchersSize()).toBe(0);
  });

  it("no-op when geolocation missing", () => {
    Object.defineProperty(global.navigator, "geolocation", {
      configurable: true,
      value: undefined,
    });
    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.start());
    expect(result.current.error).toMatch(/not supported/i);
    expect(result.current.isRecording).toBe(false);
  });
});
