import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext } from "../components/auth/AuthProvider.jsx";
import ProtectedRoute from "../components/auth/ProtectedRoute.jsx";

function renderWithAuth({ user, loading = false, path = "/dashboard" }) {
  return render(
    <AuthContext.Provider
      value={{ user, loading, token: user ? "tok" : null, signIn: () => {}, signUp: () => {}, signOut: () => {} }}
    >
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div data-testid="protected-child">SECRET</div>
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<div data-testid="auth-page">SIGN IN</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("<ProtectedRoute>", () => {
  it("renders Loading… while hydrating", () => {
    renderWithAuth({ user: null, loading: true });
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });

  it("redirects to /auth when no user", () => {
    renderWithAuth({ user: null, loading: false });
    expect(screen.getByTestId("auth-page")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-child")).not.toBeInTheDocument();
  });

  it("renders children when user present", () => {
    renderWithAuth({ user: { id: "u1", email: "x@x.com", username: "x" }, loading: false });
    expect(screen.getByTestId("protected-child")).toBeInTheDocument();
  });
});
