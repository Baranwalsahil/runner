import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AppLayout from "../components/AppLayout.jsx";
import Leaderboard from "../routes/Leaderboard.jsx";
import { withAuth } from "./utils/withAuth.jsx";

function setup() {
  return render(
    withAuth(
      <MemoryRouter initialEntries={["/leaderboard"]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Route>
        </Routes>
      </MemoryRouter>,
      { user: { id: "me", email: "me@example.com", username: "me" } }
    )
  );
}

function mockTopResponse(rows) {
  return new Response(
    JSON.stringify({
      rows,
      total: rows.length,
      limit: 50,
      offset: 0,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

describe("Leaderboard route", () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    // Replace fetch with a quiet stub before unstubbing so any in-flight
    // polling timers don't blow up after the test ends.
    globalThis.fetch = () =>
      Promise.resolve(
        new Response(
          JSON.stringify({ rows: [], total: 0, limit: 50, offset: 0 }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    vi.unstubAllGlobals();
  });

  it("renders Territory Lords heading immediately", () => {
    fetchMock.mockResolvedValue(mockTopResponse([]));
    setup();
    expect(screen.getByRole("heading", { name: /Territory Lords/ })).toBeInTheDocument();
  });

  it("shows loading state then empty message when no rows", async () => {
    fetchMock.mockResolvedValue(mockTopResponse([]));
    setup();
    expect(screen.getByTestId("lb-loading")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/No runners yet/i)).toBeInTheDocument()
    );
  });

  it("renders rank table after fetch succeeds, no podium", async () => {
    fetchMock.mockResolvedValue(
      mockTopResponse([
        { user_id: "u1", username: "alpha", total_cells: 100, rank: 1, color: "#c3f400" },
        { user_id: "u2", username: "beta", total_cells: 50, rank: 2, color: "#00dbe9" },
        { user_id: "u3", username: "gamma", total_cells: 25, rank: 3, color: "#ff6b6b" },
      ])
    );
    setup();
    await waitFor(() => expect(screen.getByTestId("rank-table")).toBeInTheDocument());
    expect(screen.queryByTestId("podium")).toBeNull();
    expect(screen.getByTestId("filter-chips")).toBeInTheDocument();
  });

  it("does not render Regional or Friends region chips", async () => {
    fetchMock.mockResolvedValue(mockTopResponse([]));
    setup();
    await waitFor(() => expect(screen.getByTestId("filter-chips")).toBeInTheDocument());
    expect(screen.queryByTestId("chip-regional")).toBeNull();
    expect(screen.queryByTestId("chip-friends")).toBeNull();
    expect(screen.getByTestId("chip-global")).toBeInTheDocument();
  });

  it("requests period=weekly when Weekly chip clicked", async () => {
    fetchMock.mockResolvedValue(mockTopResponse([]));
    setup();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fetchMock.mockClear();
    // Filter chips render "Weekly" as text — click it.
    const weeklyBtn = screen.getByText("Weekly");
    weeklyBtn.click();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const url = fetchMock.mock.calls[0][0];
    expect(url).toMatch(/period=weekly/);
  });

  it("does NOT show AlertBar on /leaderboard", () => {
    fetchMock.mockResolvedValue(mockTopResponse([]));
    setup();
    expect(screen.queryByTestId("alert-bar")).toBeNull();
  });
});
