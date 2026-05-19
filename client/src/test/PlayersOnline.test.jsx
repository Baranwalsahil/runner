import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PlayersOnline from "../components/battlefield/PlayersOnline.jsx";

describe("PlayersOnline", () => {
  it("renders empty-state message when no players provided", () => {
    render(<PlayersOnline />);
    expect(screen.queryAllByTestId("player-row")).toHaveLength(0);
    expect(screen.getByText(/No runners yet/i)).toBeInTheDocument();
  });

  it("renders rows from custom players prop", () => {
    render(
      <PlayersOnline
        players={[
          { id: "a", handle: "@A", cells: 1 },
          { id: "b", handle: "@B", cells: 2 },
        ]}
      />
    );
    expect(screen.getAllByTestId("player-row")).toHaveLength(2);
    expect(screen.getByText("@A")).toBeInTheDocument();
  });
});
