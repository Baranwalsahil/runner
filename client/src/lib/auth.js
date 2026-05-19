const TOKEN_KEY = "tr_token";

export function saveToken(token) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export function apiBaseUrl() {
  return import.meta.env.VITE_API_URL || "http://localhost:8000";
}

export async function apiFetch(path, opts = {}) {
  const url = `${apiBaseUrl()}${path}`;
  const headers = new Headers(opts.headers || {});
  if (!headers.has("Content-Type") && opts.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const resp = await fetch(url, { ...opts, headers });
  if (resp.status === 401) {
    clearToken();
    if (typeof window !== "undefined" && window.location.pathname !== "/auth") {
      window.location.assign("/auth");
    }
  }
  return resp;
}

export async function apiJson(path, opts = {}) {
  const resp = await apiFetch(path, opts);
  let body = null;
  try {
    body = await resp.json();
  } catch {
    body = null;
  }
  if (!resp.ok) {
    const err = new Error(body?.message || body?.error || `HTTP ${resp.status}`);
    err.status = resp.status;
    err.body = body;
    throw err;
  }
  return body;
}
