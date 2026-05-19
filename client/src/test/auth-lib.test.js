import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiBaseUrl,
  apiFetch,
  apiJson,
  clearToken,
  getToken,
  saveToken,
} from "../lib/auth.js";

describe("auth.js token storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saveToken + getToken round-trip", () => {
    saveToken("abc.def.ghi");
    expect(getToken()).toBe("abc.def.ghi");
  });

  it("clearToken removes value", () => {
    saveToken("x");
    clearToken();
    expect(getToken()).toBeNull();
  });
});

describe("auth.js apiBaseUrl", () => {
  it("falls back to localhost when env missing", () => {
    expect(apiBaseUrl()).toMatch(/^https?:\/\//);
  });
});

describe("auth.js apiFetch", () => {
  let fetchMock;

  beforeEach(() => {
    window.localStorage.clear();
    fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sets Content-Type when body present", async () => {
    await apiFetch("/auth/login", { method: "POST", body: "{}" });
    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("attaches Authorization header when token saved", async () => {
    saveToken("tok123");
    await apiFetch("/auth/me");
    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.get("Authorization")).toBe("Bearer tok123");
  });

  it("does not attach Authorization when no token", async () => {
    await apiFetch("/auth/me");
    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.get("Authorization")).toBeNull();
  });

  it("clears token on 401 response", async () => {
    saveToken("expired");
    fetchMock.mockResolvedValueOnce(
      new Response("{}", { status: 401, headers: { "Content-Type": "application/json" } })
    );
    // Stub assign so jsdom doesn't navigate
    const assignSpy = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...window.location, pathname: "/dashboard", assign: assignSpy },
      writable: true,
    });
    await apiFetch("/auth/me");
    expect(getToken()).toBeNull();
    expect(assignSpy).toHaveBeenCalledWith("/auth");
  });
});

describe("auth.js apiJson", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed body on 2xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ user: { id: "1" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    const out = await apiJson("/x");
    expect(out.user.id).toBe("1");
  });

  it("throws Error with message on non-2xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Invalid credentials" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    await expect(apiJson("/x")).rejects.toThrow("Invalid credentials");
  });
});
