import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import useTerritory from "../hooks/useTerritory.js";

describe("useTerritory", () => {
  let fetchMock;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("does nothing when bounds is null", () => {
    const { result } = renderHook(() => useTerritory(null));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.cells).toEqual([]);
  });

  it("debounces fetch by 500ms", async () => {
    fetchMock.mockResolvedValue(
      new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } })
    );
    const bounds = { sw_lat: 0, sw_lng: 0, ne_lat: 1, ne_lng: 1 };
    renderHook(() => useTerritory(bounds));
    expect(fetchMock).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(499);
    });
    expect(fetchMock).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("updates cells with adapted data on resolve", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            h3_index: "abc",
            user_id: "u1",
            username: "alpha",
            color: "#00dbe9",
            resolution: 9,
            claim_count: 1,
            claimed_at: "2026-05-19T12:00:00",
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    const bounds = { sw_lat: 0, sw_lng: 0, ne_lat: 1, ne_lng: 1 };
    const { result } = renderHook(() => useTerritory(bounds));
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    await vi.waitFor(() => {
      expect(result.current.cells.length).toBe(1);
    });
    expect(result.current.cells[0].h3Index).toBe("abc");
  });

  it("surfaces error message on failure", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "boom" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    );
    const bounds = { sw_lat: 0, sw_lng: 0, ne_lat: 1, ne_lng: 1 };
    const { result } = renderHook(() => useTerritory(bounds));
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    await vi.waitFor(() => {
      expect(result.current.error).toBe("boom");
    });
  });
});
