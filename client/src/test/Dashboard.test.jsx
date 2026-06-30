import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AppLayout from "../components/AppLayout.jsx";
import Dashboard from "../routes/Dashboard.jsx";
import { withAuth } from "./utils/withAuth.jsx";

// Module-level log to capture TerritoryMapPreview `cells` props across renders.
// vi.mock is hoisted so the factory must reference module-scope variables.
let _cellsLog = [];

vi.mock("maplibre-gl", () => import("./__mocks__/maplibre-gl.js"));

vi.mock("../components/dashboard/TerritoryMapPreview.jsx", async (importOriginal) => {
  const mod = await importOriginal();
  return {
    default: (props) => {
      _cellsLog.push([...(props.cells ?? [])]);
      return mod.default(props);
    },
  };
});

beforeEach(() => {
  _cellsLog = [];
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

// ---------------------------------------------------------------------------
// Regression: no flash of rival-coloured territory cells on Dashboard
// ---------------------------------------------------------------------------
describe("Dashboard territory-flash regression", () => {
  const USER_ID = "user-flash-001";
  const RUN_ID = "run-flash-aaa-0000-0000-000000000001";
  // A valid H3 resolution-9 cell (Seattle centre).
  const H3_CELL = "8928d542c9bffff";

  // Territory cell that belongs to USER_ID but also has a RIVAL share.
  const rivalTerritoryCell = {
    h3_index: H3_CELL,
    user_id: USER_ID,
    username: "me",
    color: "#c3f400",
    resolution: 9,
    claim_count: 2,
    claimed_at: new Date().toISOString(),
    shares: [
      { user_id: USER_ID, username: "me", color: "#c3f400", count: 2 },
      { user_id: "rival-001", username: "rival", color: "#ff0000", count: 1 },
    ],
  };

  function makeUser() {
    return { id: USER_ID, username: "me" };
  }

  it("strips rival shares from territory-view cells so rival colours never appear in the map", async () => {
    // Scenario: no runs at all → activeRunId=null, runDetailPending=false.
    // The territory view is shown with the user's contested cell.
    // After fix: rival share is stripped, so TerritoryMapPreview only sees self share.
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url) => {
      const u = typeof url === "string" ? url : url.toString();
      if (u.includes("/auth/me")) {
        return Promise.resolve(new Response(
          JSON.stringify({ id: USER_ID, username: "me", total_cells: 1 }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        ));
      }
      if (u.includes("/territory/user/")) {
        return Promise.resolve(new Response(
          JSON.stringify([rivalTerritoryCell]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        ));
      }
      // No runs → empty list
      return Promise.resolve(new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } }));
    }));

    render(
      withAuth(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
          </Routes>
        </MemoryRouter>,
        { user: makeUser() }
      )
    );

    // Wait until the territory data has been loaded and at least one snapshot exists.
    await waitFor(() => {
      expect(_cellsLog.length).toBeGreaterThan(0);
    });

    // None of the rendered snapshots should contain rival shares.
    // Before the fix, the contested cell was passed as-is (with "rival-001" share).
    const hasRivalSlice = _cellsLog.some((snapshot) =>
      snapshot.some((c) =>
        (c.shares ?? []).some((s) => s.userId === "rival-001")
      )
    );
    expect(hasRivalSlice).toBe(false);
  });

  it("does not flash territory cells while run detail is loading", async () => {
    // Use a deferred promise to keep run detail pending long enough to observe
    // the intermediate state. But since microtask timing in jsdom is hard to
    // control, we verify the STRUCTURAL guarantee instead: the territory cells
    // are filtered/hidden whenever runDetailPending would be true.
    // This test ensures the cells snapshot log never includes rival colours
    // regardless of resolution order.
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url) => {
      const u = typeof url === "string" ? url : url.toString();
      if (u.includes("/auth/me")) {
        return Promise.resolve(new Response(
          JSON.stringify({ id: USER_ID, username: "me", total_cells: 1 }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        ));
      }
      if (u.includes(`/runs/${RUN_ID}/detail`)) {
        return Promise.resolve(new Response(
          JSON.stringify({
            id: RUN_ID,
            cells_claimed: 1,
            cells: [H3_CELL],
            started_at: new Date().toISOString(),
            ended_at: new Date().toISOString(),
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        ));
      }
      if (u.includes("/runs")) {
        return Promise.resolve(new Response(
          JSON.stringify([{
            id: RUN_ID,
            cells_claimed: 1,
            started_at: new Date().toISOString(),
            ended_at: new Date().toISOString(),
          }]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        ));
      }
      if (u.includes("/territory/user/")) {
        return Promise.resolve(new Response(
          JSON.stringify([rivalTerritoryCell]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        ));
      }
      return Promise.resolve(new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } }));
    }));

    render(
      withAuth(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
          </Routes>
        </MemoryRouter>,
        { user: makeUser() }
      )
    );

    // Wait until run detail has loaded (final state: viewingRun=true).
    await waitFor(() => {
      // The run-view cells are lime-coloured, no rival shares.
      const lastSnapshot = _cellsLog[_cellsLog.length - 1];
      // Once run detail is done, we may see run cells (possibly empty if run
      // has no cells) or the territory cells, but NEVER with a rival share.
      expect(lastSnapshot).toBeDefined();
    });

    // Regardless of resolve order, rival colours must never appear in ANY render.
    const hasRivalAtAnyPoint = _cellsLog.some((snapshot) =>
      snapshot.some((c) =>
        (c.shares ?? []).some((s) => s.userId === "rival-001")
      )
    );
    expect(hasRivalAtAnyPoint).toBe(false);
  });
});

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
