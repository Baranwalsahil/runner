import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import useLeaderboardPolling from "../hooks/useLeaderboardPolling.js";

const PAGE_BODY = JSON.stringify({ rows: [], total: 0, limit: 50, offset: 0 });

describe("useLeaderboardPolling", () => {
  let fetchMock;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi.fn().mockResolvedValue(
      new Response(PAGE_BODY, {
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

  it("fires fetch immediately and polls every 30s", async () => {
    renderHook(() => useLeaderboardPolling());
    await act(async () => {});
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTime(30_000));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("re-fetches when period changes", async () => {
    let period = "all";
    const { rerender } = renderHook(
      ({ p }) => useLeaderboardPolling({ period: p }),
      { initialProps: { p: period } }
    );
    await act(async () => {});
    expect(fetchMock).toHaveBeenCalledTimes(1);

    period = "weekly";
    rerender({ p: period });
    await act(async () => {});
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toMatch(/period=weekly/);
  });
});
