import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import usePolling from "../hooks/usePolling.js";

function setHidden(hidden) {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => hidden,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("usePolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setHidden(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    setHidden(false);
  });

  it("calls fn immediately on mount", () => {
    const fn = vi.fn();
    renderHook(() => usePolling(fn, 1000));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("calls fn every intervalMs", () => {
    const fn = vi.fn();
    renderHook(() => usePolling(fn, 1000));
    expect(fn).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(3500));
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it("pauses when document becomes hidden", () => {
    const fn = vi.fn();
    renderHook(() => usePolling(fn, 1000));
    expect(fn).toHaveBeenCalledTimes(1);
    act(() => setHidden(true));
    act(() => vi.advanceTimersByTime(5000));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("resumes with immediate fetch when tab becomes visible", () => {
    const fn = vi.fn();
    renderHook(() => usePolling(fn, 1000));
    act(() => setHidden(true));
    act(() => vi.advanceTimersByTime(5000));
    fn.mockClear();
    act(() => setHidden(false));
    expect(fn).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(1500));
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("cleans up timer on unmount", () => {
    const fn = vi.fn();
    const { unmount } = renderHook(() => usePolling(fn, 1000));
    unmount();
    act(() => vi.advanceTimersByTime(5000));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does nothing when intervalMs is 0", () => {
    const fn = vi.fn();
    renderHook(() => usePolling(fn, 0));
    expect(fn).not.toHaveBeenCalled();
  });
});
