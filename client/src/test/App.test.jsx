import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { withAuth } from "./utils/withAuth.jsx";

vi.mock("maplibre-gl", () => import("./__mocks__/maplibre-gl.js"));

const { default: AppLayout } = await import("../components/AppLayout.jsx");
const { default: Landing } = await import("../routes/Landing.jsx");
const { default: Dashboard } = await import("../routes/Dashboard.jsx");
const { default: Battlefield } = await import("../routes/Battlefield.jsx");
const { default: Leaderboard } = await import("../routes/Leaderboard.jsx");

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ rows: [], total: 0, limit: 50, offset: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    )
  );
});

afterEach(() => vi.unstubAllGlobals());

function appAt(path) {
  return render(
    withAuth(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/battlefield" element={<Battlefield />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Route>
        </Routes>
      </MemoryRouter>,
      { user: { id: "me", email: "me@example.com", username: "me" } }
    )
  );
}

describe("App routing", () => {
  it("route / shows Landing hero", () => {
    appAt("/");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("DOMINATE THE GRID");
  });

  it("route /dashboard shows dashboard panels", () => {
    Element.prototype.scrollIntoView = vi.fn();
    appAt("/dashboard");
    expect(screen.getByTestId("territory-dominance")).toBeInTheDocument();
  });

  it("route /battlefield shows battlefield section", () => {
    appAt("/battlefield");
    expect(screen.getByTestId("battlefield")).toBeInTheDocument();
  });

  it("route /leaderboard shows Territory Lords heading", () => {
    appAt("/leaderboard");
    expect(screen.getByRole("heading", { name: /Territory Lords/ })).toBeInTheDocument();
  });

  it("chrome persists across routes", () => {
    appAt("/leaderboard");
    expect(screen.getByTestId("top-nav")).toBeInTheDocument();
    expect(screen.getByTestId("fab")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });
});
