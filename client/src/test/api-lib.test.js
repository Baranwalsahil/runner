import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adaptApiCell, leaderboard, territory } from "../lib/api.js";

describe("adaptApiCell", () => {
  it("maps API row to MapCanvas cell shape", () => {
    const out = adaptApiCell({
      h3_index: "8928d542c9bffff",
      user_id: "abc",
      username: "runner",
      color: "#00dbe9",
      resolution: 9,
      claim_count: 2,
      claimed_at: "2026-05-19T12:00:00",
    });
    expect(out.h3Index).toBe("8928d542c9bffff");
    expect(out.ownerId).toBe("abc");
    expect(out.owner).toBe("@runner");
    expect(out.color).toBe("#00dbe9");
    expect(out.ownership).toBe(70);
  });

  it("defaults missing username + color", () => {
    const out = adaptApiCell({
      h3_index: "x",
      user_id: null,
      username: null,
      color: null,
      resolution: 9,
      claim_count: 1,
      claimed_at: "2026-05-19T12:00:00",
    });
    expect(out.owner).toBe("@unclaimed");
    expect(out.color).toBe("#c3f400");
  });
});

describe("territory client", () => {
  let fetchMock;
  beforeEach(() => {
    window.localStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("builds bounds query string from object", async () => {
    fetchMock.mockResolvedValue(
      new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } })
    );
    await territory.list({
      sw_lat: 47.6,
      sw_lng: -122.34,
      ne_lat: 47.62,
      ne_lng: -122.32,
    });
    const url = fetchMock.mock.calls[0][0];
    expect(url).toMatch(/bounds=47\.6,-122\.34,47\.62,-122\.32/);
  });

  it("adapts response rows", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            h3_index: "x1",
            user_id: "u1",
            username: "alpha",
            color: "#c3f400",
            resolution: 9,
            claim_count: 1,
            claimed_at: "2026-05-19T12:00:00",
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    const out = await territory.list({ sw_lat: 0, sw_lng: 0, ne_lat: 1, ne_lng: 1 });
    expect(out).toHaveLength(1);
    expect(out[0].owner).toBe("@alpha");
  });
});

describe("leaderboard client", () => {
  let fetchMock;
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("passes period + pagination params", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ rows: [], total: 0, limit: 50, offset: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    await leaderboard.top({ limit: 20, offset: 5, period: "weekly" });
    const url = fetchMock.mock.calls[0][0];
    expect(url).toMatch(/limit=20/);
    expect(url).toMatch(/offset=5/);
    expect(url).toMatch(/period=weekly/);
  });
});
