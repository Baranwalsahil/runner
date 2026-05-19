import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import useTerritoryPolling from "../hooks/useTerritoryPolling.js";

describe("useTerritoryPolling", () => {
  let fetchMock;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi.fn().mockResolvedValue(
      new Response("[]", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("does not fetch when bounds is null", () => {
    renderHook(() => useTerritoryPolling(null));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches immediately on mount with bounds", async () => {
    const bounds = { sw_lat: 0, sw_lng: 0, ne_lat: 1, ne_lng: 1 };
    renderHook(() => useTerritoryPolling(bounds));
    await act(async () => {});
    expect(fetchMock).toHaveBeenCalledOnce();
    const url = fetchMock.mock.calls[0][0];
    expect(url).toMatch(/bounds=0,0,1,1/);
  });

  it("polls every 15s", async () => {
    const bounds = { sw_lat: 0, sw_lng: 0, ne_lat: 1, ne_lng: 1 };
    renderHook(() => useTerritoryPolling(bounds));
    await act(async () => {});
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTime(15_000));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await act(async () => vi.advanceTimersByTime(15_000));
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("refetches when bounds change", async () => {
    let bounds = { sw_lat: 0, sw_lng: 0, ne_lat: 1, ne_lng: 1 };
    const { rerender } = renderHook(({ b }) => useTerritoryPolling(b), {
      initialProps: { b: bounds },
    });
    await act(async () => {});
    expect(fetchMock).toHaveBeenCalledTimes(1);
    bounds = { sw_lat: 10, sw_lng: 10, ne_lat: 11, ne_lng: 11 };
    rerender({ b: bounds });
    await act(async () => {});
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const url = fetchMock.mock.calls[1][0];
    expect(url).toMatch(/bounds=10,10,11,11/);
  });
});
