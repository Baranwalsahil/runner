import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RunTracker from "../components/run/RunTracker.jsx";
import { SESSION_KEY } from "../lib/runSession.js";

function makeMockGeolocation() {
  let nextId = 1;
  const watchers = new Map();
  return {
    watchPosition: vi.fn((onSuccess) => {
      const id = nextId++;
      watchers.set(id, { onSuccess });
      return id;
    }),
    clearWatch: vi.fn((id) => watchers.delete(id)),
    _emit(id, coords) {
      const w = watchers.get(id);
      if (w) {
        w.onSuccess({
          coords,
          timestamp: Date.parse("2026-05-19T12:00:00Z"),
        });
      }
    },
  };
}

describe("<RunTracker>", () => {
  let geo;
  let fetchMock;

  beforeEach(() => {
    geo = makeMockGeolocation();
    Object.defineProperty(globalThis.navigator, "geolocation", {
      configurable: true,
      value: geo,
    });
    window.localStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    Object.defineProperty(globalThis.navigator, "geolocation", {
      configurable: true,
      value: undefined,
    });
    vi.unstubAllGlobals();
  });

  function renderTracker() {
    return render(
      <MemoryRouter>
        <RunTracker />
      </MemoryRouter>
    );
  }

  function emitTwoPoints() {
    act(() => {
      geo._emit(1, { latitude: 47.6062, longitude: -122.3321, accuracy: 10 });
      geo._emit(1, { latitude: 47.6063, longitude: -122.3322, accuracy: 10 });
    });
  }

  it("shows Start button initially", () => {
    renderTracker();
    expect(screen.getByRole("button", { name: /^start$/i })).toBeInTheDocument();
  });

  it("Start switches UI to Pause + Finish (no Stop)", () => {
    renderTracker();
    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
    expect(geo.watchPosition).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: /^pause$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^finish$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /stop/i })).not.toBeInTheDocument();
  });

  it("Pause stops the GPS watch and shows Resume; does not submit", () => {
    renderTracker();
    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
    emitTwoPoints();
    fireEvent.click(screen.getByRole("button", { name: /^pause$/i }));
    expect(geo.clearWatch).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /^resume$/i })).toBeInTheDocument();
    expect(screen.getByTestId("paused-badge")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Resume re-opens the watch and keeps captured points", () => {
    renderTracker();
    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
    emitTwoPoints();
    fireEvent.click(screen.getByRole("button", { name: /^pause$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^resume$/i }));
    expect(geo.watchPosition).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: /^pause$/i })).toBeInTheDocument();
    // points preserved across pause/resume
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders error when fewer than 2 points and Finish pressed", () => {
    renderTracker();
    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^finish$/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/at least 2 GPS points/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits captured trace to /runs only on Finish and shows result", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ run_id: "abc-123", cells_claimed: 5, new_total: 5 }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      )
    );
    renderTracker();
    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
    emitTwoPoints();
    fireEvent.click(screen.getByRole("button", { name: /^finish$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/runs$/);
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body.gps_trace).toHaveLength(2);
    expect(body.started_at).toBeTruthy();
    expect(body.ended_at).toBeTruthy();

    expect(await screen.findByTestId("run-result")).toHaveTextContent("cells claimed: 5");
    // session cleared after finish
    expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("surfaces server error message on non-2xx", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ error: "http_error", message: "trace too noisy after filtering" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    );
    renderTracker();
    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
    emitTwoPoints();
    fireEvent.click(screen.getByRole("button", { name: /^finish$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/too noisy/i);
  });

  it("persists the active session to localStorage while recording", () => {
    renderTracker();
    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
    emitTwoPoints();
    const saved = JSON.parse(window.localStorage.getItem(SESSION_KEY));
    expect(saved.status).toBe("recording");
    expect(saved.points).toHaveLength(2);
  });

  it("restores an in-progress session after a refresh (remount)", () => {
    // Seed a recording session as if a prior page had saved it.
    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        status: "recording",
        startedAt: Date.parse("2026-05-19T12:00:00Z"),
        accumulatedMs: 0,
        segmentStartedAt: Date.parse("2026-05-19T12:00:00Z"),
        points: [
          { lat: 47.6062, lng: -122.3321, accuracy: 10, timestamp: "x" },
          { lat: 47.6063, lng: -122.3322, accuracy: 10, timestamp: "y" },
        ],
      })
    );
    renderTracker();
    // Resumes mid-run, not a fresh Start screen.
    expect(screen.getByRole("button", { name: /^pause$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^start$/i })).not.toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // points restored
    expect(geo.watchPosition).toHaveBeenCalled(); // watch re-opened
  });

  it("restores a paused session as paused (frozen, watch not reopened)", () => {
    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        status: "paused",
        startedAt: 0,
        accumulatedMs: 5000,
        segmentStartedAt: null,
        points: [
          { lat: 47.6062, lng: -122.3321, accuracy: 10, timestamp: "x" },
          { lat: 47.6063, lng: -122.3322, accuracy: 10, timestamp: "y" },
        ],
      })
    );
    renderTracker();
    expect(screen.getByRole("button", { name: /^resume$/i })).toBeInTheDocument();
    expect(screen.getByTestId("paused-badge")).toBeInTheDocument();
    expect(geo.watchPosition).not.toHaveBeenCalled();
  });

  // Bug fix: timer stops immediately on Submit click, not after network resolves.
  it("timer stops immediately when Finish is clicked (before network resolves)", async () => {
    // Use a promise we can control so the request stays pending.
    let resolveRequest;
    fetchMock.mockReturnValue(
      new Promise((res) => {
        resolveRequest = res;
      })
    );

    renderTracker();
    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
    emitTwoPoints();

    // Capture the timer value displayed just before clicking Finish.
    const timeBefore = screen.getByText(/^\d{2}:\d{2}$/).textContent;

    fireEvent.click(screen.getByRole("button", { name: /^finish$/i }));

    // Button should now show "Submitting…" (request is in-flight).
    // The session transitions to paused state so the button grid stays visible.
    expect(screen.getByRole("button", { name: /submitting/i })).toBeInTheDocument();

    // The timer must be frozen at the same value — the session was synchronously
    // moved to paused state on click so no more interval ticks accumulate.
    const timeAfterClick = screen.getByText(/^\d{2}:\d{2}$/).textContent;
    expect(timeAfterClick).toBe(timeBefore);

    // Clean up: resolve the pending request so no React state-update warnings.
    act(() => {
      resolveRequest(
        new Response(
          JSON.stringify({ run_id: "x", cells_claimed: 0, new_total: 0 }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        )
      );
    });
    await waitFor(() => expect(screen.queryByRole("button", { name: /submitting/i })).not.toBeInTheDocument());
  });

  // Bug fix: Finish button carries whitespace-nowrap so "Submitting…" never
  // overflows its box.
  it("Finish button has whitespace-nowrap class to prevent text overflow", () => {
    renderTracker();
    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
    emitTwoPoints();

    const finishBtn = screen.getByRole("button", { name: /^finish$/i });
    expect(finishBtn.className).toMatch(/whitespace-nowrap/);
  });
});
