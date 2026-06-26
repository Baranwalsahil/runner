import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AppLayout from "../components/AppLayout.jsx";
import Dashboard from "../routes/Dashboard.jsx";
import { withAuth } from "./utils/withAuth.jsx";

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } })
    )
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function setup({ user = null } = {}) {
  return render(
    withAuth(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
        </Routes>
      </MemoryRouter>,
      { user }
    )
  );
}

describe("Dashboard route", () => {
  it("mounts all dashboard blocks", () => {
    setup();
    expect(screen.getByTestId("territory-dominance")).toBeInTheDocument();
    expect(screen.getByTestId("quick-run-stats")).toBeInTheDocument();
    expect(screen.getByTestId("territory-map-preview")).toBeInTheDocument();
    expect(screen.getByTestId("selected-run-metrics")).toBeInTheDocument();
    expect(screen.queryByTestId("recent-battles")).toBeNull();
  });

  it("includes the ELEV metric in all-time run stats", () => {
    setup();
    // buildAllTimeStats always emits an ELEV row (— when no samples).
    expect(screen.getByText("ELEV")).toBeInTheDocument();
  });

  it("shows AlertBar with contested message on /dashboard", () => {
    setup();
    expect(screen.getByTestId("alert-bar")).toBeInTheDocument();
    expect(screen.getByText(/SECTOR B-4: CONTESTED BY @RUNNER_X/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "RECLAIM" })).toBeInTheDocument();
  });

  it("clicking a chart bar updates the displayed cell count to that run's cells_claimed", async () => {
    const RUN_ID = "aaaaaaaa-0000-0000-0000-000000000001";
    // Use distinct values that can't be confused: total=100, run=42.
    const TOTAL_CELLS = 100;
    const RUN_CELLS = 42;

    // Mock fetch per URL path.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url) => {
        const u = typeof url === "string" ? url : url.toString();
        if (u.includes("/auth/me")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({ id: "user-1", username: "tester", total_cells: TOTAL_CELLS }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            )
          );
        }
        if (u.includes(`/runs/${RUN_ID}/detail`)) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                id: RUN_ID,
                cells_claimed: RUN_CELLS,
                cells: [],
                started_at: new Date().toISOString(),
                ended_at: new Date().toISOString(),
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            )
          );
        }
        if (u.includes("/runs")) {
          return Promise.resolve(
            new Response(
              JSON.stringify([
                {
                  id: RUN_ID,
                  cells_claimed: RUN_CELLS,
                  started_at: new Date().toISOString(),
                  ended_at: new Date().toISOString(),
                },
              ]),
              { status: 200, headers: { "Content-Type": "application/json" } }
            )
          );
        }
        // territory and anything else — return empty array
        return Promise.resolve(
          new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } })
        );
      })
    );

    const user = { id: "user-1", username: "tester" };
    render(
      withAuth(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
          </Routes>
        </MemoryRouter>,
        { user }
      )
    );

    // Wait until the run list loads and the chart bar renders with a runId.
    const bar = await waitFor(() => {
      const bars = screen.getAllByTestId("chart-bar");
      const clickable = bars.find((b) => !b.disabled);
      if (!clickable) throw new Error("no clickable bar yet");
      return clickable;
    });

    // Helper: get the CELLS.OWNED headline value from inside the TerritoryDominance panel.
    const { getByTestId } = screen;
    const getCellsHeadline = () => {
      const panel = getByTestId("territory-dominance");
      // The headline is the <h1> — its first text node is the number.
      return panel.querySelector("h1").firstChild.textContent.trim();
    };

    // Before any explicit click the count shows the all-time total (isExplicitSelection=false).
    await waitFor(() => {
      expect(getCellsHeadline()).toBe(TOTAL_CELLS.toLocaleString());
    });

    // Click the bar — sets selectedRunId → isExplicitSelection = true.
    fireEvent.click(bar);

    // After clicking, displayedCells should switch to the run's cells_claimed.
    await waitFor(() => {
      expect(getCellsHeadline()).toBe(RUN_CELLS.toLocaleString());
    });

    // Click the same bar again → toggles off (selectedRunId → null).
    fireEvent.click(bar);

    // After de-selecting, displayedCells should revert to the all-time total.
    await waitFor(() => {
      expect(getCellsHeadline()).toBe(TOTAL_CELLS.toLocaleString());
    });
  });
});
