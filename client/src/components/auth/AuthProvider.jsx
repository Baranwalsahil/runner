import { createContext, useCallback, useEffect, useState } from "react";
import { apiJson, clearToken, getToken, saveToken } from "../../lib/auth.js";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      const t = getToken();
      if (!t) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const me = await apiJson("/auth/me");
        if (!cancelled) {
          setUser(me);
          setToken(t);
        }
      } catch {
        if (!cancelled) {
          clearToken();
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    const data = await apiJson("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    saveToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const signUp = useCallback(async ({ email, username, password }) => {
    const data = await apiJson("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
    });
    saveToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiJson("/auth/logout", { method: "POST" });
    } catch {
      // ignore — token is being discarded client-side anyway
    }
    clearToken();
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (patch) => {
    const updated = await apiJson("/users/me", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setUser(updated);
    return updated;
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, signIn, signUp, signOut, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
