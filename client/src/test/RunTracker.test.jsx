import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RunTracker from "../components/run/RunTracker.jsx";

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
    Object.defineProperty(global.navigator, "geolocation", {
      configurable: true,
      value: geo,
    });
    window.localStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    Object.defineProperty(global.navigator, "geolocation", {
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

  it("shows Start button initially", () => {
    renderTracker();
    expect(screen.getByRole("button", { name: /^start$/i })).toBeInTheDocument();
  });

  it("Start switches UI to Stop", () => {
    renderTracker();
    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
    expect(geo.watchPosition).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
  });

  it("renders error when fewer than 2 points and Stop pressed", () => {
    renderTracker();
    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
    fireEvent.click(screen.getByRole("button", { name: /stop/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/at least 2 GPS points/i);
  });

  it("submits captured trace to /runs and shows result", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          run_id: "abc-123",
          cells_claimed: 5,
          new_total: 5,
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      )
    );
    renderTracker();
    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
    act(() => {
      geo._emit(1, { latitude: 47.6062, longitude: -122.3321, accuracy: 10 });
      geo._emit(1, { latitude: 47.6063, longitude: -122.3322, accuracy: 10 });
    });
    fireEvent.click(screen.getByRole("button", { name: /stop/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/runs$/);
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body.gps_trace).toHaveLength(2);
    expect(body.started_at).toBeTruthy();
    expect(body.ended_at).toBeTruthy();

    expect(await screen.findByTestId("run-result")).toHaveTextContent("cells claimed: 5");
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
    act(() => {
      geo._emit(1, { latitude: 47.6062, longitude: -122.3321, accuracy: 10 });
      geo._emit(1, { latitude: 47.6063, longitude: -122.3322, accuracy: 10 });
    });
    fireEvent.click(screen.getByRole("button", { name: /stop/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/too noisy/i);
  });
});
